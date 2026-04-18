"""
app.py — Flask application factory with all routes
"""

import os
import logging
import traceback
import sys
import io
from unittest import result
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from config.settings import Config
from config.database import init_db, get_db
from utils.serializer import serialize_doc, serialize_docs
from agents import get_all_trading_agents, get_consensus_agent
import yfinance as yf
from rss_feed import get_indian_news
import pandas as pd
from datetime import datetime, timezone
import uuid
from strategy_parser.strategy_parser import StrategyParser

# Setup logging FIRST before any imports that use it
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create log capture for API responses
class LogCapture:
    def __init__(self):
        self.messages = []
    
    def add(self, message):
        self.messages.append(message)
        print(message)  # Also print to console
    
    def get_all(self):
        return self.messages
    
    def clear(self):
        self.messages = []

# Global log capture for debate/pipeline
log_capture = LogCapture()

# Backtest engine import
try:
    from backtest_engine.dsl_engine import run_dsl_backtest
    from validation_engine.validation_pipeline import run_validation
    log_capture.add("✓ Backtest engine (DSL) loaded successfully")
except ImportError as e:
    logger.error(f"✗ Failed to import backtest engine: {e}")
    traceback.print_exc()
    # Provide a stub if import fails
    def run_dsl_backtest(*args, **kwargs):
        raise ImportError(f"Backtest engine import failed: {e}")

parser = StrategyParser()

def _resp(data=None, error=None, status=200, meta=None):
    """Response helper"""
    return jsonify({
        "success": error is None,
        "data":    data,
        "error":   error,
        "meta":    meta or {},
    }), status


# ── Internal helpers ───────────────────────────────────────────────────────────

_CRYPTO_SUFFIXES = ("-USD", "-USDT", "-BTC", "-ETH")
_ETF_SET         = {"NIFTYBEES.NS", "BANKBEES.NS", "JUNIORBEES.NS", "GOLDBEES.NS", "ITBEES.NS", "INFRABEES.NS"}
_NEWS_FALLBACK_SYMBOLS = {
    "^NSEI": ["NIFTYBEES.NS", "RELIANCE.NS", "TCS.NS"],
    "^FTSE": ["EWU", "VOD", "HSBA.L"],
    "^N225": ["EWJ", "^TOPX", "7203.T"],
    "000001.SS": ["MCHI", "FXI", "BABA"],
    "^HSI": ["EWH", "0700.HK", "9988.HK"],
    "^AXJO": ["EWA", "BHP", "CBA.AX"],
    "^GDAXI": ["EWG", "SAP", "SIE.DE"],
    "^BSESN": ["NIFTYBEES.NS", "INFY.NS", "RELIANCE.NS"],
    "^BVSP": ["EWZ", "VALE", "PBR"],
    "^GSPTSE": ["EWC", "SHOP", "RY"],}

def _detect_asset_class(ticker: str) -> str:
    t = ticker.upper()
    if any(t.endswith(s) for s in _CRYPTO_SUFFIXES): return "crypto"
    if t in _ETF_SET:                                 return "etf"
    if t.startswith("^"):                             return "index"
    if "=X" in t:                                     return "forex"
    return "equity"

def _safe_float(val) -> float:
    try:
        import math
        f = float(val)
        return round(f, 6) if not (math.isnan(f) or math.isinf(f)) else 0.0
    except (TypeError, ValueError):
        return 0.0


# ── Prompt Parser ──────────────────────────────────────────────────────────

def parse_trading_prompt(prompt: str) -> dict:
    """Extract trading parameters from natural language prompt"""
    prompt_lower = prompt.lower()
    
    # Extract ticker with NSE priority (RELIANCE.NS, INFY.NS, etc.)
    import re
    # Try explicit .NS
    ticker_match = re.search(r'\b([A-Za-z]{2,15}\.NS)\b', prompt, flags=re.IGNORECASE)
    ticker = None
    if ticker_match:
        ticker = ticker_match.group(1).upper()
    else:
        # Check explicit keywords
        if "infosys" in prompt_lower or "infy" in prompt_lower.split():
            ticker = "INFY.NS"
        elif "tcs" in prompt_lower.split():
            ticker = "TCS.NS"
        elif "hdfc" in prompt_lower:
            ticker = "HDFCBANK.NS"
        elif "reliance" in prompt_lower:
            ticker = "RELIANCE.NS"
        elif "nifty" in prompt_lower:
            ticker = "^NSEI"
        
        if not ticker:
            excluded = {"RSI", "MACD", "SMA", "EMA", "VWAP", "ATR", "ADX", "BB", "OHLCV", "AI", "ML", "LLM"}
            uppercase_tokens = re.findall(r'\b([A-Z]{2,15})\b', prompt)
            ticker_token = next((tok for tok in uppercase_tokens if tok not in excluded), None)
            ticker = f"{ticker_token}.NS" if ticker_token else "RELIANCE.NS"
    
    # Map timeframes
    timeframe = "1D"
    if "hourly" in prompt_lower or "1h" in prompt_lower:
        timeframe = "1H"
    elif "4h" in prompt_lower or "4-hour" in prompt_lower:
        timeframe = "4H"
    elif "weekly" in prompt_lower or "1w" in prompt_lower:
        timeframe = "1W"
    elif "monthly" in prompt_lower or "1m" in prompt_lower or "month" in prompt_lower:
        timeframe = "1M"
    
    # Determine goal/strategy type
    goal = "alpha generation"
    if "momentum" in prompt_lower:
        goal = "momentum"
    elif "mean reversion" in prompt_lower or "reversion" in prompt_lower:
        goal = "mean_reversion"
    elif "trend" in prompt_lower or "trend follow" in prompt_lower:
        goal = "trend_following"
    elif "breakout" in prompt_lower:
        goal = "breakout"
    elif "macro" in prompt_lower:
        goal = "macro_informed"
    elif "sentiment" in prompt_lower:
        goal = "sentiment_based"
    
    # Determine risk level
    risk_level = "moderate"
    if "high risk" in prompt_lower or "aggressive" in prompt_lower:
        risk_level = "high"
    elif "low risk" in prompt_lower or "conservative" in prompt_lower or "safe" in prompt_lower:
        risk_level = "low"
    
    # Determine holding period/style
    style = "swing"
    if "scalp" in prompt_lower or "scalping" in prompt_lower:
        style = "scalp"
    elif "day trade" in prompt_lower or "day trading" in prompt_lower:
        style = "day"
    elif "swing" in prompt_lower or "swing trade" in prompt_lower:
        style = "swing"
    elif "position" in prompt_lower or "long term" in prompt_lower:
        style = "position"
    
    return {
        "asset": ticker.upper(),
        "timeframe": timeframe,
        "goal": goal,
        "risk_level": risk_level,
        "style": style
    }


# ── Indicator Calculator ───────────────────────────────────────────────────

def calculate_indicators(df: pd.DataFrame) -> dict:
    """Calculate technical indicators from OHLCV data"""
    if df.empty or len(df) < 200:
        return {}
    
    df = df.copy()
    close = df['close'].values
    high = df['high'].values
    low = df['low'].values
    volume = df['volume'].values
    
    indicators = {}
    
    # EMA
    try:
        df['ema20'] = df['close'].ewm(span=20).mean()
        df['ema50'] = df['close'].ewm(span=50).mean()
        df['ema200'] = df['close'].ewm(span=200).mean()
        
        indicators['ema20'] = _safe_float(df['ema20'].iloc[-1])
        indicators['ema50'] = _safe_float(df['ema50'].iloc[-1])
        indicators['ema200'] = _safe_float(df['ema200'].iloc[-1])
        indicators['trend_strength'] = "bullish" if indicators['ema20'] > indicators['ema50'] > indicators['ema200'] else "bearish"
    except Exception as e:
        logger.warning(f"EMA calculation failed: {e}")
    
    # RSI (14)
    try:
        delta = pd.Series(close).diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        indicators['rsi'] = _safe_float(rsi.iloc[-1])
    except Exception as e:
        logger.warning(f"RSI calculation failed: {e}")
    
    # MACD
    try:
        ema12 = df['close'].ewm(span=12).mean()
        ema26 = df['close'].ewm(span=26).mean()
        macd = ema12 - ema26
        signal = macd.ewm(span=9).mean()
        indicators['macd'] = _safe_float(macd.iloc[-1])
        indicators['macd_signal'] = _safe_float(signal.iloc[-1])
        indicators['macd_histogram'] = _safe_float((macd - signal).iloc[-1])
        indicators['macd_status'] = "bullish" if macd.iloc[-1] > signal.iloc[-1] else "bearish"
    except Exception as e:
        logger.warning(f"MACD calculation failed: {e}")
    
    # Stochastic
    try:
        period = 14
        lowest_low = pd.Series(low).rolling(period).min()
        highest_high = pd.Series(high).rolling(period).max()
        k_percent = 100 * (close[-1] - lowest_low.iloc[-1]) / (highest_high.iloc[-1] - lowest_low.iloc[-1])
        indicators['stochastic'] = _safe_float(k_percent)
    except Exception as e:
        logger.warning(f"Stochastic calculation failed: {e}")
    
    # ATR (14)
    try:
        tr = pd.DataFrame({
            'hl': high - low,
            'hc': abs(high - close),
            'lc': abs(low - close)
        }).max(axis=1)
        atr = tr.rolling(14).mean()
        indicators['atr'] = _safe_float(atr.iloc[-1])
        indicators['atr_percent'] = _safe_float(100 * atr.iloc[-1] / close[-1])
    except Exception as e:
        logger.warning(f"ATR calculation failed: {e}")
    
    # Bollinger Bands
    try:
        bb_period = 20
        bb_std = 2
        sma = df['close'].rolling(bb_period).mean()
        std = df['close'].rolling(bb_period).std()
        bb_upper = sma + (std * bb_std)
        bb_lower = sma - (std * bb_std)
        bb_mid = sma
        
        indicators['bb_upper'] = _safe_float(bb_upper.iloc[-1])
        indicators['bb_mid'] = _safe_float(bb_mid.iloc[-1])
        indicators['bb_lower'] = _safe_float(bb_lower.iloc[-1])
        indicators['bb_width'] = _safe_float((bb_upper - bb_lower).iloc[-1] / bb_mid.iloc[-1])
    except Exception as e:
        logger.warning(f"Bollinger Bands calculation failed: {e}")
    
    # Volume
    try:
        vol_sma = pd.Series(volume).rolling(20).mean()
        indicators['volume'] = int(volume[-1])
        indicators['volume_avg'] = int(vol_sma.iloc[-1])
        indicators['volume_spike'] = _safe_float(volume[-1] / vol_sma.iloc[-1])
    except Exception as e:
        logger.warning(f"Volume calculation failed: {e}")
    
    # Support/Resistance
    try:
        recent = df.tail(50)
        indicators['support'] = _safe_float(recent['low'].min())
        indicators['resistance'] = _safe_float(recent['high'].max())
        indicators['current_price'] = _safe_float(close[-1])
    except Exception as e:
        logger.warning(f"Support/Resistance calculation failed: {e}")
    
    return indicators

def _parse_news_timestamp(raw_value) -> float:
    if raw_value is None:
        return 0

    if isinstance(raw_value, (int, float)):
        return float(raw_value)

    if isinstance(raw_value, str):
        value = raw_value.strip()
        if not value:
            return 0

        if value.isdigit():
            return float(value)

        for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"):
            try:
                dt = datetime.strptime(value, fmt)
                return dt.replace(tzinfo=timezone.utc).timestamp()
            except ValueError:
                pass

        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.timestamp()
        except ValueError:
            return 0

    return 0


def _normalize_news_item(item, fallback_id: int):
    if not isinstance(item, dict):
        return None

    payload = item.get("content") if isinstance(item.get("content"), dict) else item

    url = ""
    click_url = payload.get("clickThroughUrl")
    canonical_url = payload.get("canonicalUrl")
    if isinstance(click_url, dict):
        url = click_url.get("url", "")
    if not url and isinstance(canonical_url, dict):
        url = canonical_url.get("url", "")
    if not url:
        url = payload.get("link", "")

    title = payload.get("title") or item.get("title") or ""
    if not title:
        return None

    provider = payload.get("provider") if isinstance(payload.get("provider"), dict) else {}
    publisher = (
        provider.get("displayName")
        or payload.get("publisher")
        or item.get("publisher")
        or "News"
    )

    raw_timestamp = (
        payload.get("pubDate")
        or payload.get("providerPublishTime")
        or item.get("providerPublishTime")
    )

    return {
        "uuid": str(payload.get("id") or item.get("uuid") or item.get("id") or fallback_id),
        "title": str(title),
        "publisher": str(publisher),
        "link": str(url),
        "providerPublishTime": _parse_news_timestamp(raw_timestamp),
        "type": str(payload.get("contentType") or item.get("type") or "STORY"),
    }


def _fetch_news_for_symbol(symbol: str, limit: int = 12):
    formatted = []
    
    # Intercept Indian indices/tickers
    if symbol.startswith('^BSESN') or symbol.startswith('^NSEI') or symbol.endswith('.NS') or symbol.endswith('.BO'):
        try:
            return get_indian_news()
        except:
            pass

    # Fallback to standard yahoo finance fetch logic
    ticker = yf.Ticker(symbol)
    raw_news = ticker.news if hasattr(ticker, "news") else []

    if not isinstance(raw_news, list):
        return formatted

    for idx, item in enumerate(raw_news[:30]):
        normalized = _normalize_news_item(item, idx)
        if not normalized:
            continue
        if not normalized["link"]:
            continue

        formatted.append(normalized)
        if len(formatted) >= limit:
            break

    return formatted
    
    


# ── Market Statistics ──────────────────────────────────────────────────────

def calculate_statistics(df: pd.DataFrame) -> dict:
    """Calculate market statistics"""
    if df.empty or len(df) < 30:
        return {}
    
    stats = {}
    
    try:
        # Price returns
        returns = df['close'].pct_change().dropna()
        stats['avg_return'] = _safe_float(returns.mean())
        stats['volatility'] = _safe_float(returns.std())
        stats['sharpe'] = _safe_float(returns.mean() / returns.std() * (252 ** 0.5)) if returns.std() > 0 else 0
        
        # Drawdown
        cumulative = (1 + returns).cumprod()
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        stats['max_drawdown'] = _safe_float(drawdown.min())
        
        # Win ratio
        wins = (returns > 0).sum()
        stats['win_rate'] = _safe_float(wins / len(returns))
        
        # Trend
        close_50 = df['close'].iloc[-50:].mean()
        close_200 = df['close'].iloc[-200:].mean() if len(df) >= 200 else close_50
        stats['trend_direction'] = "up" if close_50 > close_200 else "down"
        
    except Exception as e:
        logger.warning(f"Statistics calculation failed: {e}")
    
    return stats


# ── Macro Context Fetcher ─────────────────────────────────────────────────

def get_macro_context() -> dict:
    """Fetch latest macro data from MongoDB"""
    db = get_db()
    macro = {}
    
    try:
        # VIX
        vix = db.macro_data.find_one({"series_id": "VIXCLS"}, sort=[("date", -1)])
        if vix:
            macro['vix'] = _safe_float(vix.get('value', 0))
        
        # 10Y Yield
        dgs10 = db.macro_data.find_one({"series_id": "DGS10"}, sort=[("date", -1)])
        if dgs10:
            macro['10y_yield'] = _safe_float(dgs10.get('value', 0))
        
        # 2Y Yield
        dgs2 = db.macro_data.find_one({"series_id": "DGS2"}, sort=[("date", -1)])
        if dgs2:
            macro['2y_yield'] = _safe_float(dgs2.get('value', 0))
        
        # Yield curve
        if macro.get('10y_yield') and macro.get('2y_yield'):
            macro['yield_curve'] = _safe_float(macro['10y_yield'] - macro['2y_yield'])
    
    except Exception as e:
        logger.warning(f"Macro context fetch failed: {e}")
    
    return macro


# ── Trading Strategy Debate Pipeline ───────────────────────────────────────

def get_agents_by_names(agent_names: list) -> list:
    """Get specific agents by their names"""
    all_agents = get_all_trading_agents()
    agent_map = {agent.name: agent for agent in all_agents}
    
    selected = []
    for name in agent_names:
        if name in agent_map:
            selected.append(agent_map[name])
        else:
            logger.warning(f"Agent '{name}' not found, skipping")
    
    return selected if selected else all_agents[:4]  # Fallback to first 4


def get_default_agents_for_goal(goal: str) -> list:
    """Get recommended agents based on strategy goal"""
    defaults = {
        "momentum": ["MomentumAgent", "VolatilityAgent", "RiskManagementAgent", "StrategySimplifierAgent"],
        "mean_reversion": ["MeanReversionAgent", "VolatilityAgent", "RiskManagementAgent", "LiquidityAgent"],
        "trend_following": ["TrendFollowingAgent", "MarketRegimeAgent", "RiskManagementAgent", "StrategySimplifierAgent"],
        "breakout": ["BreakoutAgent", "VolumeAnalysisAgent", "LiquidityAgent", "RiskManagementAgent"],
        "alpha": ["TrendFollowingAgent", "MomentumAgent", "StatisticalSignalAgent", "RiskManagementAgent"],
        "macro_informed": ["MacroAgent", "MarketRegimeAgent", "TrendFollowingAgent", "RiskManagementAgent"],
        "sentiment_based": ["SentimentAgent", "MomentumAgent", "MarketRegimeAgent", "RiskManagementAgent"],
    }
    
    agent_names = defaults.get(goal.lower(), 
        ["TrendFollowingAgent", "MomentumAgent", "RiskManagementAgent", "VolatilityAgent"])
    
    return get_agents_by_names(agent_names)


def run_trading_strategy_debate(trading_request: dict) -> dict:
    """
    Run 2-round debate to design trading strategy
    
    ROUND 1: Each selected agent proposes strategy components
    ROUND 2: Each selected agent critiques other proposals
    
    Returns: Structured debate results and final strategy
    """
    
    # Clear log capture for this debate
    log_capture.clear()
    
    # ── Extract trading parameters ────────────────────────────────────────
    asset = trading_request.get("asset", "UNKNOWN")
    timeframe = trading_request.get("timeframe", "1D")
    goal = trading_request.get("goal", "alpha generation")
    risk_level = trading_request.get("risk_level", "moderate")
    capital = trading_request.get("capital", 100000)
    market = trading_request.get("market", "equity")
    selected_agent_names = trading_request.get("selected_agents", [])
    
    topic = f"{asset} ({market}, {timeframe} timeframe, {goal} goal, {risk_level} risk)"
    
    msg = f"Starting trading strategy debate for: {topic}"
    log_capture.add(msg)
    logger.info(msg)
    
    # Get agents: either user-selected or defaults based on goal
    if selected_agent_names:
        agents = get_agents_by_names(selected_agent_names)
        msg = f"Using {len(agents)} user-selected agents"
        log_capture.add(msg)
        logger.info(msg)
    else:
        agents = get_default_agents_for_goal(goal)
        msg = f"Using {len(agents)} default agents for goal: {goal}"
        log_capture.add(msg)
        logger.info(msg)
    
    debate_results = {}
    
    # ROUND 1: PROPOSALS
    msg = f"ROUND 1: {len(agents)} agents generating proposals..."
    log_capture.add(msg)
    logger.info(msg)
    
    round_1_arguments = {}
    
    for agent in agents:
        try:
            # Pass the full trading_request (debate_payload) as context for rich data access
            proposal = agent.generate_argument(topic, trading_request)
            round_1_arguments[agent.name] = proposal
            debate_results[agent.name] = {
                "role": agent.name,
                "round_1": proposal
            }
            
            # Extract and format the agent's actual proposal for conversation
            if isinstance(proposal, dict):
                argument = proposal.get("argument", str(proposal)[:200])
                stance = proposal.get("stance", "moderate")
            else:
                argument = str(proposal)[:200]
                stance = "moderate"
            
            # Format as conversational message with agent's view
            conversation_msg = f"💭 {agent.name}: I propose using {stance} approach. {argument}..."
            log_capture.add(conversation_msg)
            logger.info(f"  ✓ {agent.name} proposal generated")
            
        except Exception as e:
            msg = f"  ✗ {agent.name} failed: {str(e)}"
            log_capture.add(msg)
            logger.error(msg)
            debate_results[agent.name] = {
                "role": agent.name,
                "round_1": {"argument": f"Error: {str(e)}", "stance": "ERROR"}
            }
    
    # ROUND 2: CRITIQUES & REFINEMENT
    msg = f"ROUND 2: Agents critiquing proposals..."
    log_capture.add(msg)
    logger.info(msg)
    
    round_2_critiques = {}
    context = {"agent_arguments": round_1_arguments}
    
    for agent in agents:
        try:
            # Only critique if agent had successful proposal
            if agent.name in round_1_arguments:
                critique = agent.generate_rebuttal(topic, context)
                round_2_critiques[agent.name] = critique
                debate_results[agent.name]["round_2"] = critique
                
                # Extract and format the agent's critique for conversation
                if isinstance(critique, dict):
                    criticism = critique.get("argument", critique.get("critique", str(critique)[:200]))
                else:
                    criticism = str(critique)[:200]
                
                # Format as conversational critque message
                conversation_msg = f"🔍 {agent.name} refines: {criticism}..."
                log_capture.add(conversation_msg)
                logger.info(f"  ✓ {agent.name} critique generated")
                
        except Exception as e:
            msg = f"  ✗ {agent.name} failed in Round 2: {str(e)}"
            log_capture.add(msg)
            logger.error(msg)
            debate_results[agent.name]["round_2"] = {
                "argument": f"Error: {str(e)}",
                "stance": "ERROR"
            }
    
    # CONSENSUS: SYNTHESIZE FINAL STRATEGY
    msg = f"CONSENSUS: Synthesizing final trading strategy..."
    log_capture.add(msg)
    logger.info(msg)
    
    try:
        consensus_agent = get_consensus_agent()
        strategy_result = consensus_agent.synthesize_strategy(topic, round_1_arguments)
        
        final_strategy = strategy_result.get("strategy", {})
        
        # Format consensus message conversationally
        consensus_msg = f"✨ Consensus Reached: All agents agree on a unified strategy with {len(final_strategy)} key components"
        log_capture.add(consensus_msg)
        logger.info(f"  ✓ Final strategy synthesized successfully")
        
        return {
            "success": True,
            "topic": topic,
            "trading_request": trading_request,
            "debate": debate_results,
            "strategy": final_strategy,
            "agents_used": [agent.name for agent in agents],
            "debate_log": log_capture.get_all(),  # Return debate messages
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        msg = f"  ✗ Consensus synthesis failed: {str(e)}"
        log_capture.add(msg)
        logger.error(msg)
        
        # Fallback strategy
        fallback_strategy = {
            "entry_rules": ["Unable to synthesize - see agent proposals"],
            "exit_rules": ["Review agent consensus"],
            "indicators": ["Manual review needed"],
            "filters": [],
            "risk_management": {
                "position_size": "2-5%",
                "stop_loss": "2-3%",
                "take_profit": "5-10%"
            },
            "error": str(e)
        }
        
        return {
            "success": False,
            "topic": topic,
            "trading_request": trading_request,
            "debate": debate_results,
            "strategy": fallback_strategy,
            "agents_used": [agent.name for agent in agents],
            "debate_log": log_capture.get_all(),  # Return debate messages even on failure
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }



def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS — allow all origins in dev, tighten in prod
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # MongoDB
    init_db(app)

    # Live Paper Trading Engine Background Service
    try:
        from services.paper_trading import paper_trading_engine
        paper_trading_engine.start()
        logger.info("Paper Trading background engine started")
    except Exception as e:
        logger.error(f"Failed to start paper trading engine: {e}")

    # ── Root health check ──────────────────────────────────────────────────────
    @app.get("/health")
    def health():
        return jsonify({
            "status":  "ok",
            "version": "1.0.0",
            "env":     os.getenv("FLASK_ENV", "development"),
        })

    # ── Data health ────────────────────────────────────────────────────────────
    @app.get("/api/data/health")
    def data_health():
        """GET /api/data/health — quick check: DB up + doc counts."""
        db = get_db()
        try:
            collections = {
                col: db[col].count_documents({})
                for col in ["ohlcv", "indicators", "macro_data",
                            "ticker_metadata", "pipeline_runs"]
            }
            tickers = db.ohlcv.distinct("ticker")
            return _resp(data={
                "db_connected":  True,
                "collections":   collections,
                "tickers_in_db": tickers,
            })
        except Exception as e:
            return _resp(error=str(e), status=500)

    # ── List tickers ───────────────────────────────────────────────────────────
    @app.get("/api/data/tickers")
    def list_tickers():
        """
        GET /api/data/tickers?asset_class=equity
        Returns all tickers stored in ohlcv collection with their stats.
        """
        db = get_db()
        asset_class = request.args.get("asset_class")

        match = {}
        if asset_class:
            match["asset_class"] = asset_class.lower()

        pipeline = [
            {"$match": match} if match else {"$match": {}},
            {"$group": {
                "_id":        "$ticker",
                "asset_class": {"$first": "$asset_class"},
                "count":      {"$sum": 1},
                "first_date": {"$min": "$date"},
                "last_date":  {"$max": "$date"},
                "source":     {"$first": "$source"},
            }},
            {"$sort": {"_id": 1}},
        ]

        docs = list(db.ohlcv.aggregate(pipeline))
        result = [
            {
                "ticker":      d["_id"],
                "asset_class": d.get("asset_class", "unknown"),
                "bar_count":   d["count"],
                "first_date":  d["first_date"].isoformat() if d.get("first_date") else None,
                "last_date":   d["last_date"].isoformat()  if d.get("last_date")  else None,
                "source":      d.get("source", ""),
            }
            for d in docs
        ]
        return _resp(data=result, meta={"total": len(result)})

    # ── OHLCV query ────────────────────────────────────────────────────────────
    @app.get("/api/data/ohlcv/<ticker>")
    def get_ohlcv(ticker: str):
        """
        GET /api/data/ohlcv/INFY.NS
        GET /api/data/ohlcv/INFY.NS?start=2024-01-01&end=2024-12-31
        GET /api/data/ohlcv/INFY.NS?limit=100
        Returns sorted OHLCV bars for a ticker.
        """
        db    = get_db()
        start = request.args.get("start")
        end   = request.args.get("end")
        limit = min(int(request.args.get("limit", 500)), 5000)

        query = {"ticker": ticker.upper()}
        date_filter = {}
        if start:
            date_filter["$gte"] = pd.Timestamp(start, tz="UTC").to_pydatetime()
        if end:
            date_filter["$lte"] = pd.Timestamp(end, tz="UTC").to_pydatetime()
        if date_filter:
            query["date"] = date_filter

        docs = list(
            db.ohlcv.find(query, {"_id": 0})
                    .sort("date", 1)
                    .limit(limit)
        )

        if not docs:
            return _resp(
                error=f"No data for '{ticker.upper()}'. "
                      f"Run POST /api/data/fetch with ticker='{ticker.upper()}' first.",
                status=404,
            )

        return _resp(
            data=serialize_docs(docs),
            meta={
                "ticker":     ticker.upper(),
                "count":      len(docs),
                "first_date": docs[0]["date"].isoformat()  if docs else None,
                "last_date":  docs[-1]["date"].isoformat() if docs else None,
            },
        )

    @app.get("/api/data/ohlcv/<ticker>/latest")
    def get_ohlcv_latest(ticker: str):
        """GET /api/data/ohlcv/INFY.NS/latest — most recent bar."""
        db  = get_db()
        doc = db.ohlcv.find_one({"ticker": ticker.upper()}, {"_id": 0}, sort=[("date", -1)])
        if not doc:
            return _resp(error=f"No data for '{ticker.upper()}'", status=404)
        return _resp(data=serialize_doc(doc))

    # ── Single ticker fetch (pull → store) ────────────────────────────────────
    # ── Live Quotes (with rudimentary caching) ─────────────────────────────────
    QUOTE_CACHE = {}
    CACHE_DURATION = 300 # 5 minutes

    @app.post("/api/brokers/connect")
    def connect_broker():
        body = request.get_json(silent=True) or {}
        broker_name = body.get("brokerName")
        broker_id = body.get("brokerId")
        api_key = body.get("apiKey")
        api_secret = body.get("apiSecret")
        
        if not broker_name or not broker_id or not api_key:
            return _resp(error="Missing required fields", status=400)
            
        db = get_db()
        brokers_coll = db["brokers"]
        
        doc = {
            "broker_name": broker_name,
            "broker_id": broker_id,
            "api_key": api_key,
            "api_secret": api_secret,
            "status": "connected"
        }
        
        brokers_coll.update_one(
            {"broker_name": broker_name, "broker_id": broker_id},
            {"$set": doc},
            upsert=True
        )
        
        return _resp(data={"status": "connected", "broker": broker_name})

    @app.post("/api/data/quotes")
    def fetch_quotes():
        """
        POST /api/data/quotes
        Body: { "tickers": ["RELIANCE.NS", "TCS.NS"] }
        Returns delayed quote data.
        """
        body = request.get_json(silent=True) or {}
        tickers = body.get("tickers", [])
        if not tickers:
            return _resp(error="No tickers provided", status=400)
            
        import time
        now = time.time()
        results = {}
        to_fetch = []
        
        for tkr in tickers:
            t = tkr.upper()
            if t in QUOTE_CACHE and (now - QUOTE_CACHE[t]["time"]) < CACHE_DURATION:
                results[t] = QUOTE_CACHE[t]["data"]
            else:
                to_fetch.append(t)
                
        if to_fetch:
            try:
                # Use history instead of deep download to avoid noise if single ticker,
                temp_df = yf.download(to_fetch, period="5d", progress=False)
                if not temp_df.empty and 'Close' in temp_df.columns:
                    closes = temp_df['Close']
                    if len(to_fetch) == 1:
                        # Single ticker case
                        t = to_fetch[0]
                        valid_closes = closes.dropna()
                        if not valid_closes.empty:
                            last_close = _safe_float(valid_closes.iloc[-1])
                            prev_close = _safe_float(valid_closes.iloc[-2]) if len(valid_closes) > 1 else last_close
                            change = ((last_close - prev_close)/prev_close * 100) if prev_close else 0.0
                            
                            data = {"price": last_close, "change": change}
                            QUOTE_CACHE[t] = {"time": now, "data": data}
                            results[t] = data
                    else:
                        for t in to_fetch:
                            try:
                                if t in closes.columns:
                                    col = closes[t]
                                    valid_closes = col.dropna()
                                    if not valid_closes.empty:
                                        last_close = _safe_float(valid_closes.iloc[-1])
                                        prev_close = _safe_float(valid_closes.iloc[-2]) if len(valid_closes) > 1 else last_close
                                        change = ((last_close - prev_close)/prev_close * 100) if prev_close else 0.0
                                        
                                        data = {"price": last_close, "change": change}
                                        QUOTE_CACHE[t] = {"time": now, "data": data}
                                        results[t] = data
                            except Exception as e:
                                logger.error(f"Error extracting quote for {t}: {str(e)}")
            except Exception as e:
                logger.error(f"Quote fetch failed: {str(e)}")
                
        return _resp(data=results)

    @app.post("/api/data/fetch")
    def fetch_ticker():
        """
        POST /api/data/fetch
        Body: { "ticker": "RELIANCE.NS", "period": "1y", "force_refresh": false }

        Pulls OHLCV from yfinance → stores in MongoDB.
        Returns summary of what was written.
        """
        body   = request.get_json(silent=True) or {}
        ticker = body.get("ticker", "").upper().strip()
        period = body.get("period", "1y")
        force  = body.get("force_refresh", False)

        if not ticker:
            return _resp(error="'ticker' is required", status=400)

        db = get_db()

        # Cache check — skip fetch if recent data exists and force=False
        if not force:
            existing_count = db.ohlcv.count_documents({"ticker": ticker})
            if existing_count > 0:
                latest = db.ohlcv.find_one({"ticker": ticker}, sort=[("date", -1)])
                days_old = (datetime.now(timezone.utc) - latest["date"].replace(tzinfo=timezone.utc)).days
                if days_old <= 1:
                    return _resp(
                        data={"status": "cached", "ticker": ticker,
                              "record_count": existing_count,
                              "last_date": latest["date"].isoformat()},
                        meta={"cached": True},
                    )

        run_id     = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc)

        try:
            tkr = yf.Ticker(ticker)

            # Handle both old and new yfinance API
            try:
                df = tkr.history(period=period, interval="1d", auto_adjust=False, progress=False)
            except TypeError:
                df = tkr.history(period=period, interval="1d", auto_adjust=False)

            if df.empty:
                return _resp(error=f"yfinance returned no data for '{ticker}'", status=422)

            df.index = pd.to_datetime(df.index, utc=True)
            fetched_at = datetime.now(timezone.utc)

            # Detect asset class
            asset_class = _detect_asset_class(ticker)

            records = []
            for ts, row in df.iterrows():
                records.append({
                    "ticker":     ticker,
                    "date":       ts.to_pydatetime(),
                    "open":       _safe_float(row.get("Open")),
                    "high":       _safe_float(row.get("High")),
                    "low":        _safe_float(row.get("Low")),
                    "close":      _safe_float(row.get("Close")),
                    "adj_close":  _safe_float(row.get("Adj Close", row.get("Close"))),
                    "volume":     int(row.get("Volume", 0) or 0),
                    "asset_class": asset_class,
                    "source":     "yfinance",
                    "fetched_at": fetched_at,
                })

            # Upsert all records
            upserted = 0
            for r in records:
                result = db.ohlcv.update_one(
                    {"ticker": r["ticker"], "date": r["date"]},
                    {"$set": r},
                    upsert=True,
                )
                if result.upserted_id or result.modified_count:
                    upserted += 1

            # Log the run
            db.pipeline_runs.insert_one({
                "run_id":       run_id,
                "ticker":       ticker,
                "status":       "success",
                "record_count": len(records),
                "upserted":     upserted,
                "period":       period,
                "started_at":   started_at,
                "finished_at":  datetime.now(timezone.utc),
            })

            return _resp(data={
                "status":       "success",
                "ticker":       ticker,
                "period":       period,
                "record_count": len(records),
                "upserted":     upserted,
                "first_date":   records[0]["date"].isoformat()  if records else None,
                "last_date":    records[-1]["date"].isoformat() if records else None,
                "run_id":       run_id,
            })

        except Exception as e:
            db.pipeline_runs.insert_one({
                "run_id":     run_id,
                "ticker":     ticker,
                "status":     "failed",
                "error":      str(e),
                "started_at": started_at,
                "finished_at": datetime.now(timezone.utc),
            })
            return _resp(error=f"Fetch failed for '{ticker}': {str(e)}", status=500)

    # ── Strategy Parser ───────────────────────────────────────────────────────────
    @app.route("/api/strategy/parse", methods=["POST"])
    def parse_strategy():
        """
        POST /api/strategy/parse
        Parse natural language trading prompt into structured JSON with all fetch requirements
        
        Body: { "prompt": "Create a medium risk swing trading strategy for RELIANCE.NS using momentum on daily timeframe" }
        
        Returns: Comprehensive JSON with parsed parameters, indicators, fetch requirements
        """
        print("\n" + "="*80)
        print("[STEP 1] ✓ Request received at /api/strategy/parse")
        print("="*80)
        
        try:
            data = request.get_json(silent=True) or {}
            prompt = data.get("prompt", "").strip()
            
            print(f"[STEP 2] ✓ JSON body parsed")
            print(f"         Prompt: {prompt[:80]}...")
            
            if not prompt:
                print(f"[ERROR]  ✗ Missing 'prompt' field")
                return _resp(error="'prompt' field is required", status=400)
            
            logger.info(f"[StrategyParser] Parsing prompt: {prompt[:100]}...")
            print(f"[STEP 3] ✓ Starting NLP extraction...")
            
            # ── Extract trading parameters from NLP ─────────────────────────────
            parsed_params = parse_trading_prompt(prompt)
            ticker = parsed_params.get("asset", "RELIANCE.NS")
            
            print(f"[STEP 4] ✓ NLP extraction complete")
            print(f"         Ticker: {ticker}")
            print(f"         Timeframe: {parsed_params['timeframe']}")
            print(f"         Goal: {parsed_params['goal']}")
            print(f"         Risk Level: {parsed_params['risk_level']}")
            print(f"         Style: {parsed_params['style']}")
            
            logger.info(f"[StrategyParser] Extracted ticker={ticker}, goal={parsed_params['goal']}")
            
            # ── Use strategy parser for indicator details ────────────────────────
            print(f"[STEP 5] ✓ Starting strategy DSL parsing...")
            try:
                strategy_dsl = parser.parse(prompt)
                print(f"[STEP 6] ✓ Strategy DSL parsed successfully")
                print(f"         Indicators: {len(strategy_dsl.get('indicators', []))} found")
                print(f"         Entry conditions: {len(strategy_dsl.get('entry_conditions', []))} found")
                print(f"         Exit conditions: {len(strategy_dsl.get('exit_conditions', []))} found")
                logger.info(f"[StrategyParser] Strategy DSL parsed successfully")
            except Exception as e:
                print(f"[WARN]   ⚠ Strategy parsing failed: {e}")
                logger.warning(f"[StrategyParser] Strategy parsing failed: {e}")
                strategy_dsl = {
                    "ticker": ticker,
                    "timeframe": parsed_params.get("timeframe", "1d"),
                    "indicators": [],
                    "entry_conditions": [],
                    "exit_conditions": [],
                    "position_size": 1.0
                }
            
            # ── Build comprehensive fetch/execution plan ────────────────────────
            print(f"[STEP 7] ✓ Building comprehensive fetch plan...")
            
            parse_result = {
                # Parsed NLP parameters
                "parsed_parameters": {
                    "ticker": ticker,
                    "timeframe": parsed_params.get("timeframe", "1D"),
                    "goal": parsed_params.get("goal", "alpha generation"),
                    "risk_level": parsed_params.get("risk_level", "moderate"),
                    "style": parsed_params.get("style", "swing"),
                },
                
                # Strategy DSL from LLM
                "strategy_dsl": {
                    "ticker": strategy_dsl.get("ticker", ticker),
                    "timeframe": strategy_dsl.get("timeframe", "1d"),
                    "indicators": strategy_dsl.get("indicators", []),
                    "entry_conditions": strategy_dsl.get("entry_conditions", []),
                    "exit_conditions": strategy_dsl.get("exit_conditions", []),
                    "position_size": strategy_dsl.get("position_size", 1.0),
                },
                
                # Data fetch requirements
                "fetch_requirements": {
                    "ticker": ticker,
                    "period": "2y",  # 2 years recommended for technical analysis
                    "interval": "1d",  # Daily candles
                    "source": "mongodb_first_yfinance_fallback",  # Check MongoDB first, then yfinance
                },
                
                # Indicators needed
                "indicators_to_calculate": [
                    "ema20", "ema50", "ema200",
                    "rsi", "macd", "stochastic",
                    "atr", "bollinger_bands",
                    "volume", "support_resistance"
                ],
                
                # Statistics to compute
                "statistics_to_compute": [
                    "avg_return", "volatility", "sharpe_ratio",
                    "max_drawdown", "win_rate", "trend_direction"
                ],
                
                # Macro data needed
                "macro_data_needed": [
                    "vix", "10y_yield", "2y_yield", "yield_curve_spread"
                ],
                
                # Agent configuration
                "agent_configuration": {
                    "strategy_goal": parsed_params.get("goal", "alpha generation"),
                    "risk_level": parsed_params.get("risk_level", "moderate"),
                    "auto_select_agents": True,  # Use default agents based on goal
                },
                
                # Metadata
                "metadata": {
                    "parsed_at": datetime.now().isoformat(),
                    "original_prompt": prompt,
                    "asset_class": _detect_asset_class(ticker),
                },
            }
            
            print(f"[STEP 8] ✓ Fetch plan built")
            print(f"         Indicators: {', '.join(parse_result['indicators_to_calculate'][:5])}... and {len(parse_result['indicators_to_calculate'])-5} more")
            print(f"         Macro data: {', '.join(parse_result['macro_data_needed'])}")
            print(f"         Asset class: {parse_result['metadata']['asset_class']}")
            
            print(f"[STEP 9] ✓ Response prepared - returning comprehensive JSON")
            print("="*80)
            
            logger.info(f"[StrategyParser] Parse complete - ready to fetch data for {ticker}")
            
            return _resp(data=parse_result, status=200)
        
        except Exception as e:
            print(f"[ERROR]  ✗ Exception occurred: {str(e)}")
            print("="*80)
            logger.error(f"[StrategyParser] Error: {str(e)}")
            return _resp(error=f"Parse failed: {str(e)}", status=500)

    # ── Custom Strategy Node Graph Backtesting ───
    @app.route("/api/strategy/backtest_nodes", methods=["POST"])
    def backtest_nodes():
        """
        POST /api/strategy/backtest_nodes
        Executes a backtest using the precise DSL compiled from the UI node graph.
        """
        print("\n" + "="*80)
        print("[BACKTEST_NODES] ✓ Executing UI Node-based Strategy Backtest")
        print("="*80)
        try:
            data = request.get_json(silent=True) or {}
            dsl = data.get("dsl")
            
            if not dsl:
                return _resp(error="Missing DSL configuration", status=400)
                
            from backtest_engine.dsl_engine import run_dsl_backtest
            from validation_engine.validation_pipeline import run_validation
            
            # Start backtest execution
            print(f"[BACKTEST_NODES] Running backtest for {dsl.get('ticker')}...")
            result = run_dsl_backtest(dsl)
            
            if not result.get("success"):
                err_msg = result.get("error", "Unknown simulation error")
                print(f"[ERROR] Engine Failed: {err_msg}")
                return _resp(error=err_msg, status=400)
                
            print(f"[BACKTEST_NODES] Backtest complete. Total trades: {result.get('summary', {}).get('total_trades')}")
            return _resp(result, status=200)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return _resp(error=str(e), status=500)
    # ── Full Strategy Execute (Parse → Fetch → Calculate → Debate → Strategy) ───
    @app.route("/api/strategy/execute", methods=["POST"])
    def execute_strategy():
        """
        POST /api/strategy/execute
        Complete pipeline: Parse NLP → Fetch data → Calculate indicators → Run debate → Return DSL
        
        Body: { "prompt": "Create a medium risk swing trading strategy for RELIANCE.NS using momentum on daily timeframe" }
        
        Returns: Clean DSL format with entry/exit conditions
        
        Response Format:
        {
            "dsl": {
                "entry_conditions": [...],
                "exit_conditions": [...],
                "indicators": [...],
                "position_size": 1.0,
                "ticker": "RELIANCE.NS",
                "timeframe": "1d"
            },
            "success": true
        }
        """
        print("\n" + "="*80)
        print("[EXECUTE] ✓ Full pipeline initiated at /api/strategy/execute")
        print("="*80)
        
        try:
            data = request.get_json(silent=True) or {}
            prompt = data.get("prompt", "").strip()
            capital = data.get("capital", 100000)
            selected_agents = data.get("selected_agents", [])
            
            if not prompt:
                print(f"[ERROR]   ✗ Missing 'prompt' field")
                return _resp(error="'prompt' field is required", status=400)
            
            print(f"[STEP 1] ✓ Request received")
            print(f"         Prompt: {prompt[:80]}...")
            
            # ── STAGE 1: PARSE ─────────────────────────────────────────────
            print(f"\n[STAGE 1] PARSING...")
            parsed = parse_trading_prompt(prompt)
            ticker = parsed['asset']
            
            print(f"[STEP 2] ✓ NLP parsing complete")
            print(f"         Ticker: {ticker} | Goal: {parsed['goal']} | Risk: {parsed['risk_level']}")
            
            # ── STAGE 2: STRATEGY DSL PARSING (Extract entry/exit from LLM) ─
            print(f"\n[STAGE 2] PARSING STRATEGY DSL...")
            try:
                strategy_dsl = parser.parse(prompt)
                print(f"[STEP 3] ✓ DSL parsing complete")
                print(f"         Entry conditions: {len(strategy_dsl.get('entry_conditions', []))} defined")
                print(f"         Exit conditions: {len(strategy_dsl.get('exit_conditions', []))} defined")
                print(f"         Indicators: {[ind.get('name', '?') for ind in strategy_dsl.get('indicators', [])]}")
            except Exception as e:
                print(f"[WARN]   ⚠ DSL parsing failed: {e}")
                logger.warning(f"DSL parsing failed: {e}")
                strategy_dsl = {
                    "ticker": ticker,
                    "timeframe": parsed.get('timeframe', '1d'),
                    "indicators": [],
                    "entry_conditions": [],
                    "exit_conditions": [],
                    "position_size": 1.0
                }
            
            # ── STAGE 3: FETCH DATA ────────────────────────────────────────
            print(f"\n[STAGE 3] FETCHING DATA...")
            db = get_db()
            raw_data = list(db.ohlcv.find({"ticker": ticker}).sort("date", 1))
            
            if not raw_data:
                print(f"[STEP 4] ⚠ No data in MongoDB, fetching from yfinance...")
                try:
                    tkr = yf.Ticker(ticker)
                    try:
                        df_yf = tkr.history(period="2y", interval="1d", auto_adjust=False, progress=False)
                    except TypeError:
                        df_yf = tkr.history(period="2y", interval="1d", auto_adjust=False)
                    
                    if df_yf.empty:
                        print(f"[ERROR]   ✗ No market data available for {ticker}")
                        return _resp(error=f"No market data for {ticker}", status=422)
                    
                    df_yf.index = pd.to_datetime(df_yf.index, utc=True)
                    fetched_at = datetime.now(timezone.utc)
                    
                    for ts, row in df_yf.iterrows():
                        db.ohlcv.update_one(
                            {"ticker": ticker, "date": ts.to_pydatetime()},
                            {"$set": {
                                "ticker": ticker,
                                "date": ts.to_pydatetime(),
                                "open": _safe_float(row.get("Open")),
                                "high": _safe_float(row.get("High")),
                                "low": _safe_float(row.get("Low")),
                                "close": _safe_float(row.get("Close")),
                                "adj_close": _safe_float(row.get("Adj Close", row.get("Close"))),
                                "volume": int(row.get("Volume", 0) or 0),
                                "asset_class": _detect_asset_class(ticker),
                                "source": "yfinance",
                                "fetched_at": fetched_at,
                            }},
                            upsert=True,
                        )
                    
                    raw_data = list(db.ohlcv.find({"ticker": ticker}).sort("date", 1))
                    print(f"[STEP 4] ✓ Fetched {len(df_yf)} bars from yfinance → stored in MongoDB")
                    
                except Exception as e:
                    print(f"[ERROR]   ✗ Failed to fetch data: {e}")
                    return _resp(error=f"Failed to fetch market data: {str(e)}", status=500)
            else:
                print(f"[STEP 4] ✓ Found {len(raw_data)} bars in MongoDB (using cache)")
            
            df = pd.DataFrame([
                {
                    "date": doc["date"],
                    "open": doc.get("open", 0),
                    "high": doc.get("high", 0),
                    "low": doc.get("low", 0),
                    "close": doc.get("close", 0),
                    "volume": doc.get("volume", 0),
                }
                for doc in raw_data
            ])
            
            print(f"[STEP 5] ✓ DataFrame created: {len(df)} bars loaded")
            
            # ── STAGE 4: CALCULATE INDICATORS ──────────────────────────────
            print(f"\n[STAGE 4] CALCULATING INDICATORS...")
            indicators = calculate_indicators(df)
            print(f"[STEP 6] ✓ {len(indicators)} indicator metrics calculated")
            
            # ── STAGE 5: CALCULATE STATISTICS ─────────────────────────────
            print(f"\n[STAGE 5] CALCULATING STATISTICS...")
            statistics = calculate_statistics(df)
            print(f"[STEP 7] ✓ Statistics computed (vol, sharpe, drawdown, win_rate)")
            
            # ── STAGE 6: FETCH MACRO CONTEXT ──────────────────────────────
            print(f"\n[STAGE 6] FETCHING MACRO CONTEXT...")
            macro = get_macro_context()
            print(f"[STEP 8] ✓ Macro data retrieved (VIX, yields, curves)")
            
            # ── STAGE 7: RUN DEBATE (for context, not output) ──────────────
            print(f"\n[STAGE 7] RUNNING AGENT DEBATE (for enrichment)...")
            current_price = _safe_float(df['close'].iloc[-1]) if len(df) > 0 else 0
            
            debate_payload = {
                "asset": ticker,
                "market": "equity",
                "timeframe": parsed['timeframe'],
                "goal": parsed['goal'],
                "risk_level": parsed['risk_level'],
                "capital": capital,
                "market_data": {"price": current_price, "volume": int(df['volume'].iloc[-1]) if len(df) > 0 else 0},
                "trend": {"ema20": indicators.get('ema20', 0), "ema50": indicators.get('ema50', 0), "ema200": indicators.get('ema200', 0), "trend_strength": indicators.get('trend_strength', 'neutral')},
                "momentum": {"rsi": indicators.get('rsi', 50), "macd": indicators.get('macd', 0), "macd_status": indicators.get('macd_status', 'neutral'), "stochastic": indicators.get('stochastic', 50)},
                "volatility": {"atr": indicators.get('atr', 0), "atr_percent": indicators.get('atr_percent', 0), "bollinger_width": indicators.get('bb_width', 0)},
                "structure": {"support": indicators.get('support', 0), "resistance": indicators.get('resistance', 0)},
                "statistics": statistics,
                "macro": macro,
                "selected_agents": selected_agents if selected_agents else [],
            }
            
            result = run_trading_strategy_debate(debate_payload)
            print("\n[DEBUG] ===== DEBATE RESULT =====")
            print("Keys:", result.keys() if result else None)
            print("Strategy:", result.get("strategy"))
            print("Debate Log Length:", len(result.get("debate_log", [])))
            print("Debate Log Sample:", result.get("debate_log", [])[:2])
            print("================================\n")
            agents_used = result.get('agents_used', [])
            print(f"[STEP 9] ✓ Debate pipeline executed ({len(agents_used)} agents)")
            
            # ── STAGE 8: RETURN CLEAN DSL FORMAT ───────────────────────────
            print(f"\n[STAGE 8] FORMATTING RESPONSE...")
            
            # Ensure DSL has all required fields
            final_dsl = {
                "ticker": strategy_dsl.get("ticker", ticker).upper(),
                "timeframe": strategy_dsl.get("timeframe", parsed.get('timeframe', '1d')),
                "indicators": strategy_dsl.get("indicators", []),
                "entry_conditions": strategy_dsl.get("entry_conditions", []),
                "exit_conditions": strategy_dsl.get("exit_conditions", []),
                "position_size": strategy_dsl.get("position_size", 1.0),
            }
            
            print(f"[STEP 10] ✓ DSL formatted")
            print(f"          Ticker: {final_dsl['ticker']}")
            print(f"          Timeframe: {final_dsl['timeframe']}")
            print(f"          Entry signals: {len(final_dsl['entry_conditions'])}")
            print(f"          Exit signals: {len(final_dsl['exit_conditions'])}")
            
            print("="*80)
            print("[EXECUTE] ✓ PIPELINE COMPLETE - CLEAN DSL RETURNED")
            print("="*80)
            
            return _resp(data={"dsl": final_dsl, "success": True}, status=200)
        
        except Exception as e:
            print(f"\n[ERROR]   ✗ Pipeline failed: {str(e)}")
            print("="*80)
            logger.error(f"[ExecuteStrategy] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Execution failed: {str(e)}", status=500)
        


    # ── Bulk fetch ─────────────────────────────────────────────────────────────
    @app.post("/api/data/fetch/bulk")
    def fetch_bulk():
        """
        POST /api/data/fetch/bulk
        Body: { "tickers": ["RELIANCE.NS", "INFY.NS", "TCS.NS"], "period": "2y" }

        Uses yfinance bulk download (one HTTP call for all tickers).
        """
        body    = request.get_json(silent=True) or {}
        tickers = [t.upper().strip() for t in body.get("tickers", []) if t.strip()]
        period  = body.get("period", "1y")

        if not tickers:
            return _resp(error="'tickers' array is required", status=400)
        if len(tickers) > 50:
            return _resp(error="Maximum 50 tickers per bulk request", status=400)

        db = get_db()
        results = {}

        try:
            # yfinance bulk download — one call for all tickers
            try:
                raw = yf.download(
                    tickers=" ".join(tickers),
                    period=period,
                    interval="1d",
                    auto_adjust=False,
                    group_by="ticker",
                    progress=False,
                )
            except TypeError:
                raw = yf.download(
                    tickers=" ".join(tickers),
                    period=period,
                    interval="1d",
                    auto_adjust=False,
                    group_by="ticker",
                )

            fetched_at = datetime.now(timezone.utc)

            for ticker in tickers:
                try:
                    # Single ticker download has flat columns; multi has MultiIndex
                    df = raw[ticker].dropna(how="all") if len(tickers) > 1 else raw.dropna(how="all")
                    df.index = pd.to_datetime(df.index, utc=True)
                    asset_class = _detect_asset_class(ticker)

                    records = []
                    for ts, row in df.iterrows():
                        records.append({
                            "ticker":      ticker,
                            "date":        ts.to_pydatetime(),
                            "open":        _safe_float(row.get("Open")),
                            "high":        _safe_float(row.get("High")),
                            "low":         _safe_float(row.get("Low")),
                            "close":       _safe_float(row.get("Close")),
                            "adj_close":   _safe_float(row.get("Adj Close", row.get("Close"))),
                            "volume":      int(row.get("Volume", 0) or 0),
                            "asset_class": asset_class,
                            "source":      "yfinance",
                            "fetched_at":  fetched_at,
                        })

                    for r in records:
                        db.ohlcv.update_one(
                            {"ticker": r["ticker"], "date": r["date"]},
                            {"$set": r}, upsert=True,
                        )

                    results[ticker] = {"status": "success", "record_count": len(records)}

                except Exception as te:
                    results[ticker] = {"status": "failed", "error": str(te)}

        except Exception as e:
            return _resp(error=f"Bulk download failed: {str(e)}", status=500)

        success_count = sum(1 for r in results.values() if r["status"] == "success")
        return _resp(
            data=results,
            meta={"total": len(tickers), "success": success_count, "failed": len(tickers) - success_count},
        )

    # ── Indicators ─────────────────────────────────────────────────────────────
    @app.get("/api/data/indicators/<ticker>")
    def get_indicators(ticker: str):
        """
        GET /api/data/indicators/INFY.NS
        GET /api/data/indicators/INFY.NS?date=2024-06-01

        Returns all computed indicator values (pivoted to flat dict).
        These are populated after running the compute_indicators pipeline step.
        """
        db   = get_db()
        date = request.args.get("date")

        query = {"ticker": ticker.upper()}
        if date:
            query["date"] = pd.Timestamp(date, tz="UTC").to_pydatetime()
            docs = list(db.indicators.find(query, {"_id": 0}).limit(200))
        else:
            # Get latest date's indicators
            latest = db.indicators.find_one({"ticker": ticker.upper()}, sort=[("date", -1)])
            if not latest:
                return _resp(
                    error=f"No indicators for '{ticker.upper()}'. "
                          f"Indicators are computed after the full pipeline runs.",
                    status=404,
                )
            query["date"] = latest["date"]
            docs = list(db.indicators.find(query, {"_id": 0}).limit(200))

        if not docs:
            return _resp(error=f"No indicators for '{ticker.upper()}'", status=404)

        snapshot = {d["indicator"]: d["value"] for d in docs}
        date_val = docs[0]["date"]
        return _resp(
            data=snapshot,
            meta={
                "ticker": ticker.upper(),
                "date":   date_val.isoformat() if hasattr(date_val, "isoformat") else str(date_val),
                "count":  len(snapshot),
            },
        )

    # ── Ticker metadata ────────────────────────────────────────────────────────
    @app.get("/api/data/meta/<ticker>")
    def get_metadata(ticker: str):
        """
        GET /api/data/meta/INFY.NS
        Returns sector, industry, market cap, currency etc.
        Populated automatically when fetch is called.
        """
        db  = get_db()
        doc = db.ticker_metadata.find_one({"ticker": ticker.upper()}, {"_id": 0})
        if not doc:
            # Try to fetch on-demand from yfinance
            try:
                info = yf.Ticker(ticker).info
                doc = {
                    "ticker":      ticker.upper(),
                    "name":        info.get("longName") or info.get("shortName", ""),
                    "sector":      info.get("sector", ""),
                    "industry":    info.get("industry", ""),
                    "market_cap":  info.get("marketCap"),
                    "currency":    info.get("currency", "USD"),
                    "exchange":    info.get("exchange", ""),
                    "asset_class": _detect_asset_class(ticker),
                    "country":     info.get("country", ""),
                    "source":      "yfinance",
                    "fetched_at":  datetime.now(timezone.utc),
                }
                db.ticker_metadata.update_one(
                    {"ticker": ticker.upper()}, {"$set": doc}, upsert=True
                )
            except Exception as e:
                return _resp(error=f"No metadata for '{ticker.upper()}': {e}", status=404)

        return _resp(data=serialize_doc(doc))
    
    
    @app.route("/api/news/<symbol>", methods=["GET"])
    def get_news(symbol):
        try:
            requested_symbol = symbol.strip()
            candidate_symbols = [requested_symbol]
            candidate_symbols.extend(_NEWS_FALLBACK_SYMBOLS.get(requested_symbol.upper(), []))

            merged_news = []
            seen = set()

            for candidate in candidate_symbols:
                try:
                    candidate_news = _fetch_news_for_symbol(candidate, limit=10)
                except Exception as e:
                    logger.warning(f"[News] Failed for symbol {candidate}: {e}")
                    continue

                for item in candidate_news:
                    identity = item.get("uuid") or item.get("link")
                    if not identity or identity in seen:
                        continue

                    seen.add(identity)
                    merged_news.append(item)

                    if len(merged_news) >= 10:
                        break

                if len(merged_news) >= 10:
                    break

            return jsonify({
                "news": merged_news,
                "symbol": requested_symbol.upper(),
                "count": len(merged_news),
            }), 200

        except Exception as e:
            logger.error(f"[News] Error fetching news for {symbol}: {e}", exc_info=True)
            return jsonify({
                "news": [],
                "symbol": symbol.upper(),
                "count": 0,
                "error": "Live news temporarily unavailable"
            }), 200

    # ── Macro data (FRED) ──────────────────────────────────────────────────────
    @app.post("/api/data/macro/fetch")
    def fetch_macro():
        """
        POST /api/data/macro/fetch
        Body: { "series_ids": ["VIXCLS", "DGS10"] }  — omit to fetch all defaults

        Requires FRED_API_KEY in .env
        """
        try:
            from fredapi import Fred
            import os
            fred_key = os.getenv("FRED_API_KEY", "")
            if not fred_key or fred_key == "your_fred_key_here":
                return _resp(
                    error="FRED_API_KEY not configured. "
                          "Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html",
                    status=422,
                )

            MACRO_SERIES = {
                "VIXCLS":       "CBOE VIX",
                "DGS10":        "10-Year Treasury Yield",
                "DGS2":         "2-Year Treasury Yield",
                "T10Y2Y":       "Yield Curve Spread (10Y-2Y)",
                "CPIAUCSL":     "CPI (All Urban)",
                "UNRATE":       "Unemployment Rate",
                "FEDFUNDS":     "Federal Funds Rate",
                "DCOILWTICO":   "WTI Crude Oil",
            }

            body       = request.get_json(silent=True) or {}
            series_ids = body.get("series_ids") or list(MACRO_SERIES.keys())
            start      = body.get("start", "2010-01-01")

            fred = Fred(api_key=fred_key)
            db   = get_db()

            results = {}
            for series_id in series_ids:
                try:
                    data = fred.get_series(series_id, observation_start=start).dropna()
                    records = [
                        {
                            "series_id":  series_id,
                            "name":       MACRO_SERIES.get(series_id, series_id),
                            "date":       pd.Timestamp(date, tz="UTC").to_pydatetime(),
                            "value":      round(float(val), 6),
                            "source":     "fred",
                            "fetched_at": datetime.now(timezone.utc),
                        }
                        for date, val in data.items()
                    ]
                    for r in records:
                        db.macro_data.update_one(
                            {"series_id": r["series_id"], "date": r["date"]},
                            {"$set": r}, upsert=True,
                        )
                    results[series_id] = {"status": "success", "record_count": len(records)}
                except Exception as se:
                    results[series_id] = {"status": "failed", "error": str(se)}

            success = sum(1 for r in results.values() if r["status"] == "success")
            return _resp(data=results, meta={"series_fetched": success})

        except ImportError:
            return _resp(
                error="fredapi not installed. Run: pip install fredapi",
                status=500,
            )

    @app.get("/api/data/macro/<series_id>")
    def get_macro(series_id: str):
        """
        GET /api/data/macro/VIXCLS
        GET /api/data/macro/VIXCLS?start=2020-01-01&limit=500
        """
        db    = get_db()
        start = request.args.get("start")
        limit = min(int(request.args.get("limit", 500)), 5000)

        query = {"series_id": series_id.upper()}
        if start:
            query["date"] = {"$gte": pd.Timestamp(start, tz="UTC").to_pydatetime()}

        docs = list(db.macro_data.find(query, {"_id": 0}).sort("date", 1).limit(limit))
        if not docs:
            return _resp(
                error=f"No data for series '{series_id.upper()}'. "
                      f"Run POST /api/data/macro/fetch first.",
                status=404,
            )

        return _resp(data=serialize_docs(docs), meta={"series_id": series_id.upper(), "count": len(docs)})

    # ── Pipeline run logs ──────────────────────────────────────────────────────
    @app.get("/api/data/runs")
    def get_runs():
        """
        GET /api/data/runs
        GET /api/data/runs?ticker=RELIANCE.NS&status=success&limit=20
        """
        db     = get_db()
        ticker = request.args.get("ticker", "").upper()
        status = request.args.get("status")
        limit  = min(int(request.args.get("limit", 20)), 100)

        query = {}
        if ticker:
            query["ticker"] = ticker
        if status:
            query["status"] = status

        docs = list(db.pipeline_runs.find(query, {"_id": 0}).sort("started_at", -1).limit(limit))
        return _resp(data=serialize_docs(docs), meta={"count": len(docs)})

    # ── Trading Strategy Debate API ────────────────────────────────────────────
    @app.post("/api/trading/strategy")
    def generate_trading_strategy():
        """
        Generate algorithmic trading strategy via multi-agent debate (2 rounds only)
        
        REQUEST:
        {
            "asset": "RELIANCE.NS",                   // REQUIRED
            "market": "equity",                       // REQUIRED
            "timeframe": "1D",                        // REQUIRED
            "goal": "momentum",                       // optional, affects agent selection
            "risk_level": "moderate",                 // optional
            "capital": 100000,                        // optional
            "selected_agents": ["MomentumAgent", "RiskManagementAgent"]  // optional - if not provided, auto-selects based on goal
        }
        
        RESPONSE:
        {
            "success": true,
            "strategy": {
                "entry_rules": [...],
                "exit_rules": [...],
                "indicators": [...],
                "filters": [...],
                "risk_management": {...}
            },
            "debate": {...},
            "timestamp": "...",
            "agents_used": ["MomentumAgent", "RiskManagementAgent"]
        }
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "Invalid request - JSON required"}), 400
            
            # Validate required fields
            required_fields = ["asset", "market", "timeframe"]
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Set defaults
            if "goal" not in data:
                data["goal"] = "alpha generation"
            if "risk_level" not in data:
                data["risk_level"] = "moderate"
            if "capital" not in data:
                data["capital"] = 100000
            
            # Validate selected_agents if provided
            if "selected_agents" in data and data["selected_agents"]:
                if not isinstance(data["selected_agents"], list):
                    return jsonify({"error": "selected_agents must be a list"}), 400
                if len(data["selected_agents"]) > 16:
                    return jsonify({"error": "Cannot select more than 16 agents"}), 400
            
            logger.info(f"Received strategy request: {data['asset']} on {data['timeframe']}")
            
            # Run 2-round debate pipeline
            result = run_trading_strategy_debate(data)
            
            # Return strategy and debate full state
            return jsonify(result), 200 if result["success"] else 202
        
        except Exception as e:
            logger.error(f"Strategy generation error: {str(e)}")
            return jsonify({
                "error": str(e),
                "success": False
            }), 500

    @app.post("/api/trading/strategy/json")
    def get_strategy_json_only():
        """
        Quick endpoint that returns just the strategy JSON (no debate details)
        
        REQUEST: Same as /api/trading/strategy
        
        RESPONSE: Just the strategy JSON
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "Invalid request"}), 400
            
            result = run_trading_strategy_debate(data)
            
            # Return only the strategy portion
            if result["success"]:
                return jsonify(result["strategy"]), 200
            else:
                return jsonify(result["strategy"]), 202
        
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.get("/api/trading/health")
    def trading_health_check():
        """Health check endpoint for trading service"""
        return jsonify({
            "status": "healthy",
            "service": "Trading Strategy Generator",
            "agents": 16,
            "rounds": 2
        }), 200

    @app.get("/api/trading/docs")
    def trading_docs():
        """API documentation for trading strategy generator"""
        return jsonify({
            "service": "Algorithmic Trading Strategy Generator",
            "version": "1.0",
            "key_features": [
                "2-round debate pipeline (Proposal + Critique)",
                "Selective agent participation (4-16 agents)",
                "API key rotation to prevent rate limiting",
                "Backtesting-ready JSON output"
            ],
            "endpoints": {
                "POST /api/trading/strategy": {
                    "description": "Generate trading strategy (returns full debate + strategy)",
                    "required_fields": ["asset", "market", "timeframe"],
                    "optional_fields": ["goal", "risk_level", "capital", "selected_agents"],
                    "selected_agents_note": "Leave empty for auto-selection based on goal. Max 16 agents."
                },
                "POST /api/trading/strategy/json": {
                    "description": "Generate trading strategy (returns only strategy JSON)",
                    "required_fields": ["asset", "market", "timeframe"],
                    "optional_fields": ["goal", "risk_level", "capital", "selected_agents"]
                },
                "GET /api/trading/health": {
                    "description": "Health check"
                }
            },
            "example_request_with_auto_agents": {
                "asset": "RELIANCE.NS",
                "market": "equity",
                "timeframe": "1D",
                "goal": "momentum"
            },
            "example_request_with_custom_agents": {
                "asset": "RELIANCE.NS",
                "market": "equity",
                "timeframe": "1D",
                "selected_agents": ["MomentumAgent", "VolatilityAgent", "RiskManagementAgent", "StrategySimplifierAgent"]
            },
            "agent_names": [
                "TrendFollowingAgent",
                "MomentumAgent",
                "MeanReversionAgent",
                "BreakoutAgent",
                "VolumeAnalysisAgent",
                "VolatilityAgent",
                "PatternRecognitionAgent",
                "StatisticalSignalAgent",
                "MarketRegimeAgent",
                "LiquidityAgent",
                "RiskManagementAgent",
                "PortfolioAgent",
                "SentimentAgent",
                "MacroAgent",
                "CryptoSpecialistAgent",
                "StrategySimplifierAgent"
            ],
            "smart_defaults_by_goal": {
                "momentum": ["MomentumAgent", "VolatilityAgent", "RiskManagementAgent", "StrategySimplifierAgent"],
                "mean_reversion": ["MeanReversionAgent", "VolatilityAgent", "RiskManagementAgent", "LiquidityAgent"],
                "trend_following": ["TrendFollowingAgent", "MarketRegimeAgent", "RiskManagementAgent", "StrategySimplifierAgent"],
                "breakout": ["BreakoutAgent", "VolumeAnalysisAgent", "LiquidityAgent", "RiskManagementAgent"],
                "alpha": ["TrendFollowingAgent", "MomentumAgent", "StatisticalSignalAgent", "RiskManagementAgent"],
                "macro_informed": ["MacroAgent", "MarketRegimeAgent", "TrendFollowingAgent", "RiskManagementAgent"],
                "sentiment_based": ["SentimentAgent", "MomentumAgent", "MarketRegimeAgent", "RiskManagementAgent"]
            },
            "debate_rounds": 2,
            "api_key_rotation": "automatic (2 keys)",
            "calls_per_strategy": "4-16 agents × 2 rounds + 1 consensus = 9-33 LLM calls"
        }), 200

    @app.route("/api/validate_prompt", methods=["POST"])
    def validate_prompt():
        try:
            data = request.get_json(silent=True) or {}
            prompt = data.get("prompt", "").strip()
            
            if not prompt:
                return _resp(error="'prompt' field is required", status=400)
                
            from langchain_groq import ChatGroq
            from langchain_core.messages import HumanMessage, SystemMessage
            from utils.key_rotator import groq_api_rotator
            
            validator = ChatGroq(
                model="llama-3.1-8b-instant",
                temperature=0.0,
                api_key=groq_api_rotator.get_next_key()
            )
            val_res = validator.invoke([
                SystemMessage(content="You are a strict classifier. Return ONLY 'YES' if the user prompt describes a valid trading strategy, market scenario, or stock request. Return ONLY 'NO' if it is conversational, random gibberish, or unrelated to financial trading (e.g. 'hello xyz ajsdc')."),
                HumanMessage(content=prompt)
            ])
            if "NO" in val_res.content.upper():
                return _resp(error="Please provide a valid trading strategy request.", status=400)
                
            return _resp({"valid": True}, status=200)
        except Exception as e:
            return _resp(error=str(e), status=500)

    @app.route("/api/strategy/export_pdf", methods=["POST"])
    def export_pdf():
        """
        POST /api/strategy/export_pdf
        Generates a PDF from strategy/backtest payload and sends via WhatsApp (Green API).
        """
        try:
            data = request.get_json(silent=True) or {}
            
            # Use pdf_generator service to build the PDF
            from services.pdf_generator import generate_backtest_pdf
            from services.alert_service import whatsapp_alert
            import time
            import os
            
            report_name = f"backtest_report_{int(time.time())}.pdf"
            report_path = os.path.join("/tmp" if os.environ.get('ENV') != 'development' else ".", report_name)
            
            # Generate the PDF file locally
            pdf_path = generate_backtest_pdf(data, report_path)
            
            # Send file to WhatsApp via Green API
            caption = f"🚀 *Backtest Report Generated* \nTicker: {data.get('ticker', 'Unknown')}\n"
            if data.get('overall_metrics'):
                ret = data.get('overall_metrics').get('total_return_pct', 0) * 100
                caption += f"Total Return: {ret:.2f}%\n"
            
            whatsapp_alert.send_file(pdf_path, caption=caption)
            
            return send_file(pdf_path, as_attachment=True, download_name=report_name, mimetype='application/pdf')
        except Exception as e:
            print(f"[EXPORT PDF ERROR] {e}")
            return _resp(error=f"Error generating PDF: {str(e)}", status=500)

    # ── Full Pipeline: Strategy → Backtest ────────────────────────────────────
    @app.route("/api/pipeline_full", methods=["POST"])
    def pipeline_full():
        """
        POST /api/pipeline_full
        Complete end-to-end pipeline: 
          1. Parse NLP → Extract goal/parameters
          2. Fetch real market data (MongoDB + yfinance)
          3. Calculate indicators + statistics + macro context
          4. Run DEBATE ROOM → Generate strategy (all 16 agents synthesize strategy)
          5. Transform debate-generated strategy to backtest format
          6. Run backtest on real historical data
          7. Return full results
        
        Body: {
            "prompt": "Create a medium risk swing trading strategy for RELIANCE.NS using momentum and RSI on daily timeframe",
            "start_date": "2015-01-01",              // optional, default: "2y ago"
            "initial_capital": 100000,               // optional, default: 100000
            "position_size": 0.20,                   // optional, default: 1.0
            "commission_pct": 0.001,                 // optional, default: 0.001
            "slippage_pct": 0.0005,                  // optional, default: 0.0005
            "stop_loss_pct": 0.10,                   // optional, default: 0.10
            "take_profit_pct": 0.25                  // optional, default: 0.25
        }
        
        Returns: Backtest results + strategy generated by debate room
        """
        print("[DEBUG] 🚀 /api/pipeline_full HIT")
        print("[DEBUG] Request JSON:", request.get_json(silent=True))

        print("\n" + "="*120)
        print("[PIPELINE_FULL] ════════════════════════════════════════════════════════════════")
        print("[PIPELINE_FULL] 🚀 COMPLETE END-TO-END PIPELINE")
        print("[PIPELINE_FULL] NLP → DATA FETCH → DEBATE ROOM → BACKTEST")
        print("[PIPELINE_FULL] ════════════════════════════════════════════════════════════════")
        execution_start = datetime.now(timezone.utc)
        print(f"[PIPELINE_FULL] Request received at: {execution_start.isoformat()}")
        print("="*120)
        
        try:
            data = request.get_json(silent=True) or {}
            prompt = data.get("prompt", "").strip()
            
            if not prompt:
                print(f"[ERROR]   ✗ Missing 'prompt' field")
                return _resp(error="'prompt' field is required", status=400)
            
            # --- Quick LLM Vague Prompt Check ---
            try:
                from langchain_groq import ChatGroq
                from langchain_core.messages import HumanMessage, SystemMessage
                from utils.key_rotator import groq_api_rotator
                
                validator = ChatGroq(
                    model="llama-3.1-8b-instant",
                    temperature=0.0,
                    api_key=groq_api_rotator.get_next_key()
                )
                val_res = validator.invoke([
                    SystemMessage(content="You are a strict classifier. Return ONLY 'YES' if the user prompt describes a valid trading strategy, market scenario, or stock request. Return ONLY 'NO' if it is conversational, random gibberish, or unrelated to financial trading (e.g. 'hello xyz ajsdc')."),
                    HumanMessage(content=prompt)
                ])
                if "NO" in val_res.content.upper():
                    print(f"[ERROR]   ✗ Vague/Non-trading prompt detected: {prompt}")
                    return _resp(error="Please provide a valid trading strategy request.", status=400)
            except Exception as e:
                print(f"[WARNING] Prompt validation failed, proceeding anyway: {e}")
            
            print(f"\n[PHASE 1] ============ STEP 1: NLP PARSING ============")
            print(f"[PHASE 1] Parsing natural language prompt...")
            print(f"[PHASE 1] Input: \"{prompt}\"")
            
            # ── PHASE 1: Parse NLP to extract ticker, goal, risk ──
            parsed = parse_trading_prompt(prompt)
            ticker = parsed['asset']
            goal = parsed.get('goal', 'alpha generation')
            risk_level = parsed.get('risk_level', 'moderate')
            timeframe = parsed.get('timeframe', '1d')
            capital = data.get("initial_capital", 100000)
            
            print(f"[PHASE 1] ✓ NLP extraction complete:")
            print(f"[PHASE 1]    Ticker: {ticker.upper()}")
            print(f"[PHASE 1]    Timeframe: {timeframe}")
            print(f"[PHASE 1]    Goal: {goal}")
            print(f"[PHASE 1]    Risk Level: {risk_level}")
            print(f"[PHASE 1]    Capital: ${capital:,}")
            
            # ── PHASE 2: Fetch market data from MongoDB (cache) or yfinance (live) ──
            print(f"\n[PHASE 2] ============ STEP 2: FETCH REAL MARKET DATA ============")
            print(f"[PHASE 2] Checking MongoDB for cached data...")
            db = get_db()
            
            raw_data = list(db.ohlcv.find({"ticker": ticker}).sort("date", 1))
            
            if raw_data:
                mongo_date_range = f"{raw_data[0]['date'].date()} to {raw_data[-1]['date'].date()}"
                print(f"[PHASE 2] ✓ MongoDB HIT: {len(raw_data)} bars cached")
                print(f"[PHASE 2]    Date range: {mongo_date_range}")
                print(f"[PHASE 2]    Source: MongoDB (previous fetch)")
            else:
                print(f"[PHASE 2] ⚠️  MongoDB MISS - fetching LIVE data from yfinance...")
                try:
                    print(f"[PHASE 2]    Calling yfinance.Ticker('{ticker}').history(period='2y')")
                    tkr = yf.Ticker(ticker)
                    try:
                        df_yf = tkr.history(period="2y", interval="1d", auto_adjust=False, progress=False)
                    except TypeError:
                        df_yf = tkr.history(period="2y", interval="1d", auto_adjust=False)
                    
                    if df_yf.empty:
                        print(f"[ERROR]   ✗ yfinance returned empty data for {ticker}")
                        return _resp(error=f"No market data for {ticker}", status=422)
                    
                    print(f"[PHASE 2] ✓ yfinance HIT: {len(df_yf)} bars fetched")
                    yf_date_range = f"{df_yf.index[0].date()} to {df_yf.index[-1].date()}"
                    print(f"[PHASE 2]    Date range: {yf_date_range}")
                    print(f"[PHASE 2]    Price range: ${df_yf['Close'].min():.2f} - ${df_yf['Close'].max():.2f}")
                    print(f"[PHASE 2]    First bar (O/C/V): ${df_yf['Open'].iloc[0]:.2f} / ${df_yf['Close'].iloc[0]:.2f} / {int(df_yf['Volume'].iloc[0]):,}")
                    
                    df_yf.index = pd.to_datetime(df_yf.index, utc=True)
                    fetched_at = datetime.now(timezone.utc)
                    
                    print(f"[PHASE 2]    Storing to MongoDB for future use...")
                    store_count = 0
                    for ts, row in df_yf.iterrows():
                        result = db.ohlcv.update_one(
                            {"ticker": ticker, "date": ts.to_pydatetime()},
                            {"$set": {
                                "ticker": ticker,
                                "date": ts.to_pydatetime(),
                                "open": _safe_float(row.get("Open")),
                                "high": _safe_float(row.get("High")),
                                "low": _safe_float(row.get("Low")),
                                "close": _safe_float(row.get("Close")),
                                "adj_close": _safe_float(row.get("Adj Close", row.get("Close"))),
                                "volume": int(row.get("Volume", 0) or 0),
                                "asset_class": _detect_asset_class(ticker),
                                "source": "yfinance",
                                "fetched_at": fetched_at,
                            }},
                            upsert=True,
                        )
                        if result.upserted_id or result.modified_count > 0:
                            store_count += 1
                    
                    print(f"[PHASE 2]    ✓ Stored {store_count} bars to MongoDB")
                    raw_data = list(db.ohlcv.find({"ticker": ticker}).sort("date", 1))
                    
                except Exception as e:
                    print(f"[ERROR]   ✗ yfinance fetch failed: {e}")
                    return _resp(error=f"Failed to fetch market data: {str(e)}", status=500)
            
            # Convert to DataFrame for calculation
            df = pd.DataFrame([
                {
                    "date": doc["date"],
                    "open": doc.get("open", 0),
                    "high": doc.get("high", 0),
                    "low": doc.get("low", 0),
                    "close": doc.get("close", 0),
                    "volume": doc.get("volume", 0),
                }
                for doc in raw_data
            ])
            
            print(f"\n[PHASE 3] ============ STEP 3: CALCULATE TECHNICAL INDICATORS ============")
            print(f"[PHASE 3] Computing technical analysis on {len(df)} real price bars...")
            indicators = calculate_indicators(df)
            
            calculated_count = len([k for k in indicators.keys() if indicators[k] is not None])
            print(f"[PHASE 3] ✓ {calculated_count} indicators calculated:")
            print(f"[PHASE 3]    EMA20: ${indicators.get('ema20', 'N/A'):.2f}" if indicators.get('ema20') else "")
            print(f"[PHASE 3]    EMA50: ${indicators.get('ema50', 'N/A'):.2f}" if indicators.get('ema50') else "")
            print(f"[PHASE 3]    RSI: {indicators.get('rsi', 'N/A'):.2f}" if indicators.get('rsi') else "")
            print(f"[PHASE 3]    MACD: {indicators.get('macd', 'N/A')}" if indicators.get('macd') else "")
            print(f"[PHASE 3]    ATR: ${indicators.get('atr', 'N/A'):.2f}" if indicators.get('atr') else "")
            
            print(f"\n[PHASE 4] ============ STEP 4: CALCULATE RISK STATISTICS ============")
            statistics = calculate_statistics(df)
            print(f"[PHASE 4] ✓ Market statistics computed:")
            for stat_name in ['volatility', 'sharpe_ratio', 'max_drawdown', 'win_rate', 'avg_return']:
                if stat_name in statistics:
                    print(f"[PHASE 4]    {stat_name}: {statistics[stat_name]}")
            
            print(f"\n[PHASE 5] ============ STEP 5: FETCH MACRO CONTEXT ============")
            macro = get_macro_context()
            print(f"[PHASE 5] ✓ Macro data fetched:")
            for macro_name in ['vix', '10y_yield', '2y_yield']:
                if macro_name in macro:
                    print(f"[PHASE 5]    {macro_name}: {macro[macro_name]}")
            
            print(f"\n[PHASE 6] ============ STEP 6: RUN DEBATE ROOM → SYNTHESIZE STRATEGY ============")
            print(f"[PHASE 6] Building rich market context for 16 agents...")
            
            current_price = _safe_float(df['close'].iloc[-1]) if len(df) > 0 else 0
            last_volume = int(df['volume'].iloc[-1]) if len(df) > 0 else 0
            
            # Build debate payload with ALL market context
            debate_payload = {
                "asset": ticker,
                "market": "equity",
                "timeframe": timeframe,
                "goal": goal,
                "risk_level": risk_level,
                "capital": capital,
                "market_data": {
                    "price": current_price,
                    "volume": last_volume,
                    "high_52w": df['high'].max(),
                    "low_52w": df['low'].min(),
                },
                "trend": {
                    "ema20": indicators.get('ema20'),
                    "ema50": indicators.get('ema50'),
                    "ema200": indicators.get('ema200'),
                    "trend_strength": indicators.get('trend_strength'),
                },
                "momentum": {
                    "rsi": indicators.get('rsi'),
                    "macd": indicators.get('macd'),
                    "macd_status": indicators.get('macd_status'),
                    "stochastic": indicators.get('stochastic'),
                },
                "volatility": {
                    "atr": indicators.get('atr'),
                    "atr_percent": indicators.get('atr_percent'),
                    "bollinger_width": indicators.get('bb_width'),
                },
                "structure": {
                    "support": indicators.get('support'),
                    "resistance": indicators.get('resistance'),
                },
                "statistics": statistics,
                "macro": macro,
                "selected_agents": data.get("selected_agents", [])
            }
            
            print(f"[PHASE 6] ✓ Debate payload ready with:")
            print(f"[PHASE 6]    Current Price: ${current_price:.2f}")
            print(f"[PHASE 6]    Indicators: {len([k for k in indicators.keys() if indicators[k] is not None])} calculated")
            print(f"[PHASE 6]    Statistics: {len(statistics)} metrics")
            print(f"[PHASE 6]    Macro context: {len(macro)} data points")
            
            print(f"\n[PHASE 6] Running debate room with all agents...")
            print(f"[PHASE 6] 🗣️  Agents will synthesize strategy based on REAL market data")
            
            debate_start = datetime.now()
            result = run_trading_strategy_debate(debate_payload)
            print("\n[DEBUG] ===== DEBATE RESULT =====")
            print("Keys:", result.keys() if result else None)
            print("Strategy:", result.get("strategy"))
            print("Debate Log Length:", len(result.get("debate_log", [])))
            print("Debate Log Sample:", result.get("debate_log", [])[:2])
            print("================================\n")
            debate_duration = (datetime.now() - debate_start).total_seconds()
            
            print(f"[PHASE 6] ✓ Debate completed in {debate_duration:.3f} seconds")
            print(f"[PHASE 6]    Agents used: {len(result.get('agents_used', []))} / 16")
            print(f"[PHASE 6]    Strategy generated: {result['strategy'] if result.get('strategy') else 'N/A'}")
            
            # Extract strategy from debate result
            strategy_from_debate = result.get('strategy', {})
            
            print(f"\n[PHASE 7] ============ STEP 7: TRANSFORM DEBATE STRATEGY TO BACKTEST FORMAT ============")
            
            # Helper: Convert string indicators to backtest format
            def normalize_indicators(indicators_input):
                """Convert string indicators (from debate) to object format (for backtest)"""
                if not indicators_input:
                    return [{"name": "RSI", "period": 14}]
                
                normalized = []
                for ind in indicators_input:
                    if isinstance(ind, str):
                        # Parse string like "EMA20", "MACD(12,26,9)", "ATR(14)"
                        if "(" in ind:
                            name = ind.split("(")[0].strip().upper()
                            period_str = ind.split("(")[1].split(")")[0]
                            try:
                                periods = [int(p.strip()) for p in period_str.split(",")]
                                obj = {"name": name}
                                
                                # Map periods to correct parameter names based on indicator type
                                if name == "MACD" and len(periods) >= 3:
                                    obj["fast"] = periods[0]
                                    obj["slow"] = periods[1]
                                    obj["signal"] = periods[2]
                                elif name == "BB" and len(periods) >= 1:
                                    obj["period"] = periods[0]
                                    if len(periods) >= 2:
                                        obj["std_dev"] = periods[1]
                                elif name == "STOCH" and len(periods) >= 2:
                                    obj["k_period"] = periods[0]
                                    obj["d_period"] = periods[1]
                                elif len(periods) == 1:
                                    obj["period"] = periods[0]
                                else:
                                    obj["periods"] = periods
                                
                                normalized.append(obj)
                            except:
                                normalized.append({"name": ind.upper()})
                        else:
                            # Parse simple names like "EMA20" → {"name": "EMA", "period": 20}
                            for i, char in enumerate(ind):
                                if char.isdigit():
                                    try:
                                        name = ind[:i].upper()
                                        period = int(ind[i:])
                                        normalized.append({"name": name, "period": period})
                                        break
                                    except:
                                        normalized.append({"name": ind.upper()})
                                        break
                            else:
                                normalized.append({"name": ind.upper()})
                    elif isinstance(ind, dict):
                        # Ensure name is uppercase
                        ind_copy = ind.copy()
                        if "name" in ind_copy:
                            ind_copy["name"] = ind_copy["name"].upper()
                        normalized.append(ind_copy)
                    else:
                        normalized.append({"name": str(ind).upper()})
                
                return normalized if normalized else [{"name": "RSI", "period": 14}]
            
            # Helper: Convert text entry/exit rules to structured conditions
            def normalize_conditions(conditions_input, condition_type="entry"):
                """Convert text rules to structured entry/exit conditions"""
                if not conditions_input:
                    if condition_type == "entry":
                        return [{"indicator": "RSI", "operator": "<", "value": 30}]
                    else:
                        return [{"indicator": "RSI", "operator": ">", "value": 70}]
                
                normalized = []
                import re
                
                for cond in conditions_input:
                    if isinstance(cond, dict):
                        # Already structured
                        normalized.append(cond)
                    elif isinstance(cond, str):
                        # Try to extract multiple conditions from text
                        # Look for patterns like: "RSI > 50", "EMA20 < EMA50", "MACD > signal", etc.
                        
                        # Common entry rule patterns
                        patterns = [
                            (r'RSI\s*(?:\(\d+\))?\s*([<>]=?)\s*([\d.]+)', 'RSI'),
                            (r'MACD\s*(?:\(\d+,\d+,\d+\))?\s*([<>]=?)\s*(?:signal|line)', 'MACD'),
                            (r'EMA(\d+)\s*([<>]=?)\s*EMA(\d+)', 'EMA_cross'),
                            (r'price\s*(?:close[ds]?\s*)?([<>]=?)\s*EMA(\d+)', 'price_EMA'),
                            (r'ATR\s*(?:\(\d+\))?\s*([<>]=?)\s*([\d.]+)', 'ATR'),
                            (r'Stochastic\s*%K\s*([<>]=?)\s*([\d.]+)', 'Stoch'),
                            (r'Bollinger\s*(?:Bands)?\s*([a-z]+)', 'BB'),
                        ]
                        
                        extracted_any = False
                        cond_lower = cond.lower()
                        
                        # Try to extract structured conditions
                        for pattern, indicator_type in patterns:
                            matches = re.finditer(pattern, cond, re.IGNORECASE)
                            for match in matches:
                                extracted_any = True
                                if indicator_type == 'RSI' and len(match.groups()) >= 2:
                                    normalized.append({
                                        "indicator": "RSI",
                                        "operator": match.group(1),
                                        "value": float(match.group(2))
                                    })
                                elif indicator_type == 'EMA_cross' and len(match.groups()) >= 2:
                                    # EMA20 > EMA50 or similar
                                    normalized.append({
                                        "indicator": f"EMA{match.group(1)}",
                                        "operator": match.group(2),
                                        "value": f"EMA{match.group(3)}"
                                    })
                                elif indicator_type == 'price_EMA' and len(match.groups()) >= 2:
                                    # Price > EMA20
                                    normalized.append({
                                        "indicator": "CLOSE",
                                        "operator": match.group(1),
                                        "value": f"EMA{match.group(2)}"
                                    })
                                elif indicator_type == 'ATR' and len(match.groups()) >= 2:
                                    normalized.append({
                                        "indicator": "ATR",
                                        "operator": match.group(1),
                                        "value": float(match.group(2))
                                    })
                                elif indicator_type == 'MACD':
                                    # MACD cross signal
                                    if "crosses above" in cond_lower or "above" in cond_lower:
                                        normalized.append({
                                            "indicator": "MACD",
                                            "operator": "crosses_above",
                                            "value": "MACD_SIGNAL"
                                        })
                                    elif "crosses below" in cond_lower or "below" in cond_lower:
                                        normalized.append({
                                            "indicator": "MACD",
                                            "operator": "crosses_below",
                                            "value": "MACD_SIGNAL"
                                        })
                        
                        # If we extracted conditions, use them; otherwise use the text rule
                        if not extracted_any:
                            # Store the raw text rule for reference, but also create a fallback
                            normalized.append({"rule_text": cond})
                            # Add a sensible default based on condition type
                            if condition_type == "entry":
                                # Default to RSI oversold for entries
                                normalized.append({"indicator": "RSI", "operator": "<", "value": 40})
                            else:
                                # Default to RSI overbought for exits
                                normalized.append({"indicator": "RSI", "operator": ">", "value": 60})
                    else:
                        normalized.append(cond)
                
                return normalized if normalized else (
                    [{"indicator": "RSI", "operator": "<", "value": 30}] 
                    if condition_type == "entry"
                    else [{"indicator": "RSI", "operator": ">", "value": 70}]
                )
            
            # Normalize indicators and conditions from debate
            normalized_indicators = normalize_indicators(strategy_from_debate.get('indicators', []))
            normalized_entry = normalize_conditions(strategy_from_debate.get('entry_rules', strategy_from_debate.get('entry_conditions', [])), "entry")
            normalized_exit = normalize_conditions(strategy_from_debate.get('exit_rules', strategy_from_debate.get('exit_conditions', [])), "exit")
            
            # Use debate-generated strategy with backtest params
            backtest_payload = {
                "ticker": ticker.upper(),
                "timeframe": timeframe,
                "start_date": data.get("start_date", "2015-01-01"),
                "initial_capital": capital,
                "position_size": data.get("position_size", 1.0),
                "commission_pct": data.get("commission_pct", 0.001),
                "slippage_pct": data.get("slippage_pct", 0.0005),
                "stop_loss_pct": data.get("stop_loss_pct", 0.10),
                "take_profit_pct": data.get("take_profit_pct", 0.25),
                # Use NORMALIZED indicators and conditions from debate
                "indicators": list(normalized_indicators) if isinstance(normalized_indicators, (list, tuple)) else normalized_indicators,
                "entry_conditions": list(normalized_entry) if isinstance(normalized_entry, (list, tuple)) else normalized_entry,
                "exit_conditions": list(normalized_exit) if isinstance(normalized_exit, (list, tuple)) else normalized_exit,
            }
            
            print(f"[PHASE 7] ✓ Backtest configuration prepared:")
            print(f"[PHASE 7]    Ticker: {backtest_payload['ticker']}")
            print(f"[PHASE 7]    Start Date: {backtest_payload['start_date']}")
            print(f"[PHASE 7]    Initial Capital: ${backtest_payload['initial_capital']:,}")
            print(f"[PHASE 7]    Position Size: {backtest_payload['position_size']:.1%}")
            print(f"[PHASE 7]    Commission: {backtest_payload['commission_pct']*100:.4f}%")
            print(f"[PHASE 7]    Slippage: {backtest_payload['slippage_pct']*100:.4f}%")
            print(f"[PHASE 7]    Indicators (normalized): {len(backtest_payload['indicators'])} - {[i.get('name', '?') for i in backtest_payload['indicators']]}")
            print(f"[PHASE 7]    Entry rules (normalized): {len(backtest_payload['entry_conditions'])}")
            print(f"[PHASE 7]    Exit rules (normalized): {len(backtest_payload['exit_conditions'])}")
            print(f"[PHASE 7]    Data bars: {len(df)}")
            
            print(f"\n[PHASE 8] ============ STEP 8: RUN BACKTEST ON REAL DATA ============")
            print(f"[PHASE 8] Executing backtest engine with debate-generated strategy...")
            print(f"[PHASE 8] 📊 Backtesting {len(df)} real price bars with {len(backtest_payload['entry_conditions'])} entry rules")
            
            backtest_start = datetime.now()
            try:
                backtest_result = run_dsl_backtest(backtest_payload, result_id=str(uuid.uuid4()))
                backtest_duration = (datetime.now() - backtest_start).total_seconds()
                
                print(f"\n[PHASE 8] ✓ Backtest completed successfully in {backtest_duration:.3f} seconds")
                
                if backtest_result.get('metrics'):
                    metrics = backtest_result['metrics']
                    print(f"[PHASE 8]    Total Return: {metrics.get('total_return', 'N/A')}%")
                    print(f"[PHASE 8]    Sharpe Ratio: {metrics.get('sharpe_ratio', 'N/A')}")
                    print(f"[PHASE 8]    Max Drawdown: {metrics.get('max_drawdown', 'N/A')}%")
                    print(f"[PHASE 8]    Win Rate: {metrics.get('win_rate', 'N/A')}%")
                    print(f"[PHASE 8]    Total Trades: {metrics.get('total_trades', 0)}")
                    print(f"[PHASE 8]    Winning Trades: {metrics.get('winning_trades', 0)}")
                    print(f"[PHASE 8]    Losing Trades: {metrics.get('losing_trades', 0)}")
                
                if backtest_result.get('trades'):
                    trades = backtest_result['trades']
                    print(f"\n[PHASE 8]    Trade Log: {len(trades)} real trades executed")
                    if len(trades) > 0:
                        first = trades[0]
                        last = trades[-1]
                        print(f"[PHASE 8]       First: {first.get('entry_date')} @ ${float(first.get('entry_price', 0)):.2f} → {first.get('exit_date')} @ ${float(first.get('exit_price', 0)):.2f} ({first.get('pnl_pct', 'N/A')}%)")
                        print(f"[PHASE 8]       Last:  {last.get('entry_date')} @ ${float(last.get('entry_price', 0)):.2f} → {last.get('exit_date')} @ ${float(last.get('exit_price', 0)):.2f} ({last.get('pnl_pct', 'N/A')}%)")
                

                print(f"\n[PHASE 8B] ============ STEP 8B: QUANTITATIVE VALIDATION ============")
                
                def local_backtest_func(strategy_str, d_df):
                    from backtest_engine.dsl_engine import run_dsl_backtest
                    # we only override the dates to match d_df
                    # and pass the rest from backtest_payload as is.
                    mini_payload = backtest_payload.copy()
                    if len(d_df) > 0:
                        mini_payload["start_date"] = str(d_df.index[0].date() if isinstance(d_df.index, pd.DatetimeIndex) else d_df['date'].iloc[0].date() if 'date' in d_df else '2015-01-01')
                    return run_dsl_backtest(mini_payload, result_id="temp")

                # The validation takes the original df
                validation_result = run_validation(
                    strategy=str(strategy_from_debate), 
                    backtest_result=backtest_result, 
                    market_data=df.copy(), 
                    backtest_func=local_backtest_func
                )
                print(f"[PHASE 8B] ✓ Validation completed successfully")
                
                total_time = (datetime.now(timezone.utc) - execution_start).total_seconds()

                
                print("\n" + "="*120)
                print("[PIPELINE_FULL] ════════════════════════════════════════════════════════════════")
                print("[PIPELINE_FULL] ✅ COMPLETE PIPELINE FINISHED SUCCESSFULLY")
                print("[PIPELINE_FULL] NLP → DATA → INDICATORS → DEBATE ROOM → BACKTEST")
                print("[PIPELINE_FULL] ════════════════════════════════════════════════════════════════")
                print(f"[PIPELINE_FULL] Total time: {total_time:.3f} seconds")
                print(f"[PIPELINE_FULL] ✓ All data is REAL (MongoDB + yfinance)")
                print(f"[PIPELINE_FULL] ✓ Strategy synthesized by {len(result.get('agents_used', []))} agents via debate")
                print(f"[PIPELINE_FULL] ✓ Backtest executed on {len(df)} real price bars")
                print("="*120)
                
                # ── STORE STRATEGY TO MONGODB ──
                strategy_id = str(uuid.uuid4())
                strategies_collection = get_db()["strategies"]
                
                # Helper to safely convert timestamps
                def safe_isoformat(val):
                    """Safely convert values to ISO format strings"""
                    if val is None:
                        return None
                    if isinstance(val, str):
                        return val
                    if hasattr(val, 'isoformat'):
                        try:
                            return val.isoformat()
                        except:
                            return str(val)
                    # Handle pandas Timestamp
                    if hasattr(val, 'to_pydatetime'):
                        try:
                            return val.to_pydatetime().isoformat()
                        except:
                            return str(val)
                    return str(val) if val is not None else None
                
                strategy_record = {
                    "strategy_id": strategy_id,
                    "ticker": ticker.upper(),
                    "timeframe": timeframe,
                    "goal": goal,
                    "risk_level": risk_level,
                    "created_at": datetime.now(timezone.utc),
                    "prompt": data.get("prompt", ""),
                    
                    # Strategy details from debate
                    "strategy_from_debate": strategy_from_debate,
                    "debate_agents_used": result.get('agents_used', []),
                    "debate_log": result.get('debate_log', []),
                    "debate_rounds": result.get('debate_rounds', 2),
                    "debate_full_conversation": result.get('debate', {}),  # Full debate with arguments and critiques
                    "debate_topic": result.get('topic', {}),
                    "debate_trading_request": result.get('trading_request', {}),
                    
                    # Backtest configuration and results
                    "backtest_payload": backtest_payload,
                    "backtest_result": backtest_result,
                    
                    # Market data snapshot
                    "market_data": {
                        "current_price": float(df.iloc[-1]['close']) if len(df) > 0 else None,
                        "bars_tested": len(df),
                        "date_range": {
                            "start": safe_isoformat(df.iloc[0]['date'] if 'date' in df.columns else df.index[0]) if len(df) > 0 else None,
                            "end": safe_isoformat(df.iloc[-1]['date'] if 'date' in df.columns else df.index[-1]) if len(df) > 0 else None
                        }
                    },
                    
                    # Capital and risk setup
                    "capital_setup": {
                        "initial_capital": capital,
                        "position_size": data.get("position_size", 1.0),
                        "commission_pct": data.get("commission_pct", 0.001),
                        "slippage_pct": data.get("slippage_pct", 0.0005),
                        "stop_loss_pct": data.get("stop_loss_pct", 0.10),
                        "take_profit_pct": data.get("take_profit_pct", 0.25)
                    },
                    
                    "execution_time_seconds": total_time,
                    "status": "success" if backtest_result.get("success") else "completed_with_backtest_issues"
                }
                
                try:
                    strategies_collection.insert_one(strategy_record)
                    print(f"[STORAGE] ✓ Strategy stored with ID: {strategy_id}")
                except Exception as e:
                    print(f"[STORAGE] ⚠ Failed to store strategy: {e}")
                    strategy_id = None
                
                return _resp(
                    data={
                        "success": True,
                        "strategy_id": strategy_id,
                        "ticker": ticker.upper(),
                        "timeframe": timeframe,
                        "goal": goal,
                        "risk_level": risk_level,
                        "prompt": data.get("prompt", ""),
                        "strategy_from_debate": strategy_from_debate,
                        "debate_agents_used": result.get('agents_used', []),
                        "debate_full_conversation": result.get('debate', {}),
                        "debate_topic": result.get('topic', {}),
                        "debate_trading_request": result.get('trading_request', {}),
                        "debate_log": result.get('debate_log', []),
                        "debate_rounds": result.get('debate_rounds', 2),
                        "backtest_payload": backtest_payload,
                        "backtest_result": backtest_result,
                        "execution_timestamp": datetime.now().isoformat(),
                        "total_execution_time_seconds": total_time,
                    },
                    status=200
                )
            
            except Exception as e:
                print(f"\n[ERROR]   ✗ Backtest failed: {e}")
                import traceback
                traceback.print_exc()
                return _resp(error=f"Backtest failed: {str(e)}", status=500)
        
        except Exception as e:
            print(f"\n[ERROR]   ✗ Pipeline failed: {str(e)}")
            print("="*100)
            logger.error(f"[PipelineFull] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Pipeline failed: {str(e)}", status=500)

    # ══════════════════════════════════════════════════════════════════════════════════
    # STRATEGY RETRIEVAL ROUTES
    # ══════════════════════════════════════════════════════════════════════════════════

    @app.post("/api/strategies")
    def save_strategy():
        """
        Save a strategy to MongoDB from the frontend strategy builder.
        
        REQUEST BODY:
        {
            "strategyId": "optional-id",
            "workflowId": "same-as-strategyId",
            "ticker": "RELIANCE.NS",
            "timeframe": "1D",
            "goal": "momentum",
            "riskLevel": "moderate",
            "style": "swing",
            "nodes": [...],
            "edges": [...],
            "entryRules": [...],
            "exitRules": [...],
            "indicators": [...],
            "metadata": {
                "createdAt": "ISO timestamp",
                "updatedAt": "ISO timestamp",
                "agentsUsed": [...],
                "debateLog": [...],
                "notes": "optional user notes"
            }
        }
        
        RESPONSE:
        {
            "success": true,
            "data": {
                "id": "generated-id",
                "strategyId": "strategyId",
                "message": "Strategy saved successfully"
            }
        }
        """
        try:
            body = request.get_json(silent=True) or {}
            
            # Validate required fields
            required_fields = ["ticker", "goal", "timeframe"]
            for field in required_fields:
                if not body.get(field):
                    return _resp(error=f"Missing required field: {field}", status=400)
            
            # Generate IDs if not provided
            strategy_id = body.get("strategyId") or str(uuid.uuid4())
            workflow_id = body.get("workflowId") or strategy_id  # Same as strategyId
            
            db = get_db()
            strategies_collection = db["strategies"]
            
            # Prepare document
            doc = {
                "id": str(uuid.uuid4()),
                "strategy_id": strategy_id,
                "workflow_id": workflow_id,
                "ticker": body.get("ticker", "").upper(),
                "timeframe": body.get("timeframe", "1D"),
                "goal": body.get("goal", ""),
                "risk_level": body.get("riskLevel", "moderate"),
                "style": body.get("style", ""),
                "nodes": body.get("nodes", []),
                "edges": body.get("edges", []),
                "entry_rules": body.get("entryRules", []),
                "exit_rules": body.get("exitRules", []),
                "indicators": body.get("indicators", []),
                "metadata": body.get("metadata", {
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "agents_used": [],
                    "debate_log": [],
                    "notes": ""
                }),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "status": "created_by_user"
            }
            
            # Upsert document (insert or update if strategyId exists)
            result = strategies_collection.update_one(
                {"strategy_id": strategy_id},
                {"$set": doc},
                upsert=True
            )
            
            logger.info(f"Strategy saved: {strategy_id} for {doc['ticker']}")
            
            return _resp(
                data={
                    "id": doc["id"],
                    "strategy_id": strategy_id,
                    "workflow_id": workflow_id,
                    "message": "Strategy saved successfully"
                },
                status=201
            )
        
        except Exception as e:
            logger.error(f"[SaveStrategy] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Failed to save strategy: {str(e)}", status=500)

    @app.get("/api/strategies/history")
    def get_strategy_history():
        """
        Retrieve history of strategies (for History tab in UI).
        Returns list of recently created/modified strategies.
        
        Example: GET /api/strategies/history?limit=20
        """
        try:
            limit = min(request.args.get("limit", 20, type=int), 100)
            
            strategies_collection = get_db()["strategies"]
            strategies = list(strategies_collection.find({}).sort("updated_at", -1).limit(limit))
            
            # Format for History tab
            history_items = []
            for strategy in strategies:
                created_at = strategy.get("created_at")
                if hasattr(created_at, "isoformat"):
                    created_at = created_at.isoformat()
                
                updated_at = strategy.get("updated_at")
                if hasattr(updated_at, "isoformat"):
                    updated_at = updated_at.isoformat()
                
                history_items.append({
                    "id": strategy.get("id", ""),
                    "strategy_id": strategy.get("strategy_id", ""),
                    "ticker": strategy.get("ticker", ""),
                    "goal": strategy.get("goal", ""),
                    "risk_level": strategy.get("risk_level", ""),
                    "created_at": created_at,
                    "updated_at": updated_at
                })
            
            return _resp(
                data=history_items,
                meta={"count": len(history_items)},
                status=200
            )
        except Exception as e:
            logger.error(f"[GetStrategyHistory] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Failed to retrieve history: {str(e)}", status=500)

    @app.get("/api/strategies/<string:strategy_id>")
    def get_strategy(strategy_id):
        """
        Retrieve a stored strategy by ID from MongoDB.
        Returns complete strategy details including debate output and backtest results.
        
        Example: GET /api/strategies/550e8400-e29b-41d4-a716-446655440000
        """
        try:
            strategies_collection = get_db()["strategies"]
            strategy = strategies_collection.find_one({"strategy_id": strategy_id})
            
            if not strategy:
                return _resp(error=f"Strategy '{strategy_id}' not found", status=404)
            
            # Remove MongoDB _id for cleaner response
            if "_id" in strategy:
                del strategy["_id"]
            
            # Convert datetime objects to ISO format strings
            if "created_at" in strategy and hasattr(strategy["created_at"], "isoformat"):
                strategy["created_at"] = strategy["created_at"].isoformat()
            
            return _resp(
                data={
                    "success": True,
                    "strategy": strategy
                },
                status=200
            )
        except Exception as e:
            logger.error(f"[GetStrategy] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Failed to retrieve strategy: {str(e)}", status=500)

    @app.get("/api/strategies/ticker/<string:ticker>")
    def get_strategies_by_ticker(ticker):
        """
        Retrieve all strategies for a specific ticker.
        Returns list of strategies sorted by creation date (newest first).
        
        Example: GET /api/strategies/ticker/RELIANCE.NS
        """
        try:
            strategies_collection = get_db()["strategies"]
            strategies = list(strategies_collection.find(
                {"ticker": ticker.upper()}
            ).sort("created_at", -1).limit(100))
            
            # Remove MongoDB _id and convert dates for cleaner response
            for strategy in strategies:
                if "_id" in strategy:
                    del strategy["_id"]
                if "created_at" in strategy and hasattr(strategy["created_at"], "isoformat"):
                    strategy["created_at"] = strategy["created_at"].isoformat()
            
            return _resp(
                data={
                    "success": True,
                    "ticker": ticker.upper(),
                    "count": len(strategies),
                    "strategies": strategies
                },
                status=200
            )
        except Exception as e:
            logger.error(f"[GetStrategiesByTicker] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Failed to retrieve strategies: {str(e)}", status=500)

    @app.get("/api/strategies")
    def list_all_strategies():
        """
        Retrieve all stored strategies with pagination.
        Returns list of strategies sorted by creation date (newest first).
        
        Query parameters:
        - limit: Number of strategies to return (default: 50, max: 500)
        - skip: Number of strategies to skip for pagination (default: 0)
        
        Example: GET /api/strategies?limit=20&skip=0
        """
        try:
            limit = min(request.args.get("limit", 50, type=int), 500)
            skip = request.args.get("skip", 0, type=int)
            
            strategies_collection = get_db()["strategies"]
            strategies = list(strategies_collection.find().sort("created_at", -1).skip(skip).limit(limit))
            
            # Remove MongoDB _id and convert dates for cleaner response
            for strategy in strategies:
                if "_id" in strategy:
                    del strategy["_id"]
                if "created_at" in strategy and hasattr(strategy["created_at"], "isoformat"):
                    strategy["created_at"] = strategy["created_at"].isoformat()
            
            # Get total count
            total_count = strategies_collection.count_documents({})
            
            return _resp(
                data={
                    "success": True,
                    "total_count": total_count,
                    "returned": len(strategies),
                    "limit": limit,
                    "skip": skip,
                    "strategies": strategies
                },
                status=200
            )
        except Exception as e:
            logger.error(f"[ListAllStrategies] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Failed to list strategies: {str(e)}", status=500)

    @app.delete("/api/strategies/<string:strategy_id>")
    def delete_strategy(strategy_id):
        """
        Delete a stored strategy by ID.
        
        Example: DELETE /api/strategies/550e8400-e29b-41d4-a716-446655440000
        """
        try:
            strategies_collection = get_db()["strategies"]
            result = strategies_collection.delete_one({"strategy_id": strategy_id})
            
            if result.deleted_count == 0:
                return _resp(error=f"Strategy '{strategy_id}' not found", status=404)
            
            return _resp(
                data={
                    "success": True,
                    "message": f"Strategy '{strategy_id}' deleted successfully"
                },
                status=200
            )
        except Exception as e:
            logger.error(f"[DeleteStrategy] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Failed to delete strategy: {str(e)}", status=500)

    # ══════════════════════════════════════════════════════════════════════════════════
    # ADVERSARIAL STRESS-TESTING ROUTE
    # ══════════════════════════════════════════════════════════════════════════════════

    @app.post("/api/adversarial")
    def run_adversarial_stress_test():
        """
        POST /api/adversarial
        
        Stress-test a trading strategy using adversarial agents.
        Each agent finds loopholes and suggests modifications.
        
        REQUEST BODY:
        {
            "strategy_id": "cc13ac25-...",
            "agents": ["crisis_injection", "liquidity_shock", "crowding_risk", "adversarial"]
        }
        
        RESPONSE:
        {
            "success": true,
            "data": {
                "adversarial_id": "<uuid>",
                "original_strategy_id": "cc13ac25-...",
                "agents_run": ["crisis_injection", ...],
                "loopholes": [ all findings... ],
                "original_backtest": { metrics... },
                "stress_backtest": { re-run metrics after mods... },
                "improvement_delta": {
                    "sharpe_ratio": +0.3,
                    "max_drawdown": -0.05,
                    "win_rate": -0.02
                },
                "created_at": "ISO timestamp"
            }
        }
        """
        try:
            from adversarial_agents import (
                run_adversarial_agents,
                merge_agent_modifications,
                apply_modifications_to_payload
            )
            
            print("[ADVERSARIAL] ════════════════════════════════════════════════════════════════")
            print("[ADVERSARIAL] 🚨 ADVERSARIAL STRESS TEST BEGINNING")
            print("[ADVERSARIAL] ════════════════════════════════════════════════════════════════")
            
            body = request.get_json(silent=True) or {}
            strategy_id = body.get("strategy_id", "").strip()
            agents_to_run = body.get("agents", [
                "crisis_injection", "liquidity_shock", "crowding_risk", "adversarial"
            ])
            
            if not strategy_id:
                return _resp(error="'strategy_id' is required", status=400)
            
            # ── Fetch original strategy from MongoDB ─────────────────────────────────────
            print(f"[ADVERSARIAL] Fetching strategy: {strategy_id}")
            db = get_db()
            strategies_coll = db["strategies"]
            original_strategy = strategies_coll.find_one({"strategy_id": strategy_id})
            
            if not original_strategy:
                return _resp(error=f"Strategy '{strategy_id}' not found", status=404)
            
            # Extract components
            strategy_from_debate = original_strategy.get("strategy_from_debate", {})
            backtest_payload = original_strategy.get("backtest_payload", {})
            original_backtest_result = original_strategy.get("backtest_result", {})
            ticker = original_strategy.get("ticker", "").upper()
            
            print(f"[ADVERSARIAL] ✓ Loaded strategy for {ticker}")
            print(f"[ADVERSARIAL] Original backtest: Sharpe={original_backtest_result.get('sharpe_ratio', 'N/A')}, WinRate={original_backtest_result.get('win_rate', 'N/A')}")
            
            # ── Run adversarial agents ───────────────────────────────────────────────────
            print(f"[ADVERSARIAL] Running {len(agents_to_run)} agents: {agents_to_run}")
            agent_results = run_adversarial_agents(
                agents_to_run,
                strategy_from_debate,
                original_backtest_result,
                backtest_payload
            )
            
            # Collect all loopholes across agents
            all_loopholes = []
            for result in agent_results:
                if "error" not in result:
                    for loophole in result.get("loopholes_found", []):
                        all_loopholes.append({
                            "agent": result["agent"],
                            "finding": loophole,
                            "severity": result.get("severity", "medium"),
                            "confidence": result.get("confidence", 0.5)
                        })
            
            print(f"[ADVERSARIAL] ✓ Found {len(all_loopholes)} loopholes across agents")
            
            # ── Merge modifications from all agents ───────────────────────────────────────
            print("[ADVERSARIAL] Merging agent modifications...")
            merged_modifications = merge_agent_modifications(agent_results)
            modified_backtest_payload = apply_modifications_to_payload(backtest_payload, merged_modifications)
            
            print(f"[ADVERSARIAL]   Added {len(merged_modifications.get('entry_conditions', []))} entry mods")
            print(f"[ADVERSARIAL]   Added {len(merged_modifications.get('exit_conditions', []))} exit mods")
            print(f"[ADVERSARIAL]   Risk mgmt updates: {len(merged_modifications.get('risk_management', {}))}")
            
            # ── Re-run backtest with modified strategy ────────────────────────────────────
            print("[ADVERSARIAL] Re-running backtest with stress-tested modifications...")
            stress_backtest_result = run_dsl_backtest(modified_backtest_payload, result_id=str(uuid.uuid4()))
            
            if not stress_backtest_result.get("success", False):
                logger.warning(f"[ADVERSARIAL] Stress backtest showed issues: {stress_backtest_result.get('status', 'unknown')}")
            
            print(f"[ADVERSARIAL] ✓ Stress backtest complete")
            print(f"[ADVERSARIAL]   New Sharpe: {stress_backtest_result.get('sharpe_ratio', 'N/A')}")
            print(f"[ADVERSARIAL]   New WinRate: {stress_backtest_result.get('win_rate', 'N/A')}")
            
            # ── Calculate improvement delta ──────────────────────────────────────────────
            def safe_delta(key):
                try:
                    orig = float(original_backtest_result.get(key, 0))
                    stress = float(stress_backtest_result.get(key, 0))
                    return round(stress - orig, 4)
                except (TypeError, ValueError):
                    return 0
            
            improvement_delta = {
                "sharpe_ratio": safe_delta("sharpe_ratio"),
                "max_drawdown": safe_delta("max_drawdown"),
                "win_rate": safe_delta("win_rate"),
                "total_return": safe_delta("total_return"),
                "total_trades": int(stress_backtest_result.get("total_trades", 0)) - int(original_backtest_result.get("total_trades", 0))
            }
            
            # ── Store result in MongoDB ──────────────────────────────────────────────────
            adversarial_id = str(uuid.uuid4())
            result_doc = {
                "adversarial_id": adversarial_id,
                "original_strategy_id": strategy_id,
                "agents_run": agents_to_run,
                "loopholes": all_loopholes,
                "modified_backtest_payload": modified_backtest_payload,
                "original_backtest": original_backtest_result,
                "stress_backtest": stress_backtest_result,
                "improvement_delta": improvement_delta,
                "created_at": datetime.now(timezone.utc),
                "ticker": ticker,
                "status": "success"
            }
            
            adversarial_coll = db["adversarial_results"]
            adversarial_coll.insert_one(result_doc)
            
            print(f"[ADVERSARIAL] ✓ Result stored: {adversarial_id}")
            print("[ADVERSARIAL] ════════════════════════════════════════════════════════════════")
            print("[ADVERSARIAL] 🎯 ADVERSARIAL STRESS TEST COMPLETE")
            print("[ADVERSARIAL] ════════════════════════════════════════════════════════════════")
            
            # Remove MongoDB _id for clean response
            if "_id" in result_doc:
                del result_doc["_id"]
            
            # Convert datetime to ISO string
            if "created_at" in result_doc and hasattr(result_doc["created_at"], "isoformat"):
                result_doc["created_at"] = result_doc["created_at"].isoformat()
            
            return _resp(data=result_doc, status=200)
        
        except Exception as e:
            print(f"[ADVERSARIAL] ✗ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            logger.error(f"[AdversarialStressTest] Error: {str(e)}", exc_info=True)
            return _resp(error=f"Adversarial stress test failed: {str(e)}", status=500)

    # ── Natural Language Strategy Generation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    @app.post("/api/trading/strategy/from_prompt")
    def generate_strategy_from_prompt():
        """
        Generate trading strategy from natural language prompt with rich market context
        
        REQUEST:
        {
            "prompt": "Create a medium risk swing trading strategy for RELIANCE.NS using momentum and trend indicators on the daily timeframe",
            "capital": 100000,
            "selected_agents": ["MomentumAgent", "TrendFollowingAgent", "VolatilityAgent", "RiskManagementAgent"]
        }
        
        RESPONSE:
        {
            "strategy": {
                "entry_rules": [...],
                "exit_rules": [...],
                "indicators": [...],
                "filters": [...],
                "risk_management": {...}
            },
            "debate": {...},
            "features_used": {
                "indicators": {...},
                "statistics": {...},
                "macro": {...},
                ...
            },
            "timestamp": "..."
        }
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "Invalid request - JSON required"}), 400
            
            prompt = data.get("prompt", "").strip()
            if not prompt:
                return jsonify({"error": "Missing required field: prompt"}), 400
            
            capital = data.get("capital", 100000)
            selected_agents = data.get("selected_agents", [])
            
            logger.info(f"[StrategyFromPrompt] Parsing prompt: {prompt[:100]}...")
            
            # ── Parse prompt ────────────────────────────────────────────────
            parsed = parse_trading_prompt(prompt)
            ticker = parsed['asset']
            
            logger.info(f"[StrategyFromPrompt] Extracted: {ticker} on {parsed['timeframe']} for {parsed['goal']}")
            
            # ── Fetch market data ───────────────────────────────────────────
            logger.info(f"[StrategyFromPrompt] Fetching market data for {ticker}...")
            db = get_db()
            
            # Check MongoDB first
            raw_data = list(db.ohlcv.find({"ticker": ticker}).sort("date", 1))
            
            # If no data in MongoDB, fetch from yfinance
            if not raw_data:
                logger.info(f"[StrategyFromPrompt] No data in MongoDB, fetching from yfinance...")
                try:
                    tkr = yf.Ticker(ticker)
                    try:
                        df_yf = tkr.history(period="2y", interval="1d", auto_adjust=False, progress=False)
                    except TypeError:
                        df_yf = tkr.history(period="2y", interval="1d", auto_adjust=False)
                    
                    if df_yf.empty:
                        return jsonify({"error": f"No market data available for {ticker}"}), 422
                    
                    df_yf.index = pd.to_datetime(df_yf.index, utc=True)
                    fetched_at = datetime.now(timezone.utc)
                    
                    # Store in DB
                    for ts, row in df_yf.iterrows():
                        db.ohlcv.update_one(
                            {"ticker": ticker, "date": ts.to_pydatetime()},
                            {"$set": {
                                "ticker": ticker,
                                "date": ts.to_pydatetime(),
                                "open": _safe_float(row.get("Open")),
                                "high": _safe_float(row.get("High")),
                                "low": _safe_float(row.get("Low")),
                                "close": _safe_float(row.get("Close")),
                                "adj_close": _safe_float(row.get("Adj Close", row.get("Close"))),
                                "volume": int(row.get("Volume", 0) or 0),
                                "asset_class": _detect_asset_class(ticker),
                                "source": "yfinance",
                                "fetched_at": fetched_at,
                            }},
                            upsert=True,
                        )
                    logger.info(f"[StrategyFromPrompt] Stored {len(df_yf)} bars in MongoDB")
                    
                    # Fetch back from MongoDB to get all records
                    raw_data = list(db.ohlcv.find({"ticker": ticker}).sort("date", 1))
                except Exception as e:
                    logger.error(f"[StrategyFromPrompt] Failed to fetch data: {e}")
                    return jsonify({"error": f"Failed to fetch market data: {str(e)}"}), 500
            else:
                logger.info(f"[StrategyFromPrompt] Found {len(raw_data)} bars in MongoDB")
            
            if not raw_data:
                return jsonify({"error": f"No data for {ticker}"}), 422
            
            df = pd.DataFrame([
                {
                    "date": doc["date"],
                    "open": doc.get("open", 0),
                    "high": doc.get("high", 0),
                    "low": doc.get("low", 0),
                    "close": doc.get("close", 0),
                    "volume": doc.get("volume", 0),
                }
                for doc in raw_data
            ])
            
            logger.info(f"[StrategyFromPrompt] Loaded {len(df)} bars from DB")
            
            # ── Calculate indicators ────────────────────────────────────────
            logger.info(f"[StrategyFromPrompt] Computing indicators...")
            indicators = calculate_indicators(df)
            
            # ── Calculate statistics ────────────────────────────────────────
            logger.info(f"[StrategyFromPrompt] Computing market statistics...")
            statistics = calculate_statistics(df)
            
            # ── Fetch macro context ─────────────────────────────────────────
            logger.info(f"[StrategyFromPrompt] Fetching macro context...")
            macro = get_macro_context()
            
            # ── Build rich debate payload ───────────────────────────────────
            logger.info(f"[StrategyFromPrompt] Building feature-rich payload for agents...")
            
            current_price = _safe_float(df['close'].iloc[-1]) if len(df) > 0 else 0
            
            debate_payload = {
                # Core params
                "asset": ticker,
                "market": "equity",
                "timeframe": parsed['timeframe'],
                "goal": parsed['goal'],
                "risk_level": parsed['risk_level'],
                "capital": capital,
                
                # Price & volume
                "market_data": {
                    "price": current_price,
                    "volume": int(df['volume'].iloc[-1]) if len(df) > 0 else 0,
                },
                
                # Trend
                "trend": {
                    "ema20": indicators.get('ema20', 0),
                    "ema50": indicators.get('ema50', 0),
                    "ema200": indicators.get('ema200', 0),
                    "trend_strength": indicators.get('trend_strength', 'neutral'),
                },
                
                # Momentum
                "momentum": {
                    "rsi": indicators.get('rsi', 50),
                    "macd": indicators.get('macd', 0),
                    "macd_status": indicators.get('macd_status', 'neutral'),
                    "stochastic": indicators.get('stochastic', 50),
                },
                
                # Volatility
                "volatility": {
                    "atr": indicators.get('atr', 0),
                    "atr_percent": indicators.get('atr_percent', 0),
                    "bollinger_width": indicators.get('bb_width', 0),
                },
                
                # Structure
                "structure": {
                    "support": indicators.get('support', 0),
                    "resistance": indicators.get('resistance', 0),
                    "price_position": "near_support" if current_price < (indicators.get('support', 0) + current_price) / 2 else "neutral",
                },
                
                # Statistics
                "statistics": {
                    "avg_return": statistics.get('avg_return', 0),
                    "volatility": statistics.get('volatility', 0),
                    "sharpe": statistics.get('sharpe', 0),
                    "max_drawdown": statistics.get('max_drawdown', 0),
                    "win_rate": statistics.get('win_rate', 0),
                    "trend_direction": statistics.get('trend_direction', 'neutral'),
                },
                
                # Macro
                "macro": macro,
                
                # User preference
                "selected_agents": selected_agents if selected_agents else [],
            }
            
            logger.info(f"[StrategyFromPrompt] Invoking debate engine with {len(selected_agents) if selected_agents else 'default'} agents...")
            
            # ── Run debate ──────────────────────────────────────────────────
            result = run_trading_strategy_debate(debate_payload)
            print("\n[DEBUG] ===== DEBATE RESULT =====")
            print("Keys:", result.keys() if result else None)
            print("Strategy:", result.get("strategy"))
            print("Debate Log Length:", len(result.get("debate_log", [])))
            print("Debate Log Sample:", result.get("debate_log", [])[:2])
            print("================================\n")
            
            # ── Return enriched response ────────────────────────────────────
            logger.info(f"[StrategyFromPrompt] Strategy generation complete")
            
            return jsonify({
                "success": result.get("success", False),
                "strategy": result.get("strategy", {}),
                "debate": result.get("debate", {}),
                "agents_used": result.get("agents_used", []),
                "debate_log": result.get("debate_log", []),
                "features_used": {
                    "indicators": indicators,
                    "statistics": statistics,
                    "macro": macro,
                    "parsed_params": parsed,
                },
                "timestamp": result.get("timestamp"),
            }), 200 if result.get("success") else 202
        
        except Exception as e:
            logger.error(f"[StrategyFromPrompt] Error: {str(e)}", exc_info=True)
            return jsonify({
                "error": str(e),
                "success": False
            }), 500

    # ── Global error handlers ──────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Route not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    # Register API blueprints
    try:
        from api.routes.backtest_routes import backtest_bp
        app.register_blueprint(backtest_bp)
        from api.routes.paper_trading_routes import paper_trading_bp
        app.register_blueprint(paper_trading_bp)
        logger.info("Registered paper_trading blueprint at /api/paper_trading")
        logger.info("Registered backtest blueprint at /api/backtest")
    except Exception as e:
        logger.warning(f"Could not register backtest blueprint: {e}")

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    logger.info(f"Starting Flask server on http://localhost:{port}")
    logger.info(f"Debug mode: {debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)