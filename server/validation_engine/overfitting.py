import math

def calculate_overfitting_score(
    train_performance: float, 
    test_performance: float, 
    strategy_rules: str,
    trade_count: int = 0,
    return_variance: float = 0.0
) -> dict:
    """
    Compute multi-factor overfitting score based on performance degradation,
    rule complexity, trade count reliability, and return stability across folds.
    """
    # Weights configuration
    wt_perf = 30.0
    wt_complex = 25.0
    wt_trade = 25.0
    wt_stab = 20.0

    # 1. Performance drop factor (Normalized 0.0 - 1.0)
    f_perf = 0.0
    if train_performance > 0:
        drop = max(0.0, train_performance - test_performance)
        f_perf = min(drop / train_performance, 1.0)
    elif test_performance < train_performance:
        f_perf = 1.0
        
    perf_drop_penalty = f_perf * wt_perf

    # 2. Complexity factor (Normalized 0.0 - 1.0, maxing at ~16 keywords)
    complex_keywords = ['and', 'or', 'if', '>', '<', '=', 'crossover', 'crossunder', 'sma', 'ema', 'rsi', 'macd', 'bb', 'stoch', 'atr']
    rules_lower = str(strategy_rules).lower()
    keyword_count = sum(rules_lower.count(kw) for kw in complex_keywords)
    f_complex = min(keyword_count / 16.0, 1.0)
    
    complexity_penalty = f_complex * wt_complex

    # 3. Trade reliability factor (Normalized 0.0 - 1.0, 0 trades = 1.0 penalty, 50+ trades = 0.0)
    if trade_count == 0:
        f_trade = 1.0
    else:
        f_trade = max(0.0, min(1.0, 1.0 - (trade_count / 50.0)))
        
    trade_reliability_penalty = f_trade * wt_trade
        
    # 4. Stability factor (Normalized 0.0 - 1.0 based on variance threshold approx 40)
    f_stab = min(abs(return_variance) / 40.0, 1.0)
    
    stability_penalty = f_stab * wt_stab

    score_raw = perf_drop_penalty + complexity_penalty + trade_reliability_penalty + stability_penalty
    overfit_score = float(min(100.0, max(0.0, score_raw)))
    
    if overfit_score < 30:
        level = "Low"
        explanation = "Strategy shows consistent results across testing periods with healthy trade frequency and minimal rule bloat."
    elif overfit_score < 60:
        level = "Moderate"
        explanation = "Some degradation in out-of-sample data or moderate rule complexity. Monitor live performance closely."
    else:
        level = "High"
        explanation = "Strategy exhibits significant performance drop, high variance across folds, or extreme curve fitting to historical data."

    return {
        "score": round(overfit_score, 2),
        "level": level,
        "factors": {
            "performance_drop": round(perf_drop_penalty, 2),
            "complexity": round(complexity_penalty, 2),
            "trade_reliability": round(trade_reliability_penalty, 2),
            "stability": round(stability_penalty, 2)
        },
        "explanation": explanation,
        # backward compatibility
        "overfit_score": round(overfit_score, 2),
        "interpretation": level
    }
