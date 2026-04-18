import numpy as np
import pandas as pd
from typing import Dict, Any

def run_monte_carlo(backtest_result: Dict[str, Any], n_simulations: int = 500) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation using backtest trades.
    Computes statistical percentiles including worst-case analysis.
    """
    trades = backtest_result.get("trades", [])
    
    empty_result = {
        "simulations": [],
        "return_distribution": {},
        "drawdown_distribution": {},
        "risk_score": 100.0,
        "confidence_level": "Low",
        "percentiles": {
            "return_p50": 0.0,
            "return_p90": 0.0,
            "return_p10": 0.0,
            "drawdown_p95": 0.0,
            "worst_case": 0.0
        }
    }

    if not trades or len(trades) < 2:
        return empty_result

    # Standardize trade returns to decimal percentage form
    trade_returns = []
    for t in trades:
        ret = t.get("pnl_percent", t.get("return", t.get("pnl_pct", t.get("pnl", 0.0))))
        if isinstance(ret, str):
            try:
                ret = float(ret.replace('%', ''))
            except:
                ret = 0.0
        elif isinstance(ret, (int, float)):
            ret = float(ret)
        else:
            ret = 0.0
            
        if abs(ret) > 2.0:
            ret = ret / 100.0
            
        trade_returns.append(ret)
    
    if all(r == 0 for r in trade_returns):
        return empty_result

    trade_returns_array = np.array(trade_returns)
    num_trades = len(trade_returns_array)
    
    simulations = []
    final_returns = []
    max_drawdowns = []
    
    # Support multiple formats of initial capital configuration
    initial_capital = float(backtest_result.get("initial_capital", backtest_result.get("metrics", {}).get("initial_capital", 100000)))

    for _ in range(n_simulations):
        # Bootstrap: resample trade returns with replacement
        simulated_returns = np.random.choice(trade_returns_array, size=num_trades, replace=True)
        
        # Calculate simulated equity curve
        equity_curve = initial_capital * np.cumprod(1 + simulated_returns)
        
        simulations.append(equity_curve.tolist())
        final_rtn = float((equity_curve[-1] - initial_capital) / initial_capital) * 100.0
        final_returns.append(final_rtn)
        
        # Calculate Max Drawdown for this simulation
        running_max = np.maximum.accumulate(equity_curve)
        running_max[running_max == 0] = 1.0  # safe division
        drawdowns = (running_max - equity_curve) / running_max
        max_drawdowns.append(float(drawdowns.max()) * 100.0)

    # Return distributions
    percentiles_list = [5, 25, 50, 75, 95]
    return_dist = {str(p): float(np.percentile(final_returns, p)) for p in percentiles_list}
    drawdown_dist = {str(p): float(np.percentile(max_drawdowns, p)) for p in percentiles_list}

    # Core required percentiles
    return_p50 = float(np.percentile(final_returns, 50))
    return_p90 = float(np.percentile(final_returns, 90))
    return_p10 = float(np.percentile(final_returns, 10))
    drawdown_p95 = float(np.percentile(max_drawdowns, 95))
    
    worst_case = min(return_p10, -drawdown_p95)

    # Convert validation output into decision-ready signals
    # risk_score integrates worst drawdown (p95) with likelihood of negative tail loss (p10).
    # Scaled broadly so that a 50%+ p95 max DD or substantial negative return generates near 100 risk.
    raw_risk = max(0.0, float(drawdown_p95) + abs(min(0.0, return_p10)) * 2)
    risk_score = float(max(0.0, min(100.0, raw_risk)))

    if return_p10 > 0.0 and drawdown_p95 < 20.0:
        confidence_level = "High"
    elif return_p50 > 0.0 and drawdown_p95 < 40.0:
        confidence_level = "Moderate"
    else:
        confidence_level = "Low"

    # Subset simulations for the frontend to render efficiently
    subset_sims = simulations[:100]

    return {
        "simulations": subset_sims,
        "return_distribution": return_dist,
        "drawdown_distribution": drawdown_dist,
        "risk_score": round(risk_score, 2),
        "confidence_level": confidence_level,
        "percentiles": {
            "return_p50": round(return_p50, 2),
            "return_p90": round(return_p90, 2),
            "return_p10": round(return_p10, 2),
            "drawdown_p95": round(drawdown_p95, 2),
            "worst_case": round(worst_case, 2)
        }
    }
