import logging
import traceback
from typing import Dict, Any, Callable
import pandas as pd
from .walk_forward import walk_forward_test
from .overfitting import calculate_overfitting_score
from .monte_carlo import run_monte_carlo
from .decision_engine import make_decision

logger = logging.getLogger(__name__)

def run_validation(
    strategy: str,
    backtest_result: Dict[str, Any],
    market_data: pd.DataFrame,
    backtest_func: Callable[[str, pd.DataFrame], Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Validation Pipeline:
    Coordinates rolling walk-forward, multi-factor overfitting, 
    and probabilistic Monte Carlo analysis.
    """
    try:
        if market_data is None or market_data.empty:
            raise ValueError("Market data is required for validation")

        # Extract base metrics safely
        metrics = backtest_result.get("metrics", {})
        trade_count = metrics.get("total_trades", len(backtest_result.get("trades", [])))
        if trade_count < 2:
            raise ValueError("Insufficient trades (< 2) for statistically meaningful validation")

        # 1. Walk-Forward Test (Rolling folds)
        try:
            wf_result = walk_forward_test(strategy, market_data, backtest_func)
        except Exception as e:
            logger.warning(f"Walk-forward test failed (insufficient data?): {e}")
            wf_result = {
                "folds": [],
                "num_folds": 0,
                "fold_consistency": 0.0,
                "avg_test_return": 0.0,
                "avg_train_return": float(metrics.get("total_return", 0.0) or 0.0),
                "avg_drawdown": 0.0,
                "variance": 0.0,
                "consistency_score": 0.0,
                "performance_stability": "Low",
                "error": str(e)
            }

        # 2. Overfitting Score (Multi-factor logic)
        train_return = wf_result.get("avg_train_return", 0.0)
        test_return = wf_result.get("avg_test_return", 0.0)
        return_variance = wf_result.get("variance", 0.0)

        overfit_result = calculate_overfitting_score(
            train_performance=train_return,
            test_performance=test_return,
            strategy_rules=strategy,
            trade_count=trade_count,
            return_variance=return_variance
        )

        # 3. Monte Carlo (Percentile-enabled stats)
        try:
            mc_result = run_monte_carlo(backtest_result, n_simulations=500)
        except Exception as e:
            logger.warning(f"Monte Carlo simulation failed: {e}")
            mc_result = {
                "simulations": [],
                "return_distribution": {},
                "drawdown_distribution": {},
                "risk_score": 100.0,
                "confidence_level": "Low",
                "percentiles": {},
                "error": str(e)
            }

        # 4. Decision Engine
        decision_result = make_decision(wf_result, overfit_result, mc_result)

        return {
            "walk_forward": wf_result,
            "overfitting": overfit_result,
            "monte_carlo": mc_result,
            "decision": decision_result,
            "error": None
        }

    except Exception as e:
        logger.error(f"Validation Pipeline Error: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "walk_forward": None,
            "overfitting": None,
            "monte_carlo": None,
            "decision": {
                "decision": "ERROR",
                "confidence": 0.0,
                "confidence_pct": 0,
                "risk_level": "Unknown",
                "summary": f"Validation pipeline failed: {str(e)}",
                "warnings": ["Pipeline execution error"],
                "deployable": False
            },
            "error": str(e)
        }
