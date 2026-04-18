import threading
import time
import logging
from datetime import datetime, timezone
import yfinance as yf
from typing import Dict, Any

logger = logging.getLogger(__name__)

def get_db():
    from config.database import get_db as get_mongo_db
    return get_mongo_db()

class LivePaperTradingEngine:
    """
    Background engine for evaluating active paper trading sessions.
    Runs continuously, fetches live data, evaluates strategy conditions using dsl_engine logic,
    and updates session PnL and trades.
    """
    def __init__(self, interval_seconds=60):
        self.running = False
        self.thread = None
        self.interval = interval_seconds
        
    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            logger.info("[PaperTradingEngine] Started live engine loop")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=self.interval)
            logger.info("[PaperTradingEngine] Stopped live engine loop")

    def _run_loop(self):
        while self.running:
            try:
                self._evaluate_active_sessions()
            except Exception as e:
                logger.error(f"[PaperTradingEngine] Sub-loop error: {e}")
            time.sleep(self.interval)

    def _evaluate_active_sessions(self):
        db = get_db()
        # Find all active sessions
        active_sessions = list(db["paper_trading_sessions"].find({"status": "active"}))
        for session in active_sessions:
            try:
                self._evaluate_single_session(db, session)
            except Exception as e:
                logger.error(f"[PaperTradingEngine] Failed to evaluate session {session.get('session_id')}: {e}")

    def _evaluate_single_session(self, db, session):
        """Scaffold for evaluating a single active session."""
        session_id = session["session_id"]
        ticker = session.get("ticker")
        if not ticker:
            return
            
        # 1. Fetch latest market data
        # In scaffolding, we just use a quick yfinance pull for the last price. 
        # For full implementation, route this through data_pipeline / live feeds.
        df = yf.download(ticker, period="1d", interval="1m", progress=False)
        if df.empty:
            return
            
        current_price = float(df['Close'].iloc[-1])
        
        # 2. Evaluate Strategy
        # Scaffolding: Insert logic calling the DSL parser against current data here
        # is_buy_signal = check_signals(session["payload"], df) ...
        # (Example mocked state below)
        
        positions = session.get("positions", [])
        capital = float(session.get("capital", 100000))
        initial_capital = float(session.get("initial_capital", 100000))
        
        current_value = capital
        
        # 3. Mark to Market positions
        for p in positions:
            pdl = (current_price - p["entry_price"]) * p["shares"] if p["type"] == "long" else (p["entry_price"] - current_price) * p["shares"]
            p["current_price"] = current_price
            p["unrealized_pnl"] = pdl
            current_value += (p["current_price"] * p["shares"])
            
        # 4. Save updated metrics to MongoDB
        pnl = current_value - initial_capital
        pnl_percent = (pnl / initial_capital) * 100 if initial_capital > 0 else 0
        
        db["paper_trading_sessions"].update_one(
            {"_id": session["_id"]},
            {
                "$set": {
                    "current_value": round(current_value, 2),
                    "positions": positions,
                    "pnl": round(pnl, 2),
                    "pnl_percent": round(pnl_percent, 2),
                    "last_evaluated": datetime.now(timezone.utc)
                }
            }
        )
        logger.debug(f"[PaperTradingEngine] Evaluated {session_id} - Current Value: {current_value}")

# Expose a singleton engine
paper_trading_engine = LivePaperTradingEngine(interval_seconds=60)
