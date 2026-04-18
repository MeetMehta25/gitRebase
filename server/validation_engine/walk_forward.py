import numpy as np
import pandas as pd
from typing import Dict, Any

def walk_forward_test(strategy_rules: str, market_data: pd.DataFrame, backtest_func) -> Dict[str, Any]:
    """
    Perform a rolling walk-forward test.
    Splits data into multiple train/test folds moving forward in time.
    """
    if market_data is None or market_data.empty:
        raise ValueError("Market data is empty")

    n_samples = len(market_data)
    # Ensure minimum 3 folds, target 4-6 folds based on data size
    if n_samples < 100:
        n_folds = 3
        train_pct = 0.5
    elif n_samples < 250:
        n_folds = 4
        train_pct = 0.5
    elif n_samples < 500:
        n_folds = 5
        train_pct = 0.5
    else:
        n_folds = 6
        train_pct = 0.5

    test_pct = (1.0 - train_pct) / n_folds
    train_size = int(n_samples * train_pct)
    test_size = int(n_samples * test_pct)

    folds = []
    test_returns = []
    test_drawdowns = []
    train_returns = []

    for i in range(n_folds):
        start_idx = int(i * test_size)
        train_end = start_idx + train_size
        test_end = train_end + test_size if i < n_folds - 1 else n_samples

        train_data = market_data.iloc[start_idx:train_end]
        test_data = market_data.iloc[train_end:test_end]

        if train_data.empty or test_data.empty:
            continue

        train_result = backtest_func(strategy_rules, train_data)
        test_result = backtest_func(strategy_rules, test_data)
        
        # Extract metrics safely handling either raw result or nested metrics dict
        train_metrics = train_result.get("metrics", {})
        test_metrics = test_result.get("metrics", {})
        
        t_ret = float(train_metrics.get("total_return", train_result.get("total_return", 0) or 0))
        te_ret = float(test_metrics.get("total_return", test_result.get("total_return", 0) or 0))
        te_dd = float(test_metrics.get("max_drawdown", test_result.get("max_drawdown", 0) or 0))

        train_returns.append(t_ret)
        test_returns.append(te_ret)
        test_drawdowns.append(te_dd)

        def get_date_str(df_slice):
            if isinstance(df_slice.index, pd.DatetimeIndex):
                return str(df_slice.index[0])
            elif 'date' in df_slice.columns:
                return str(df_slice['date'].iloc[0])
            return "N/A"

        def get_date_end_str(df_slice):
            if isinstance(df_slice.index, pd.DatetimeIndex):
                return str(df_slice.index[-1])
            elif 'date' in df_slice.columns:
                return str(df_slice['date'].iloc[-1])
            return "N/A"

        folds.append({
            "fold": i + 1,
            "train_start": get_date_str(train_data),
            "train_end": get_date_end_str(train_data),
            "test_start": get_date_str(test_data),
            "test_end": get_date_end_str(test_data),
            "train_return": t_ret,
            "test_return": te_ret,
            "test_drawdown": te_dd
        })

    if not folds:
        raise ValueError("Insufficient data or trades to create valid walk-forward folds")

    avg_test_return = float(np.mean(test_returns))
    avg_drawdown = float(np.mean(test_drawdowns))
    avg_train_return = float(np.mean(train_returns))
    
    # Variance of test returns
    variance = float(np.var(test_returns)) if len(test_returns) > 1 else 0.0
    stdev = float(np.std(test_returns)) if len(test_returns) > 1 else 0.0
    
    consistency_score = float(max(0, 100 - (stdev * 2)))

    if stdev < 5:
        stability = "High"
    elif stdev < 15:
        stability = "Medium"
    else:
        stability = "Low"
        
    performance_drop = max(0.0, avg_train_return - avg_test_return)

    # fold_consistency metric (0-100) based on return coefficient of variation
    mean_ret = abs(avg_test_return)
    cv = (stdev / mean_ret) if mean_ret > 0 else (stdev / 100.0)
    fold_consistency = float(max(0.0, min(100.0, 100.0 - cv * 33.3)))

    return {
        "folds": folds,
        "num_folds": len(folds),
        "fold_consistency": round(fold_consistency, 2),
        "avg_test_return": avg_test_return,
        "avg_train_return": avg_train_return,
        "avg_drawdown": avg_drawdown,
        "variance": variance,
        "consistency_score": consistency_score,
        "performance_stability": stability,
        # backward compatibility
        "train_metrics": {"total_return": avg_train_return},
        "test_metrics": {"total_return": avg_test_return},
        "performance_drop": performance_drop
    }
