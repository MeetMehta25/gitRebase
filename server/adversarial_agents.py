"""
adversarial_agents.py
─────────────────────
Four adversarial agents that stress-test trading strategies by finding loopholes
and suggesting modifications to make strategies more robust.

Each agent is a pure function that returns structured JSON with:
  - agent: agent name
  - loopholes_found: list of identified issues
  - modifications: suggested changes to backtest_payload
  - severity: high/medium/low
  - confidence: 0.0-1.0
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


def crisis_injection_agent(strategy: dict, backtest_result: dict, backtest_payload: dict) -> dict:
    """
    Simulates 2008/2020-style crash periods.
    Checks if strategy has no volatility filter.
    Suggests adding VIX guard, tightening stop-loss, reducing position size.
    """
    loopholes = []
    modifications = {
        "entry_conditions": [],
        "exit_conditions": [],
        "risk_management": {}
    }
    
    # Check for volatility filters
    indicators = backtest_payload.get("indicators", [])
    entry_conditions = backtest_payload.get("entry_conditions", [])
    exit_conditions = backtest_payload.get("exit_conditions", [])
    
    # Look for VIX or ATR-based volatility filters
    has_vix_filter = any(
        ind.get("name") == "VIX" or (isinstance(ind, dict) and "vix" in str(ind).lower())
        for ind in indicators
    )
    has_volatility_filter = any(
        "ATR" in str(cond).upper() or "volatility" in str(cond).lower()
        for cond in entry_conditions
    )
    
    if not has_vix_filter and not has_volatility_filter:
        loopholes.append("No volatility filter - strategy may trade recklessly during crashes")
        loopholes.append("No VIX-based guard condition to reduce exposure in high-volatility regimes")
        
        # Suggest adding VIX guard (simulation: use RSI as proxy for volatility)
        modifications["entry_conditions"].append({
            "indicator": "RSI",
            "operator": "between",
            "value": [20, 80],
            "note": "VIX proxy: avoid extreme conditions"
        })
    
    # Check stop-loss width
    current_stop_loss = float(backtest_payload.get("stop_loss_pct", 0.10))
    if current_stop_loss > 0.07:
        loopholes.append(f"Stop-loss too wide ({current_stop_loss*100}%) in high-VIX regimes - should be tighter")
        modifications["risk_management"]["stop_loss_pct"] = 0.05
    
    # Check position size
    current_pos_size = float(backtest_payload.get("position_size", 0.10))
    if current_pos_size > 0.10:
        loopholes.append(f"Position size too aggressive ({current_pos_size*100}%) for crash protection")
        modifications["risk_management"]["position_size"] = 0.05
    
    # Check win_rate and max_drawdown
    win_rate = float(backtest_result.get("win_rate", 0.5))
    max_dd = float(backtest_result.get("max_drawdown", 0.0))
    
    if max_dd < -0.30:  # More than 30% drawdown
        loopholes.append(f"High historical max drawdown ({max_dd*100:.1f}%) - likely to amplify in crashes")
    
    if win_rate > 0.70 and max_dd < -0.15:
        loopholes.append("High win rate + deep drawdown = curved fit to data; may break in crisis")
    
    # Determine severity
    severity = "high" if (not has_vix_filter or current_stop_loss > 0.10) else "medium"
    confidence = 0.85 if len(loopholes) >= 2 else 0.65
    
    return {
        "agent": "crisis_injection",
        "loopholes_found": loopholes,
        "modifications": modifications,
        "severity": severity,
        "confidence": confidence
    }


def liquidity_shock_agent(strategy: dict, backtest_result: dict, backtest_payload: dict) -> dict:
    """
    Checks if volume-based indicators (OBV, VWAP, MFI) are absent from entry conditions.
    Suggests adding MFI < 20 or volume < 20MA exit trigger to avoid illiquid exits.
    """
    loopholes = []
    modifications = {
        "entry_conditions": [],
        "exit_conditions": [],
        "risk_management": {}
    }
    
    indicators = backtest_payload.get("indicators", [])
    entry_conditions = backtest_payload.get("entry_conditions", [])
    exit_conditions = backtest_payload.get("exit_conditions", [])
    
    # Look for volume-based indicators
    indicator_names = [
        ind.get("name", ind) if isinstance(ind, dict) else ind
        for ind in indicators
    ]
    
    has_obv = any("OBV" in str(name).upper() for name in indicator_names)
    has_vwap = any("VWAP" in str(name).upper() for name in indicator_names)
    has_mfi = any("MFI" in str(name).upper() for name in indicator_names)
    has_volume = any("VOLUME" in str(name).upper() for name in indicator_names)
    
    has_volume_indicator = has_obv or has_vwap or has_mfi or has_volume
    
    if not has_volume_indicator:
        loopholes.append("No volume-based indicators in strategy - vulnerable to liquidity shocks")
        loopholes.append("Missing entry confirmation via OBV/VWAP/MFI - may enter on thin volume")
        
        # Suggest adding MFI to indicators
        modifications["entry_conditions"].append({
            "indicator": "MFI",
            "operator": ">",
            "value": 20,
            "note": "Ensure sufficient money flow for entry"
        })
        modifications["exit_conditions"].append({
            "indicator": "VOLUME",
            "operator": "<",
            "value": "SMA_20",
            "note": "Exit if volume dries up"
        })
    
    # Check exit conditions for volume trap risks
    has_volume_exit = any(
        "volume" in str(cond).lower() or "obv" in str(cond).lower()
        for cond in exit_conditions
    )
    
    if not has_volume_exit:
        loopholes.append("No volume check on exit conditions - may be trapped in illiquid positions")
        modifications["exit_conditions"].append({
            "indicator": "VOLUME",
            "operator": "<",
            "value": "SMA_20",
            "note": "Emergency exit if volume collapses"
        })
    
    # Check if strategy has high trade count but low average volume impact
    num_trades = int(backtest_result.get("total_trades", 0))
    avg_return = float(backtest_result.get("avg_return", 0.0))
    
    if num_trades > 100 and avg_return < 0.001:
        loopholes.append("High trade frequency with tiny returns - likely suffering from slippage")
        modifications["risk_management"]["min_trade_size"] = 0.02  # Increase min position
    
    severity = "high" if not has_volume_indicator else "medium"
    confidence = 0.80
    
    return {
        "agent": "liquidity_shock",
        "loopholes_found": loopholes,
        "modifications": modifications,
        "severity": severity,
        "confidence": confidence
    }


def crowding_risk_agent(strategy: dict, backtest_result: dict, backtest_payload: dict) -> dict:
    """
    Detects if strategy uses only popular indicators (RSI, MACD, EMA crossover).
    Flags "crowded signal" risk.
    Suggests adding contrarian filter like RSI divergence or Bollinger Band squeeze.
    """
    loopholes = []
    modifications = {
        "entry_conditions": [],
        "exit_conditions": [],
        "risk_management": {}
    }
    
    indicators = backtest_payload.get("indicators", [])
    entry_conditions = backtest_payload.get("entry_conditions", [])
    
    # Extract indicator names
    indicator_names = [
        ind.get("name", ind) if isinstance(ind, dict) else ind
        for ind in indicators
    ]
    indicator_str = " ".join(str(name).upper() for name in indicator_names)
    
    # Count popular indicators
    popular_count = sum([
        "RSI" in indicator_str,
        "MACD" in indicator_str,
        "EMA" in indicator_str,
        "SMA" in indicator_str,
    ])
    
    if popular_count >= 3:
        loopholes.append("Strategy uses only popular indicators (RSI, MACD, EMA) - high crowding risk")
        loopholes.append("Many traders use same signals → diluted alpha, worse fills at crowded levels")
        
        # Suggest adding contrarian/differentiator
        modifications["entry_conditions"].append({
            "indicator": "BOLLINGER_BAND",
            "operator": "squeeze",
            "value": "compression_ratio",
            "note": "Enter only on volatility compression breakouts (contrarian differentiator)"
        })
        modifications["entry_conditions"].append({
            "indicator": "RSI",
            "operator": "divergence",
            "value": "price",
            "note": "Add RSI divergence confirmation to differentiate from crowd"
        })
    
    # Check if indicator set has any non-standard indicators
    has_atr = "ATR" in indicator_str
    has_cci = "CCI" in indicator_str
    has_williams = "WILLIAMS" in indicator_str or "%R" in indicator_str
    has_obv = "OBV" in indicator_str
    
    has_differentiated = has_atr or has_cci or has_williams or has_obv
    
    if not has_differentiated and popular_count >= 3:
        loopholes.append("Missing differentiating indicators - pure RSI/MACD/EMA plays are crowded")
    
    # Check strategy goal and win rate
    strategy_goal = strategy.get("goal", "").lower()
    win_rate = float(backtest_result.get("win_rate", 0.5))
    
    if strategy_goal in ["momentum", "trend_following"] and win_rate > 0.65:
        loopholes.append(f"Very high win rate ({win_rate*100:.1f}%) on crowded momentum → likely overfitting")
        modifications["entry_conditions"].append({
            "note": "Reduce momentum sensitivity; add mean-reversion confirmation"
        })
    
    severity = "medium" if popular_count >= 3 else "low"
    confidence = 0.75
    
    return {
        "agent": "crowding_risk",
        "loopholes_found": loopholes,
        "modifications": modifications,
        "severity": severity,
        "confidence": confidence
    }


def adversarial_agent(strategy: dict, backtest_result: dict, backtest_payload: dict) -> dict:
    """
    General strategy auditor. Checks for overfitting signals, look-ahead bias risk, and curve-fitting.
    Suggests widening indicator periods and adding walk-forward validation note.
    """
    loopholes = []
    modifications = {
        "entry_conditions": [],
        "exit_conditions": [],
        "risk_management": {}
    }
    
    win_rate = float(backtest_result.get("win_rate", 0.5))
    total_trades = int(backtest_result.get("total_trades", 0))
    sharpe = float(backtest_result.get("sharpe_ratio", 0.0))
    max_dd = float(backtest_result.get("max_drawdown", 0.0))
    
    # Overfitting check: win_rate > 65% + low trades < 30
    if win_rate > 0.65 and total_trades < 30:
        loopholes.append(f"Overfitting signal: {win_rate*100:.1f}% win rate on only {total_trades} trades")
        loopholes.append("Likely curve-fit to historical data; will fail in live trading")
        # Suggest widening indicator periods
        modifications["entry_conditions"].append({
            "note": "Widen indicator periods (EMA20→50, RSI14→21) to reduce parameter fitting"
        })
    
    # Sharpe ratio too high (>2.0) suggests overfitting
    if sharpe > 2.0:
        loopholes.append(f"Implausibly high Sharpe ratio ({sharpe:.2f}) - likely overfitted to backtest data")
        modifications["entry_conditions"].append({
            "note": "Reduce strategy complexity; consider Monte Carlo resampling validation"
        })
    
    # Look-ahead bias check: if multiple entry conditions on same bar
    entry_conds = backtest_payload.get("entry_conditions", [])
    if len(entry_conds) > 5:
        loopholes.append(f"Complex entry logic ({len(entry_conds)} conditions) - may have look-ahead bias")
        loopholes.append("Simplify conditions to prevent accidental future-looking evaluations")
    
    # Drawdown to return ratio
    total_return = float(backtest_result.get("total_return", 0.0))
    if max_dd < -0.20 and total_return < 0.15:
        loopholes.append(f"Poor risk/return: {total_return*100:.1f}% return with {max_dd*100:.1f}% max drawdown")
        modifications["risk_management"]["stop_loss_pct"] = 0.08
        modifications["risk_management"]["take_profit_pct"] = 0.30
    
    # Check for indicator optimization (too many parameters)
    indicators = backtest_payload.get("indicators", [])
    indicator_count = len(indicators)
    
    if indicator_count > 8:
        loopholes.append(f"Too many indicators ({indicator_count}) - reduces robustness and increases overfitting")
        modifications["entry_conditions"].append({
            "note": "Select top 3-5 most predictive indicators only"
        })
    
    # Check commission impact
    commission = float(backtest_payload.get("commission_pct", 0.001))
    if total_trades > 50 and commission < 0.002:
        avg_profit_per_trade = total_return / total_trades if total_trades > 0 else 0
        if avg_profit_per_trade < 0.005:  # 0.5% average profit
            loopholes.append(f"High trade frequency ({total_trades}) with low profit per trade - sensitive to slippage")
            loopholes.append("Consider higher commission rates (0.001→0.002) in backtest for realism")
    
    # Severity based on multiple red flags
    red_flags = len(loopholes)
    if red_flags >= 3:
        severity = "high"
    elif red_flags >= 1:
        severity = "medium"
    else:
        severity = "low"
    
    confidence = 0.8 if red_flags >= 2 else 0.65
    
    return {
        "agent": "adversarial",
        "loopholes_found": loopholes,
        "modifications": modifications,
        "severity": severity,
        "confidence": confidence
    }


def run_adversarial_agents(agents_to_run: list, strategy: dict, backtest_result: dict, backtest_payload: dict) -> list:
    """
    Run selected adversarial agents and return all results.
    
    agents_to_run: list of agent names like ["crisis_injection", "liquidity_shock", ...]
    Returns: list of agent result dicts
    """
    agent_funcs = {
        "crisis_injection": crisis_injection_agent,
        "liquidity_shock": liquidity_shock_agent,
        "crowding_risk": crowding_risk_agent,
        "adversarial": adversarial_agent,
    }
    
    results = []
    for agent_name in agents_to_run:
        if agent_name not in agent_funcs:
            logger.warning(f"Unknown agent: {agent_name}")
            continue
        
        try:
            result = agent_funcs[agent_name](strategy, backtest_result, backtest_payload)
            results.append(result)
            logger.info(f"✓ Agent '{agent_name}' completed: {len(result.get('loopholes_found', []))} loopholes")
        except Exception as e:
            logger.error(f"✗ Agent '{agent_name}' failed: {e}", exc_info=True)
            results.append({
                "agent": agent_name,
                "error": str(e),
                "loopholes_found": [],
                "modifications": {},
                "severity": "unknown",
                "confidence": 0.0
            })
    
    return results


def merge_agent_modifications(agent_results: list) -> dict:
    """
    Merge all agent modifications with priority given to higher-severity agents.
    Higher severity agents' modifications override lower-severity ones.
    
    Returns: merged modifications dict ready to update backtest_payload
    """
    # Sort by severity: high > medium > low
    severity_order = {"high": 3, "medium": 2, "low": 1}
    
    sorted_results = sorted(
        agent_results,
        key=lambda x: severity_order.get(x.get("severity", "low"), 0),
        reverse=True
    )
    
    merged = {
        "entry_conditions": [],
        "exit_conditions": [],
        "risk_management": {}
    }
    
    for result in sorted_results:
        mods = result.get("modifications", {})
        
        # Add entry conditions (avoid duplicates)
        for entry_cond in mods.get("entry_conditions", []):
            if entry_cond not in merged["entry_conditions"]:
                merged["entry_conditions"].append(entry_cond)
        
        # Add exit conditions (avoid duplicates)
        for exit_cond in mods.get("exit_conditions", []):
            if exit_cond not in merged["exit_conditions"]:
                merged["exit_conditions"].append(exit_cond)
        
        # Merge risk_management (higher severity takes precedence)
        for key, val in mods.get("risk_management", {}).items():
            if key not in merged["risk_management"]:
                merged["risk_management"][key] = val
    
    return merged


def apply_modifications_to_payload(backtest_payload: dict, modifications: dict) -> dict:
    """
    Apply modifications to backtest_payload, producing a modified copy.
    """
    import copy
    modified = copy.deepcopy(backtest_payload)
    
    # Merge entry conditions
    if modifications.get("entry_conditions"):
        existing_entries = modified.get("entry_conditions", [])
        modified["entry_conditions"] = existing_entries + modifications["entry_conditions"]
    
    # Merge exit conditions
    if modifications.get("exit_conditions"):
        existing_exits = modified.get("exit_conditions", [])
        modified["exit_conditions"] = existing_exits + modifications["exit_conditions"]
    
    # Apply risk management updates
    if modifications.get("risk_management"):
        if "risk_management" not in modified:
            modified["risk_management"] = {}
        modified["risk_management"].update(modifications["risk_management"])
    
    # Also update top-level risk parameters if present
    for key in ["stop_loss_pct", "take_profit_pct", "position_size"]:
        if key in modifications.get("risk_management", {}):
            modified[key] = modifications["risk_management"][key]
    
    return modified
