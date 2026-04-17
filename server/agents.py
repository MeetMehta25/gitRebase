"""
Algorithmic Trading Strategy Multi-Agent System
17 specialized agents collaborate to design trading strategies
"""

from typing import Dict, Any, List
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
import os
import json
from dotenv import load_dotenv

load_dotenv()

from utils.key_rotator import groq_api_rotator

# ============================================================================
# API KEY ROTATION SYSTEM
# ============================================================================




def get_debate_model():
    """Get a ChatGroq instance with rotated API key"""
    return ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.7,
        max_retries=3,
        api_key=groq_api_rotator.get_next_key()
    )


def get_judge_model():
    """Get a ChatGroq instance for judge with rotated API key"""
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        max_retries=3,
        api_key=groq_api_rotator.get_next_key()
    )


# ============================================================================
# MARKET CONTEXT HELPER
# ============================================================================

def build_market_context_string(context: Dict[str, Any]) -> str:
    """Build a rich market context string from debate_payload for agent prompts"""
    if not context:
        return ""
    
    lines = ["CURRENT MARKET CONDITIONS:"]
    
    # Price & Volume
    if "market_data" in context:
        md = context["market_data"]
        lines.append(f"• Price: ${md.get('price', 'N/A')}")
        lines.append(f"• Volume: {md.get('volume', 'N/A'):,} shares")
    
    # Trend
    if "trend" in context:
        t = context["trend"]
        lines.append(f"• EMA20: ${t.get('ema20', 'N/A')}")
        lines.append(f"• EMA50: ${t.get('ema50', 'N/A')}")
        lines.append(f"• EMA200: ${t.get('ema200', 'N/A')}")
        lines.append(f"• Trend: {t.get('trend_strength', 'neutral').upper()}")
    
    # Momentum
    if "momentum" in context:
        m = context["momentum"]
        lines.append(f"• RSI(14): {m.get('rsi', 'N/A')}")
        lines.append(f"• MACD: {m.get('macd', 'N/A')} ({m.get('macd_status', 'neutral')})")
        lines.append(f"• Stochastic: {m.get('stochastic', 'N/A')}")
    
    # Volatility
    if "volatility" in context:
        v = context["volatility"]
        lines.append(f"• ATR(14): {v.get('atr', 'N/A')} ({v.get('atr_percent', 'N/A')}%)")
        lines.append(f"• BB Width: {v.get('bollinger_width', 'N/A')}")
    
    # Structure
    if "structure" in context:
        s = context["structure"]
        lines.append(f"• Support: ${s.get('support', 'N/A')}")
        lines.append(f"• Resistance: ${s.get('resistance', 'N/A')}")
        lines.append(f"• Position: {s.get('price_position', 'neutral')}")
    
    # Statistics
    if "statistics" in context:
        st = context["statistics"]
        lines.append(f"• Avg Return: {st.get('avg_return', 'N/A')}%")
        lines.append(f"• Volatility: {st.get('volatility', 'N/A')}%")
        lines.append(f"• Sharpe Ratio: {st.get('sharpe', 'N/A')}")
        lines.append(f"• Max Drawdown: {st.get('max_drawdown', 'N/A')}%")
        lines.append(f"• Win Rate: {st.get('win_rate', 'N/A')}%")
        lines.append(f"• Trend: {st.get('trend_direction', 'neutral')}")
    
    # Macro
    if "macro" in context:
        macro = context["macro"]
        lines.append(f"• VIX: {macro.get('vix', 'N/A')}")
        lines.append(f"• 10Y Yield: {macro.get('yield_10y', 'N/A')}%")
        lines.append(f"• 2Y Yield: {macro.get('yield_2y', 'N/A')}%")
        lines.append(f"• Yield Curve: {macro.get('yield_curve_spread', 'N/A')}%")
    
    return "\n".join(lines)


# ============================================================================
# TRADING AGENTS (17 TOTAL)
# ============================================================================

class TrendFollowingAgent:
    """Uses moving averages and trend indicators"""
    
    def __init__(self):
        self.name = "TrendFollowingAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Trend Following Agent in a trading strategy council.

YOUR MISSION: Propose entry/exit rules based on moving averages and trend analysis.

YOUR EXPERTISE:
- MA50, MA200 crossovers
- Trend direction confirmation
- Support and resistance levels
- Trend strength indicators

INSTRUCTION:
Propose trading rules that capture trending moves.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
ENTRY_SIGNALS: [2-3 specific conditions]
EXIT_SIGNALS: [2-3 specific conditions]
INDICATORS: [Which indicators to use]
STRENGTHS: [Why this works]
WEAKNESSES: [Known limitations]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "TREND_FOLLOWING"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Critique other agents' proposals"""
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate these trading proposals: {str(other_arguments)[:500]}
        
Critique them focusing on trend-following effectiveness. Be constructive."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "TREND_CRITIQUE",
            "round": 2
        }


class MomentumAgent:
    """Uses RSI, ROC and momentum indicators"""
    
    def __init__(self):
        self.name = "MomentumAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Momentum Agent in a trading strategy council.

YOUR MISSION: Propose entry/exit rules based on momentum indicators.

YOUR EXPERTISE:
- RSI (Relative Strength Index)
- Rate of Change (ROC)
- MACD momentum
- Stochastic oscillator

INSTRUCTION:
Propose trading rules that capture momentum shifts.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
ENTRY_SIGNALS: [2-3 specific conditions]
EXIT_SIGNALS: [2-3 specific conditions]
INDICATORS: [Which indicators to use]
OPTIMAL_SETTINGS: [RSI levels, ROC periods, etc]
EDGE: [What gives this an edge]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "MOMENTUM_DRIVEN"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate these proposals: {str(other_arguments)[:500]}
        
Critique focusing on momentum effectiveness. Be specific."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "MOMENTUM_CRITIQUE",
            "round": 2
        }


class MeanReversionAgent:
    """Uses RSI extremes and Bollinger Bands"""
    
    def __init__(self):
        self.name = "MeanReversionAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Mean Reversion Agent.

YOUR MISSION: Propose entry/exit rules for mean reversion trading.

YOUR EXPERTISE:
- RSI > 70 and < 30
- Bollinger Bands extremes
- Standard deviation bands
- Overbought/oversold conditions

INSTRUCTION:
Propose mean reversion trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
ENTRY_SIGNALS: [Overbought/oversold triggers]
EXIT_SIGNALS: [Return to mean indicators]
FILTERS: [What conditions must hold]
RISK: [When this strategy fails]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "MEAN_REVERSION"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique mean reversion assumptions. Be critical."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "MR_CRITIQUE",
            "round": 2
        }


class BreakoutAgent:
    """Detects resistance/support breakouts"""
    
    def __init__(self):
        self.name = "BreakoutAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Breakout Agent.

YOUR MISSION: Propose entry/exit rules for breakout trading.

YOUR EXPERTISE:
- Support/resistance levels
- Consolidation patterns
- Breakout confirmation
- False breakout filters

INSTRUCTION:
Propose breakout trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
ENTRY_SIGNALS: [How to identify and trade breakouts]
EXIT_SIGNALS: [Stop loss and profit targets]
LEVELS: [How to calculate support/resistance]
CONFIRMATION: [How to filter false breakouts]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "BREAKOUT"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique breakout viability. Be thorough."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "BREAKOUT_CRITIQUE",
            "round": 2
        }


class VolumeAnalysisAgent:
    """Uses volume spikes and accumulation signals"""
    
    def __init__(self):
        self.name = "VolumeAnalysisAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Volume Analysis Agent.

YOUR MISSION: Propose entry/exit rules based on volume.

YOUR EXPERTISE:
- Volume spikes
- On-Balance Volume (OBV)
- Accumulation/Distribution
- Volume profile levels

INSTRUCTION:
Propose volume-based trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
ENTRY_SIGNALS: [Volume conditions for entry]
EXIT_SIGNALS: [Volume divergence signals]
FILTERS: [Volume threshold rules]
VALIDATION: [How volume confirms other signals]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "VOLUME_DRIVEN"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique from volume perspective. Be analytical."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "VOLUME_CRITIQUE",
            "round": 2
        }


class VolatilityAgent:
    """Uses ATR and volatility expansion/compression"""
    
    def __init__(self):
        self.name = "VolatilityAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Volatility Agent.

YOUR MISSION: Propose entry/exit rules based on volatility.

YOUR EXPERTISE:
- ATR (Average True Range)
- Volatility regimes
- Expansion and compression
- VIX-style indicators

INSTRUCTION:
Propose volatility-based trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
ENTRY_SIGNALS: [Volatility conditions]
EXIT_SIGNALS: [How to exit based on volatility]
POSITION_SIZING: [How volatility affects sizing]
STOP_LOSS: [ATR-based stops]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "VOLATILITY_ADAPTIVE"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique volatility assumptions. Be critical."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "VOL_CRITIQUE",
            "round": 2
        }


class PatternRecognitionAgent:
    """Uses chart patterns like triangles and double bottoms"""
    
    def __init__(self):
        self.name = "PatternRecognitionAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Pattern Recognition Agent.

YOUR MISSION: Propose entry/exit rules based on chart patterns.

YOUR EXPERTISE:
- Head and shoulders
- Double tops/bottoms
- Triangles and flags
- Wedges and pennants

INSTRUCTION:
Propose pattern-based trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
PATTERNS: [Which patterns to trade]
ENTRY_RULES: [How to enter each pattern]
EXIT_RULES: [Pattern targets and stops]
CONFIRMATION: [What confirms valid patterns]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "PATTERN_BASED"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique pattern reliability. Be honest."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "PATTERN_CRITIQUE",
            "round": 2
        }


class StatisticalSignalAgent:
    """Uses statistical indicators like z-score deviations"""
    
    def __init__(self):
        self.name = "StatisticalSignalAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Statistical Signal Agent.

YOUR MISSION: Propose entry/exit rules based on statistics.

YOUR EXPERTISE:
- Z-score deviations
- Normal distribution
- Percentile levels
- Statistical significance

INSTRUCTION:
Propose statistical trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
STATISTICAL_TESTS: [Tests to apply]
ENTRY_THRESHOLDS: [Z-scores and percentiles]
EXIT_THRESHOLDS: [Mean-reversion levels]
DATA_REQUIREMENTS: [Lookback periods needed]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "STATISTICAL"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique statistical assumptions. Be rigorous."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "STAT_CRITIQUE",
            "round": 2
        }


class MarketRegimeAgent:
    """Determines market trending, ranging, or volatile"""
    
    def __init__(self):
        self.name = "MarketRegimeAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Market Regime Agent.

YOUR MISSION: Define market regime filters for strategy.

YOUR EXPERTISE:
- Trend detection
- Range identification
- Volatility regimes
- Regime switching

INSTRUCTION:
Propose regime-specific trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
REGIME_DETECTION: [How to identify regimes]
TREND_FILTER: [Rules to identify trending]
RANGE_FILTER: [Rules to identify ranging]
VOLATILITY_FILTER: [High vs low vol]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "REGIME_AWARE"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique regime filters. Be practical."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "REGIME_CRITIQUE",
            "round": 2
        }


class LiquidityAgent:
    """Ensures trades are executable based on liquidity"""
    
    def __init__(self):
        self.name = "LiquidityAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Liquidity Agent.

YOUR MISSION: Ensure strategy is executable with real liquidity.

YOUR EXPERTISE:
- Bid-ask spreads
- Volume requirements
- Slippage expectations
- Execution risk

INSTRUCTION:
Propose executable trading rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
LIQUIDITY_FILTERS: [Minimum volume/spread]
EXECUTION_RULES: [How to enter/exit]
SLIPPAGE_BUFFER: [Expected slippage]
ORDER_TYPES: [Market/limit order strategy]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "LIQUIDITY_FIRST"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique execution feasibility. Be realistic."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "LIQUIDITY_CRITIQUE",
            "round": 2
        }


class RiskManagementAgent:
    """Adds stop loss, take profit, and position sizing"""
    
    def __init__(self):
        self.name = "RiskManagementAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Risk Management Agent.

YOUR MISSION: Define risk controls for the strategy.

YOUR EXPERTISE:
- Position sizing
- Stop loss placement
- Take profit targets
- Risk-reward ratios
- Kelly Criterion

INSTRUCTION:
Propose risk management rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
POSITION_SIZE: [% of capital per trade]
STOP_LOSS: [ATR-based or % based]
TAKE_PROFIT: [Profit target strategy]
RISK_REWARD: [Minimum R:R ratio]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "RISK_CONSCIOUS"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique risk management. Be conservative."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "RM_CRITIQUE",
            "round": 2
        }


class PortfolioAgent:
    """Ensures diversification principles"""
    
    def __init__(self):
        self.name = "PortfolioAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Portfolio Agent.

YOUR MISSION: Ensure strategy fits diversification principles.

YOUR EXPERTISE:
- Correlation analysis
- Sector diversification
- Asset class balance
- Portfolio construction
- Max drawdown limits

INSTRUCTION:
Propose diversification-aware rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
CORRELATION_LIMITS: [Max correlation allowed]
SECTOR_CAPS: [Max % per sector]
MAX_DRAWDOWN: [Portfolio-level limits]
CROSS_ASSET: [If applicable, how assets interact]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "DIVERSIFICATION_FOCUSED"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique from portfolio perspective. Be holistic."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "PORTFOLIO_CRITIQUE",
            "round": 2
        }


class SentimentAgent:
    """Considers news and social sentiment"""
    
    def __init__(self):
        self.name = "SentimentAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Sentiment Agent.

YOUR MISSION: Incorporate sentiment analysis into strategy.

YOUR EXPERTISE:
- News sentiment
- Social media signals
- Institutional positioning
- Sentiment extremes

INSTRUCTION:
Propose sentiment-aware rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
SENTIMENT_SOURCES: [What to monitor]
SENTIMENT_FILTERS: [When to trade based on sentiment]
EXTREMES: [Contrarian signals]
WEIGHTING: [How much weight sentiment gets]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "SENTIMENT_AWARE"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique sentiment reliability. Be skeptical."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "SENTIMENT_CRITIQUE",
            "round": 2
        }


class MacroAgent:
    """Considers macro trends and market indexes"""
    
    def __init__(self):
        self.name = "MacroAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Macro Agent.

YOUR MISSION: Incorporate macroeconomic context.

YOUR EXPERTISE:
- Market index trends
- Economic cycles
- Interest rates
- Market breadth
- Sector rotation

INSTRUCTION:
Propose macro-aware rules.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
MACRO_FILTERS: [Economic conditions to monitor]
INDEX_CORRELATION: [How to use market indices]
ECONOMIC_CALENDAR: [Key events to avoid]
BREADTH_RULES: [Market participation checks]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "MACRO_INFORMED"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique macro assumptions. Be practical."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "MACRO_CRITIQUE",
            "round": 2
        }


class CryptoSpecialistAgent:
    """Handles crypto-specific signals if asset is crypto"""
    
    def __init__(self):
        self.name = "CryptoSpecialistAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Crypto Specialist Agent.

YOUR MISSION: Propose crypto-specific strategy components.

YOUR EXPERTISE:
- On-chain metrics
- Exchange flows
- Funding rates
- Hash rate trends
- Altcoin patterns

INSTRUCTION:
Propose crypto-specific rules (if applicable).
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
CRYPTO_SIGNALS: [On-chain signals to use]
EXCHANGE_FILTERS: [Exchange flow analysis]
ALTCOIN_RULES: [If multi-crypto strategy]
LIQUIDITY_CRYPTO: [24/7 market considerations]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "CRYPTO_SPECIALIZED"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique from crypto perspective. Be expert."""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "CRYPTO_CRITIQUE",
            "round": 2
        }


class StrategySimplifierAgent:
    """Reduces complexity and removes redundant rules"""
    
    def __init__(self):
        self.name = "StrategySimplifierAgent"
        self.model = get_debate_model()
        self.system_prompt = """You are the Strategy Simplifier Agent.

YOUR MISSION: Reduce strategy complexity and remove redundancy.

YOUR EXPERTISE:
- Eliminating redundant indicators
- Simplifying entry/exit logic
- Removing low-edge rules
- Optimization for execution

INSTRUCTION:
Propose simplified strategy version.
KEEP YOUR RESPONSE UNDER 150 WORDS.
Format as:
SIMPLIFICATIONS: [What to remove]
CORE_SIGNALS: [Essential rules only]
REMOVED_COMPLEXITY: [Why certain rules can go]
EDGE_RETENTION: [How simplicity keeps edge]"""
    
    def generate_argument(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate initial trading strategy proposal using live market data"""
        market_context = build_market_context_string(context)
        user_prompt = f"Design a trading strategy for: {topic}\n\n{market_context}"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "SIMPLICITY_FIRST"
        }
    
    def generate_rebuttal(self, topic: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        other_arguments = context.get('agent_arguments', {}) if context else {}
        rebuttal_prompt = f"""Evaluate: {str(other_arguments)[:500]}

Critique complexity. Ask: is this needed?"""
        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=rebuttal_prompt)]
        response = self.model.invoke(messages)
        return {
            "agent": self.name,
            "argument": response.content,
            "stance": "SIMPLICITY_CRITIQUE",
            "round": 2
        }


class ConsensusStrategyAgent:
    """Collects ideas from all agents and produces final strategy JSON"""
    
    def __init__(self):
        self.name = "ConsensusStrategyAgent"
        self.model = get_judge_model()
        self.system_prompt = """You are the Consensus Strategy Agent - the ARCHITECT of the final trading strategy.

YOUR ROLE: Synthesize all agent proposals into a cohesive, executable trading strategy.

RULES FOR SYNTHESIS:
1. Identify the 2-3 STRONGEST entry signals across all agents
2. Identify the 2-3 STRONGEST exit signals
3. Select ESSENTIAL filters and risk management rules only
4. Ensure logical consistency between components
5. Minimize redundancy
6. Prioritize high-edge, simple rules

OUTPUT FORMAT - YOU MUST RETURN VALID JSON:
{
  "entry_rules": ["Rule 1", "Rule 2", "Rule 3"],
  "exit_rules": ["Rule 1", "Rule 2"],
  "indicators": ["Indicator1", "Indicator2"],
  "filters": ["Filter1", "Filter2"],
  "risk_management": {
    "position_size": "X%",
    "stop_loss": "X%",
    "take_profit": "X%"
  },
  "notes": "Brief explanation of strategy logic"
}

CRITICAL: Return ONLY valid JSON, nothing else."""
    
    def synthesize_strategy(self, topic: str, debate: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize all agent arguments into final strategy"""
        
        debate_summary = f"Asset/Timeframe: {topic}\n\n"
        debate_summary += "=== AGENT PROPOSALS ===\n\n"
        
        for agent_name, agent_data in debate.items():
            debate_summary += f"--- {agent_name} ---\n"
            debate_summary += f"{agent_data.get('argument', '')}\n\n"
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=debate_summary + "\n\nSynthesize this into a final trading strategy JSON.")
        ]
        
        response = self.model.invoke(messages)
        
        # Try to extract JSON from response
        try:
            import json
            parsed = json.loads(response.content)
            return {
                "agent": self.name,
                "strategy": parsed,
                "success": True
            }
        except json.JSONDecodeError:
            # Try to extract JSON from response text
            try:
                start_idx = response.content.find('{')
                end_idx = response.content.rfind('}') + 1
                if start_idx >= 0 and end_idx > start_idx:
                    json_str = response.content[start_idx:end_idx]
                    parsed = json.loads(json_str)
                    return {
                        "agent": self.name,
                        "strategy": parsed,
                        "success": True
                    }
            except:
                pass
            
            # Fallback: return raw response
            return {
                "agent": self.name,
                "strategy": {"raw_response": response.content},
                "success": False
            }


# ============================================================================
# AGENT REGISTRY
# ============================================================================

def get_all_trading_agents() -> List:
    """Return list of all trading agents (excluding judge and consensus)"""
    return [
        TrendFollowingAgent(),
        MomentumAgent(),
        MeanReversionAgent(),
        BreakoutAgent(),
        VolumeAnalysisAgent(),
        VolatilityAgent(),
        PatternRecognitionAgent(),
        StatisticalSignalAgent(),
        MarketRegimeAgent(),
        LiquidityAgent(),
        RiskManagementAgent(),
        PortfolioAgent(),
        SentimentAgent(),
        MacroAgent(),
        CryptoSpecialistAgent(),
        StrategySimplifierAgent(),
    ]


def get_consensus_agent() -> ConsensusStrategyAgent:
    """Return the consensus strategy agent"""
    return ConsensusStrategyAgent()
