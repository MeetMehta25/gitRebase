"""
backtest_engine/dsl_engine.py
──────────────────────────────
Complete backtest engine. Single entry point: run_dsl_backtest(dsl)

Pipeline:
  load_ohlcv → compute_indicators → generate_signals → simulate → metrics → quant_tests

Look-ahead prevention:
  ALL signals are shifted by 1 bar before the simulation loop.
  Signal on bar N close → execution on bar N+1 open.

Within each bar the strict order is:
  1. Check stop-loss trigger
  2. Check take-profit trigger
  3. Check exit signal
  4. Check entry signal
  5. Mark-to-market (equity = cash + holdings at close)

Quant tests included:
  Monte Carlo bootstrap, Walk-Forward, Kupiec VaR, Regime decomposition,
  Overfitting score, Benchmark comparison (buy & hold)
"""
import os
import uuid, time, math, warnings
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from scipy import stats as scipy_stats

from .indicator_engine import compute_indicators, indicator_debug_stats

TRADING_DAYS  = 252
RISK_FREE_ANN = 0.05   # 5% annual risk-free rate


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def run_dsl_backtest(dsl: dict, result_id: str | None = None) -> dict:
    """
    Full backtest pipeline from DSL → rich JSON result.
    DSL shape matches parser output exactly.
    """
    t0        = time.time()
    result_id = result_id or str(uuid.uuid4())

    # ── Extract config ─────────────────────────────────────────────────────────
    ticker    = dsl.get("ticker", "").upper().strip()
    capital   = float(dsl.get("initial_capital",  100_000))
    comm      = float(dsl.get("commission_pct",    0.001))
    slip      = float(dsl.get("slippage_pct",      0.0005))
    stop_pct  = dsl.get("stop_loss_pct")
    tp_pct    = dsl.get("take_profit_pct")
    trail_pct = dsl.get("trailing_stop_pct")
    raw_size  = float(dsl.get("position_size",     0.10))
    pos_size  = min(raw_size, 0.95)   # cap at 95% so we always keep cash buffer
    start     = dsl.get("start_date")
    end       = dsl.get("end_date")
    max_pos   = int(dsl.get("max_positions", 1))

    entry_conds = dsl.get("entry_conditions", [])
    exit_conds  = dsl.get("exit_conditions",  [])
    ind_list    = dsl.get("indicators", [])

    if not ticker:
        return _err(result_id, "DSL missing 'ticker'")
    if not entry_conds:
        return _err(result_id, "DSL missing 'entry_conditions'")
    if not exit_conds:
        return _err(result_id, "DSL missing 'exit_conditions'")

    # ── 1. Load OHLCV ─────────────────────────────────────────────────────────
    df = _load_ohlcv(ticker, start, end)
    if df is None or len(df) < 50:
        n = len(df) if df is not None else 0
        return _err(result_id, f"Not enough data for '{ticker}' ({n} bars, need ≥50). "
                               "Run POST /api/data/fetch first.")

    # ── 2. Compute indicators ─────────────────────────────────────────────────
    try:
        df = compute_indicators(df, ind_list)
    except Exception as e:
        return _err(result_id, f"Indicator computation failed: {e}")

    ind_debug = indicator_debug_stats(df, ind_list)

    # ── 3. Generate signals (shift 1 bar — look-ahead prevention) ─────────────
    entry_raw = _eval_conditions(df, entry_conds)
    exit_raw  = _eval_conditions(df, exit_conds)

    df["entry_signal"] = entry_raw.shift(1).fillna(False)
    df["exit_signal"]  = exit_raw.shift(1).fillna(False)

    n_entry_raw = int(entry_raw.sum())
    n_exit_raw  = int(exit_raw.sum())

    if n_entry_raw == 0:
        return _err(result_id,
            f"Entry conditions NEVER triggered on {ticker} data. "
            f"Check indicator values — RSI may not have crossed your threshold. "
            f"Use POST /api/backtest/indicators/preview to inspect values.")

    # ── 4. Simulate ───────────────────────────────────────────────────────────
    trades, equity_curve = _simulate(
        df, capital, pos_size, comm, slip, stop_pct, tp_pct, trail_pct, max_pos
    )

    if not equity_curve:
        return _err(result_id, "Simulation produced no equity curve — data issue")

    # ── 5. Metrics ────────────────────────────────────────────────────────────
    metrics = _compute_metrics(trades, equity_curve, capital)

    # ── 6. Buy & hold benchmark ───────────────────────────────────────────────
    benchmark = _compute_benchmark(df, capital)

    # ── 7. Quant tests ────────────────────────────────────────────────────────
    quant = {}
    try:    quant["monte_carlo"]  = _monte_carlo(trades, equity_curve, capital)
    except Exception as e: quant["monte_carlo"]  = {"error": str(e)}

    try:    quant["walk_forward"] = _walk_forward(df, dsl, capital, comm, slip, stop_pct, tp_pct, trail_pct, max_pos, pos_size)
    except Exception as e: quant["walk_forward"] = {"error": str(e)}

    try:    quant["kupiec"]       = _kupiec_test(equity_curve)
    except Exception as e: quant["kupiec"]       = {"error": str(e)}

    try:    quant["regime"]       = _regime_analysis(df, trades)
    except Exception as e: quant["regime"]       = {"error": str(e)}

    try:    quant["overfitting"]  = _overfitting_score(len(entry_conds) + len(exit_conds), len(trades), len(df), metrics.get("sharpe_ratio", 0))
    except Exception as e: quant["overfitting"]  = {"error": str(e)}

    elapsed = round(time.time() - t0, 3)

    return {
        "success":   True,
        "result_id": result_id,
        "ticker":    ticker,
        "status":    "success",

        "summary": {
            "bars_tested":     len(df),
            "entry_signals_raw":  n_entry_raw,
            "exit_signals_raw":   n_exit_raw,
            "total_trades":       len(trades),
            "indicators_used":    [f"{i.get('name','?')}_{i.get('period','')}".strip("_") for i in ind_list],
            "date_range": {
                "start": _fmtd(df["date"].iloc[0])  if "date" in df.columns else "",
                "end":   _fmtd(df["date"].iloc[-1]) if "date" in df.columns else "",
            },
            "config": {
                "initial_capital": capital,
                "position_size":   pos_size,
                "commission_pct":  comm,
                "slippage_pct":    slip,
                "stop_loss_pct":   stop_pct,
                "take_profit_pct": tp_pct,
            },
        },

        "metrics":         metrics,
        "benchmark":       benchmark,
        "equity_curve":    _trim_curve(equity_curve, 500),
        "trades":          trades,
        "quant_tests":     quant,
        "indicator_debug": ind_debug,
        "run_duration_seconds": elapsed,
    }


# ══════════════════════════════════════════════════════════════════════════════
# SIMULATION LOOP
# ══════════════════════════════════════════════════════════════════════════════

def _simulate(df, capital, pos_size, comm, slip, stop_pct, tp_pct, trail_pct, max_pos):
    """
    Bar-by-bar event-driven simulation.
    Returns (trades_list, equity_curve_list).

    Execution price logic:
      Entry:  bar.open × (1 + slip)  → pays the ask
      Exit:   bar.open × (1 - slip)  → receives the bid
      Stop:   min(bar.open, stop_price) to simulate gap-down risk
    """
    cash        = capital
    peak_equity = capital
    open_pos    = []   # list of active position dicts
    closed      = []   # list of completed trade dicts
    equity_curve= []
    trade_id    = 0

    close_col = "close"
    open_col  = "open"

    for i in range(len(df)):
        row        = df.iloc[i]
        bar_open   = float(row.get(open_col,  row[close_col]))
        bar_close  = float(row[close_col])
        bar_high   = float(row.get("high",  bar_close))
        bar_low    = float(row.get("low",   bar_close))
        bar_date   = row.get("date", df.index[i])

        to_close = []

        for pos in open_pos:
            reason = None
            exec_p = bar_open   # default execution price

            # Stop-loss — check if low breached stop during the bar
            if pos.get("stop_price"):
                if bar_low <= pos["stop_price"]:
                    reason = "stop_loss"
                    exec_p = min(bar_open, pos["stop_price"])   # gap fills at open

            # Take-profit — check if high breached target
            if not reason and pos.get("target_price"):
                if bar_high >= pos["target_price"]:
                    reason = "take_profit"
                    exec_p = max(bar_open, pos["target_price"])

            # Trailing stop update
            if not reason and pos.get("trail_pct"):
                if bar_close > pos.get("trail_peak", pos["entry_price"]):
                    pos["trail_peak"]  = bar_close
                    pos["trail_stop"]  = bar_close * (1 - pos["trail_pct"])
                if pos.get("trail_stop") and bar_low <= pos["trail_stop"]:
                    reason = "trailing_stop"
                    exec_p = min(bar_open, pos["trail_stop"])

            if reason:
                to_close.append((pos, reason, exec_p))

        # Exit signal
        if row.get("exit_signal", False):
            for pos in open_pos:
                already = any(p is pos for p, _, _ in to_close)
                if not already:
                    to_close.append((pos, "signal", bar_open))

        # Close positions
        for pos, reason, exec_p in to_close:
            if pos not in open_pos:
                continue
            fill      = exec_p * (1 - slip)
            proceeds  = pos["shares"] * fill
            comm_paid = proceeds * comm
            net_proc  = proceeds - comm_paid
            pnl       = net_proc - pos["cost_basis"]
            pnl_pct   = pnl / pos["cost_basis"] * 100 if pos["cost_basis"] > 0 else 0

            cash += net_proc

            h_days = 0
            try:
                h_days = (pd.Timestamp(bar_date) - pd.Timestamp(pos["entry_date"])).days
            except Exception:
                pass

            closed.append({
                "trade_id":    pos["trade_id"],
                "entry_date":  _fmtd(pos["entry_date"]),
                "exit_date":   _fmtd(bar_date),
                "entry_price": round(pos["entry_price"], 4),
                "exit_price":  round(fill, 4),
                "shares":      round(pos["shares"], 4),
                "pnl":         round(pnl, 2),
                "pnl_pct":     round(pnl_pct, 4),
                "holding_days":h_days,
                "exit_reason": reason,
                "commission":  round(comm_paid + pos["entry_comm"], 4),
            })
            open_pos.remove(pos)

        # Entry signal
        if row.get("entry_signal", False) and len(open_pos) < max_pos:
            alloc      = cash * pos_size
            fill       = bar_open * (1 + slip)   # pays ask
            comm_paid  = alloc * comm
            net_alloc  = alloc - comm_paid

            if net_alloc > 1.0 and fill > 0:
                shares = net_alloc / fill
                cash  -= alloc
                trade_id += 1

                pos_dict = {
                    "trade_id":    trade_id,
                    "entry_price": fill,
                    "entry_date":  bar_date,
                    "shares":      shares,
                    "cost_basis":  net_alloc,
                    "entry_comm":  comm_paid,
                    "stop_price":  fill * (1 - stop_pct)  if stop_pct  else None,
                    "target_price":fill * (1 + tp_pct)    if tp_pct    else None,
                    "trail_pct":   trail_pct,
                    "trail_peak":  fill,
                    "trail_stop":  fill * (1 - trail_pct) if trail_pct else None,
                }
                open_pos.append(pos_dict)

        # Mark-to-market
        holdings_val  = sum(p["shares"] * bar_close for p in open_pos)
        equity        = cash + holdings_val
        peak_equity   = max(peak_equity, equity)
        drawdown      = (peak_equity - equity) / peak_equity if peak_equity > 0 else 0

        equity_curve.append({
            "date":           _fmtd(bar_date),
            "equity":         round(equity, 2),
            "cash":           round(cash, 2),
            "holdings_value": round(holdings_val, 2),
            "drawdown":       round(drawdown, 6),
            "open_positions": len(open_pos),
        })

    # Force-close remaining positions at last bar's close
    if open_pos:
        last     = df.iloc[-1]
        lclose   = float(last[close_col])
        ldate    = last.get("date", df.index[-1])
        for pos in open_pos:
            fill      = lclose * (1 - slip)
            proceeds  = pos["shares"] * fill
            comm_paid = proceeds * comm
            net_proc  = proceeds - comm_paid
            pnl       = net_proc - pos["cost_basis"]
            closed.append({
                "trade_id":    pos["trade_id"],
                "entry_date":  _fmtd(pos["entry_date"]),
                "exit_date":   _fmtd(ldate),
                "entry_price": round(pos["entry_price"], 4),
                "exit_price":  round(fill, 4),
                "shares":      round(pos["shares"], 4),
                "pnl":         round(pnl, 2),
                "pnl_pct":     round(pnl / pos["cost_basis"] * 100 if pos["cost_basis"] > 0 else 0, 4),
                "holding_days":0,
                "exit_reason": "end_of_data",
                "commission":  round(comm_paid + pos["entry_comm"], 4),
            })

    return closed, equity_curve


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL EVALUATION
# ══════════════════════════════════════════════════════════════════════════════

def _eval_conditions(df: pd.DataFrame, conditions: list) -> pd.Series:
    """
    Evaluates all conditions with AND logic.
    Condition: {"indicator": "RSI", "operator": "<", "value": 30}
    value can be a number OR another indicator column name.
    """
    if not conditions:
        return pd.Series(False, index=df.index)

    combined = pd.Series(True, index=df.index)

    for cond in conditions:
        # Skip conditions that don't have an indicator (e.g., rule_text placeholders)
        if "rule_text" in cond and "indicator" not in cond:
            warnings.warn(f"[signal] Skipping non-structured condition: {cond.get('rule_text', '?')}")
            continue
        
        ind  = cond.get("indicator", "")
        op   = cond.get("operator", "")
        val  = cond.get("value")

        left = _resolve(df, ind)
        if left is None:
            warnings.warn(f"[signal] Column '{ind}' not found in DataFrame")
            combined &= False
            continue

        # Right side: number or another column
        if isinstance(val, str):
            right = _resolve(df, val)
            if right is None:
                combined &= False
                continue
        else:
            right = pd.Series(float(val), index=df.index)

        # Apply operator
        if   op == "<":                combined &= left <  right
        elif op == ">":                combined &= left >  right
        elif op == "<=":               combined &= left <= right
        elif op == ">=":               combined &= left >= right
        elif op == "==":               combined &= left == right
        elif op in ("crosses_above",): combined &= (left.shift(1) <= right.shift(1)) & (left > right)
        elif op in ("crosses_below",): combined &= (left.shift(1) >= right.shift(1)) & (left < right)
        else:
            warnings.warn(f"[signal] Unknown operator '{op}'")
            combined &= False

    return combined.fillna(False)


def _resolve(df: pd.DataFrame, name: str):
    """Case-insensitive column lookup → pd.Series or None."""
    col_map = {c.upper(): c for c in df.columns}
    key = name.upper()
    if key in col_map:
        return df[col_map[key]].astype(float)
    return None


# ══════════════════════════════════════════════════════════════════════════════
# METRICS
# ══════════════════════════════════════════════════════════════════════════════

def _compute_metrics(trades: list, equity_curve: list, initial: float) -> dict:
    eq   = np.array([p["equity"]   for p in equity_curve])
    dds  = np.array([p["drawdown"] for p in equity_curve])
    final= eq[-1]
    n    = len(eq)
    yrs  = n / TRADING_DAYS

    daily_ret = pd.Series(eq).pct_change().dropna()
    daily_rf  = RISK_FREE_ANN / TRADING_DAYS

    # Returns
    total_ret = (final - initial) / initial
    cagr      = (final / initial) ** (1 / max(yrs, 0.01)) - 1
    ann_vol   = daily_ret.std() * np.sqrt(TRADING_DAYS)

    # Sharpe
    excess  = daily_ret - daily_rf
    sharpe  = (excess.mean() / excess.std() * np.sqrt(TRADING_DAYS)) if excess.std() > 1e-10 else 0.0

    # Sortino
    neg_ret  = daily_ret[daily_ret < daily_rf]
    down_vol = neg_ret.std() * np.sqrt(TRADING_DAYS) if len(neg_ret) > 1 else 1e-10
    sortino  = (cagr - RISK_FREE_ANN) / down_vol

    # Calmar
    max_dd  = float(dds.max())
    calmar  = cagr / max_dd if max_dd > 1e-10 else 0.0

    # Omega ratio
    gains  = daily_ret[daily_ret > daily_rf] - daily_rf
    losses = daily_rf - daily_ret[daily_ret <= daily_rf]
    omega  = min(gains.sum() / losses.sum(), 999.0) if losses.sum() > 1e-10 else 999.0

    # Drawdown duration
    peak_i, max_dur, cur_dur = 0, 0, 0
    for j, v in enumerate(eq):
        if v >= eq[peak_i]:
            peak_i = j
            max_dur = max(max_dur, cur_dur)
            cur_dur = 0
        else:
            cur_dur += 1
    max_dd_dur = max(max_dur, cur_dur)

    # Trade stats
    pnls     = [t["pnl"]     for t in trades]
    pnl_pcts = [t["pnl_pct"] for t in trades]
    holds    = [t["holding_days"] for t in trades if t.get("holding_days")]
    wins     = [p for p in pnls if p > 0]
    losses_  = [p for p in pnls if p <= 0]
    comms    = sum(t.get("commission", 0) for t in trades)

    n_trades = len(trades)
    win_rate = len(wins) / n_trades if n_trades > 0 else 0
    avg_win  = float(np.mean([p for p in pnl_pcts if p > 0])) if any(p>0 for p in pnl_pcts) else 0
    avg_loss = float(np.mean([p for p in pnl_pcts if p <= 0])) if any(p<=0 for p in pnl_pcts) else 0

    gross_p  = sum(wins)
    gross_l  = abs(sum(losses_))
    pf       = min(gross_p / gross_l, 999.0) if gross_l > 1e-10 else 999.0

    # Expectancy = (win_rate × avg_win) + ((1−win_rate) × avg_loss)
    expectancy = (win_rate * avg_win) + ((1 - win_rate) * avg_loss)

    return {
        "returns": {
            "total_return_pct":       round(total_ret * 100, 2),
            "cagr_pct":               round(cagr * 100, 2),
            "annualised_volatility_pct": round(ann_vol * 100, 2),
        },
        "risk_adjusted": {
            "sharpe_ratio":  round(sharpe, 3),
            "sortino_ratio": round(sortino, 3),
            "calmar_ratio":  round(calmar, 3),
            "omega_ratio":   round(omega, 3),
        },
        "drawdown": {
            "max_drawdown_pct":       round(max_dd * 100, 2),
            "avg_drawdown_pct":       round(float(dds[dds>0].mean()) * 100, 2) if (dds>0).any() else 0,
            "max_dd_duration_days":   max_dd_dur,
            "current_drawdown_pct":   round(float(dds[-1]) * 100, 2),
        },
        "trade_stats": {
            "total_trades":     n_trades,
            "winning_trades":   len(wins),
            "losing_trades":    len(losses_),
            "win_rate_pct":     round(win_rate * 100, 2),
            "avg_win_pct":      round(avg_win, 4),
            "avg_loss_pct":     round(avg_loss, 4),
            "profit_factor":    round(pf, 3),
            "expectancy_pct":   round(expectancy, 4),
            "avg_holding_days": round(float(np.mean(holds)), 1) if holds else 0,
            "best_trade_pct":   round(max(pnl_pcts), 4) if pnl_pcts else 0,
            "worst_trade_pct":  round(min(pnl_pcts), 4) if pnl_pcts else 0,
        },
        "capital": {
            "initial_capital": round(initial, 2),
            "final_equity":    round(final, 2),
            "total_pnl":       round(final - initial, 2),
            "total_fees_paid": round(comms, 2),
        },
        # Flat aliases for easy frontend access
        "sharpe_ratio":       round(sharpe, 3),
        "max_drawdown_pct":   round(max_dd * 100, 2),
        "total_return_pct":   round(total_ret * 100, 2),
        "win_rate_pct":       round(win_rate * 100, 2),
    }


def _compute_benchmark(df: pd.DataFrame, capital: float) -> dict:
    """Buy-and-hold benchmark on the same ticker."""
    try:
        close_col = "close"
        prices    = df[close_col].dropna()
        if len(prices) < 2:
            return {}
        ret       = (prices.iloc[-1] - prices.iloc[0]) / prices.iloc[0]
        yrs       = len(prices) / TRADING_DAYS
        cagr      = (1 + ret) ** (1 / max(yrs, 0.01)) - 1
        dr        = prices.pct_change().dropna()
        sharpe    = (dr.mean() - RISK_FREE_ANN/TRADING_DAYS) / dr.std() * np.sqrt(TRADING_DAYS) if dr.std() > 1e-10 else 0
        peak      = prices.cummax()
        dd        = ((peak - prices) / peak).max()
        return {
            "total_return_pct": round(ret * 100, 2),
            "cagr_pct":         round(cagr * 100, 2),
            "sharpe_ratio":     round(sharpe, 3),
            "max_drawdown_pct": round(dd * 100, 2),
            "final_value":      round(capital * (1 + ret), 2),
        }
    except Exception:
        return {}


# ══════════════════════════════════════════════════════════════════════════════
# QUANT TESTS
# ══════════════════════════════════════════════════════════════════════════════

def _monte_carlo(trades: list, equity_curve: list, capital: float, n: int = 1000) -> dict:
    """
    Bootstrap resample trade P&L sequence n times.
    Shows distribution of outcomes across alternative trade orderings.
    """
    if len(trades) < 5:
        return {"error": "Need ≥5 trades for Monte Carlo"}

    pnl_pcts = np.array([t["pnl_pct"] / 100 for t in trades])

    sharpes, finals, max_dds = [], [], []
    rf_daily = RISK_FREE_ANN / TRADING_DAYS

    for _ in range(n):
        sampled = np.random.choice(pnl_pcts, size=len(pnl_pcts), replace=True)
        eq      = capital * np.cumprod(1 + sampled)
        eq      = np.insert(eq, 0, capital)
        dr      = np.diff(eq) / eq[:-1]
        sr      = (np.mean(dr) - rf_daily) / (np.std(dr) + 1e-10) * np.sqrt(TRADING_DAYS)

        peak    = np.maximum.accumulate(eq)
        dd      = ((peak - eq) / peak).max()

        sharpes.append(sr)
        finals.append(eq[-1])
        max_dds.append(dd)

    sharpes_a = np.array(sharpes)
    finals_a  = np.array(finals)
    dds_a     = np.array(max_dds)
    pcts      = [5, 25, 50, 75, 95]

    return {
        "n_simulations": n,
        "sharpe_distribution": {
            f"p{p}": round(float(np.percentile(sharpes_a, p)), 3) for p in pcts
        },
        "final_equity_distribution": {
            f"p{p}": round(float(np.percentile(finals_a, p)), 2) for p in pcts
        },
        "max_drawdown_distribution": {
            f"p{p}": round(float(np.percentile(dds_a, p)) * 100, 2) for p in pcts
        },
        "probability_of_profit":    round(float((finals_a > capital).mean()), 3),
        "probability_sharpe_gt_1":  round(float((sharpes_a > 1.0).mean()), 3),
        "probability_sharpe_gt_0":  round(float((sharpes_a > 0.0).mean()), 3),
        "expected_final_equity":    round(float(finals_a.mean()), 2),
    }


def _walk_forward(df, dsl, capital, comm, slip, stop_pct, tp_pct, trail_pct, max_pos, pos_size, n_windows=5, train_pct=0.70) -> dict:
    """
    Rolling walk-forward: split data into windows, measure out-of-sample Sharpe.
    Tests whether strategy generalises beyond the training period.
    """
    n = len(df)
    if n < 100:
        return {"error": "Need ≥100 bars for walk-forward"}

    step    = n // n_windows
    windows = []

    for i in range(n_windows):
        train_end  = step * (i + 1)
        test_start = train_end
        test_end   = min(test_start + step, n)
        if test_end <= test_start:
            continue

        test_df = df.iloc[test_start:test_end].copy()
        if len(test_df) < 20:
            continue

        # Re-generate signals on test window
        try:
            test_df = compute_indicators(test_df, dsl.get("indicators", []))
            entry_s = _eval_conditions(test_df, dsl.get("entry_conditions", [])).shift(1).fillna(False)
            exit_s  = _eval_conditions(test_df, dsl.get("exit_conditions", [])).shift(1).fillna(False)
            test_df["entry_signal"] = entry_s
            test_df["exit_signal"]  = exit_s

            trades_w, curve_w = _simulate(test_df, capital, pos_size, comm, slip, stop_pct, tp_pct, trail_pct, max_pos)
            m = _compute_metrics(trades_w, curve_w, capital)

            windows.append({
                "window":         i + 1,
                "test_bars":      len(test_df),
                "test_start":     _fmtd(test_df["date"].iloc[0])  if "date" in test_df.columns else str(test_start),
                "test_end":       _fmtd(test_df["date"].iloc[-1]) if "date" in test_df.columns else str(test_end),
                "sharpe":         m["sharpe_ratio"],
                "total_return_pct": m["total_return_pct"],
                "max_drawdown_pct": m["max_drawdown_pct"],
                "n_trades":       m["trade_stats"]["total_trades"],
                "win_rate_pct":   m["trade_stats"]["win_rate_pct"],
            })
        except Exception as e:
            windows.append({"window": i+1, "error": str(e)})

    valid    = [w for w in windows if "sharpe" in w]
    sharpes  = [w["sharpe"] for w in valid]

    if not sharpes:
        return {"windows": windows, "error": "No valid windows"}

    consistency = sum(1 for s in sharpes if s > 0) / len(sharpes)

    return {
        "n_windows":       len(valid),
        "train_pct":       train_pct,
        "windows":         windows,
        "sharpe_mean":     round(float(np.mean(sharpes)), 3),
        "sharpe_std":      round(float(np.std(sharpes)),  3),
        "sharpe_min":      round(float(np.min(sharpes)),  3),
        "sharpe_max":      round(float(np.max(sharpes)),  3),
        "consistency_pct": round(consistency * 100, 1),
        "degradation_flag": float(np.mean(sharpes)) < 0.3,
        "verdict":         (
            "Strategy is CONSISTENT out-of-sample" if consistency >= 0.6
            else "Strategy DEGRADES out-of-sample — possible overfitting"
        ),
    }


def _kupiec_test(equity_curve: list, confidence: float = 0.95) -> dict:
    """
    Kupiec Proportion of Failures (POF) test.
    Tests whether the number of VaR breaches is statistically expected.
    H0: VaR model is correctly specified.
    p-value > 0.05 → PASS (cannot reject correct specification).
    """
    returns = pd.Series([p["equity"] for p in equity_curve]).pct_change().dropna().values
    n       = len(returns)
    alpha   = 1 - confidence
    var_est = -np.percentile(returns, alpha * 100)

    failures     = int(np.sum(returns < -var_est))
    fail_rate    = failures / n if n > 0 else 0
    expected     = n * alpha

    # LR statistic (chi-squared 1 df)
    if failures in (0, n):
        lr_stat = 0.0
        p_value = 1.0
    else:
        lr_stat = float(-2 * (
            np.log(alpha**failures * (1-alpha)**(n-failures))
            - np.log(fail_rate**failures * (1-fail_rate)**(n-failures))
        ))
        p_value = float(1 - scipy_stats.chi2.cdf(lr_stat, df=1))

    return {
        "test":             "Kupiec POF",
        "confidence_level": confidence,
        "var_estimate_pct": round(var_est * 100, 3),
        "n_observations":   n,
        "n_failures":       failures,
        "expected_failures":round(expected, 1),
        "failure_rate_pct": round(fail_rate * 100, 3),
        "lr_statistic":     round(lr_stat, 4),
        "p_value":          round(p_value, 4),
        "verdict":          "PASS" if p_value > 0.05 else "FAIL",
        "interpretation":   (
            f"VaR model is correctly specified at {int(confidence*100)}% confidence"
            if p_value > 0.05 else
            "VaR model is MISSPECIFIED — too many/few tail breaches"
        ),
    }


def _regime_analysis(df: pd.DataFrame, trades: list) -> dict:
    """
    Classify each bar into a market regime and compute per-regime trade stats.
    Regimes: bull_trending, bear_trending, high_vol, low_vol, sideways.
    """
    if len(df) < 60:
        return {"error": "Need ≥60 bars for regime analysis"}

    close = df["close"] if "close" in df.columns else df[df.columns[0]]
    ret   = close.pct_change()
    vol20 = ret.rolling(20).std() * np.sqrt(252)
    vol_med = vol20.median()
    sma50   = close.rolling(50).mean()
    sma200  = close.rolling(200, min_periods=50).mean()

    regime = pd.Series("sideways", index=df.index)
    up     = close > sma50
    down   = close < sma50
    hv     = vol20 > vol_med

    regime[up   & ~hv] = "bull_trending"
    regime[down & ~hv] = "bear_trending"
    regime[up   &  hv] = "bull_volatile"
    regime[down &  hv] = "bear_volatile"

    # Build date → regime map
    if "date" in df.columns:
        date_regime = dict(zip(df["date"].astype(str).str[:10], regime.values))
    else:
        date_regime = {}

    # Tag each trade
    regime_trades: dict = {}
    for t in trades:
        r = date_regime.get(t.get("entry_date", ""), "unknown")
        if r not in regime_trades:
            regime_trades[r] = []
        regime_trades[r].append(t)

    result = {}
    for r, rts in regime_trades.items():
        pnls = [t["pnl_pct"] for t in rts]
        wins = [p for p in pnls if p > 0]
        result[r] = {
            "n_trades":      len(rts),
            "win_rate_pct":  round(len(wins)/len(pnls)*100, 1) if pnls else 0,
            "avg_return_pct":round(float(np.mean(pnls)), 4)    if pnls else 0,
            "total_pnl":     round(sum(t["pnl"] for t in rts), 2),
            "pct_of_bars":   round(float((regime == r).mean()) * 100, 1),
        }

    # Overall regime distribution
    dist = {r: round(float((regime == r).mean()) * 100, 1)
            for r in ["bull_trending","bear_trending","bull_volatile","bear_volatile","sideways"]}

    return {
        "regime_stats":       result,
        "bar_distribution":   dist,
        "current_regime":     str(regime.iloc[-1]),
        "dominant_regime":    str(regime.mode().iloc[0]) if len(regime) > 0 else "unknown",
    }


def _overfitting_score(n_rules: int, n_trades: int, n_bars: int, sharpe: float) -> dict:
    """
    Overfitting probability estimate.
    More rules + fewer trades = higher risk.
    Uses rule-to-data ratio + Deflated Sharpe haircut.
    """
    # Haircut Sharpe (simplified Bailey & de Prado)
    haircut = sharpe * (1 - 1 / max(n_trades, 1) ** 0.5)

    # Rule-to-trade ratio penalty
    rtr = n_rules / max(n_trades, 1)

    # Data adequacy: need ~50 trades per rule minimum
    data_pen = max(0, 1 - n_trades / max(n_rules * 50, 1))

    prob = min(1.0, rtr * 0.25 + data_pen * 0.5 + max(0, (1 - min(n_bars, 500) / 500)) * 0.25)
    risk = "low" if prob < 0.3 else "medium" if prob < 0.6 else "high"

    min_trades = n_rules * 50

    return {
        "overfitting_probability": round(prob, 3),
        "risk_level":              risk,
        "n_rules":                 n_rules,
        "n_trades":                n_trades,
        "n_bars":                  n_bars,
        "haircut_sharpe":          round(haircut, 3),
        "minimum_trades_needed":   min_trades,
        "verdict": (
            f"Strategy uses {n_rules} rules tested across {n_trades} trades on {n_bars} bars. "
            f"Overfitting risk is {risk.upper()}. "
            + (f"Need {min_trades - n_trades} more trades for statistical confidence."
               if n_trades < min_trades else "Sufficient trades for this rule count.")
        ),
    }


# ══════════════════════════════════════════════════════════════════════════════
# DATA LOADING
# ══════════════════════════════════════════════════════════════════════════════

def _load_ohlcv(ticker: str, start=None, end=None) -> pd.DataFrame | None:
    try:
        from config.database import get_db
        db    = get_db()
        query = {"ticker": ticker}
        date_filter = {}
        if start:
            date_filter["$gte"] = pd.Timestamp(start, tz="UTC").to_pydatetime()
        if end:
            date_filter["$lte"] = pd.Timestamp(end, tz="UTC").to_pydatetime()
        if date_filter:
            query["date"] = date_filter

        docs = list(db.ohlcv.find(query, {"_id": 0}).sort("date", 1))

        if len(docs) < 30:
            print(f"[engine] {ticker} not in DB or insufficient — fetching from yfinance...")
            _yf_fetch(ticker, db, start=start)
            docs = list(db.ohlcv.find({"ticker": ticker}, {"_id": 0}).sort("date", 1))

        if not docs:
            return None

        df = pd.DataFrame(docs)
        df.columns = [c.lower() for c in df.columns]
        if "adj_close" in df.columns and "close" not in df.columns:
            df["close"] = df["adj_close"]
        return df

    except Exception as e:
        print(f"[engine] DB load error: {e}")
        return None


def _yf_fetch(ticker: str, db, period: str = "2y", start: str = None):
    try:
        import yfinance as yf
        tkr = yf.Ticker(ticker)
        try:
            if start:
                # ← Use start date instead of rolling period
                df = tkr.history(start=start, interval="1d",
                                 auto_adjust=False, progress=False)
            else:
                df = tkr.history(period=period, interval="1d",
                                 auto_adjust=False, progress=False)
        except TypeError:
            df = tkr.history(period=period, interval="1d", auto_adjust=False)
        if df.empty: return
        df.index = pd.to_datetime(df.index, utc=True)
        for ts, row in df.iterrows():
            doc = {
                "ticker": ticker,
                "date":   ts.to_pydatetime(),
                "open":   round(float(row.get("Open",  0) or 0), 6),
                "high":   round(float(row.get("High",  0) or 0), 6),
                "low":    round(float(row.get("Low",   0) or 0), 6),
                "close":  round(float(row.get("Close", 0) or 0), 6),
                "adj_close": round(float(row.get("Adj Close", row.get("Close", 0)) or 0), 6),
                "volume": int(row.get("Volume", 0) or 0),
                "asset_class": "equity", "source": "yfinance",
            }
            db.ohlcv.update_one({"ticker": ticker, "date": doc["date"]}, {"$set": doc}, upsert=True)
    except Exception as e:
        print(f"[engine] yfinance fallback error: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# UTILITIES
# ══════════════════════════════════════════════════════════════════════════════

def _err(result_id, msg):
    return {"success": False, "result_id": result_id, "status": "failed", "error": msg}

def _fmtd(d):
    if isinstance(d, str):   return d[:10]
    if hasattr(d, "isoformat"): return d.isoformat()[:10]
    return str(d)[:10]

def _trim_curve(curve, max_pts=500):
    if len(curve) <= max_pts: return curve
    step = len(curve) // max_pts
    return curve[::step]