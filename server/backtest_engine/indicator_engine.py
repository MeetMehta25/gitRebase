"""
backtest_engine/indicators.py
─────────────────────────────
Pure numpy/pandas indicator library. Zero external TA dependencies.
Every formula is explicit, auditable, and matches TradingView/Bloomberg output.

INJECTION CONTRACT:
  compute_indicators(df, dsl_indicators_list) → enriched DataFrame

  Every indicator is stored under TWO column names:
    - Parametrised:  RSI_14, SMA_50, ATR_14  (exact period reference)
    - Plain name:    RSI, SMA, ATR            (DSL condition matching)

  NaN is returned for warmup bars — the simulation loop skips NaN bars automatically.
"""

import pandas as pd
import numpy as np
import warnings


# ══════════════════════════════════════════════════════════════════════════════
# INDIVIDUAL INDICATOR FUNCTIONS
# Each takes a normalised df (lowercase cols: open,high,low,close,volume)
# Each returns a pd.Series aligned with df.index
# ══════════════════════════════════════════════════════════════════════════════

def rsi(df, period=14):
    """
    Wilder's RSI (Relative Strength Index).
    Uses exponential smoothing with alpha=1/period (Wilder's RMA).
    Identical to TradingView and Bloomberg. Range 0–100.
    Warmup: period bars.
    """
    delta    = df["close"].diff()
    gain     = delta.clip(lower=0)
    loss     = (-delta).clip(lower=0)
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    rs       = avg_gain / avg_loss.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).rename(f"RSI_{period}")


def sma(df, period=20, col="close"):
    """Simple Moving Average. Warmup: period bars."""
    return df[col].rolling(window=period, min_periods=period).mean().rename(f"SMA_{period}")


def ema(df, period=20, col="close"):
    """Exponential Moving Average. Warmup: period bars."""
    return df[col].ewm(span=period, min_periods=period, adjust=False).mean().rename(f"EMA_{period}")


def macd(df, fast=12, slow=26, signal=9):
    """
    MACD (Moving Average Convergence Divergence).
    MACD line   = EMA(fast) − EMA(slow)
    Signal line = EMA(signal) of MACD line
    Histogram   = MACD − Signal
    Warmup: slow + signal bars.
    """
    close  = df["close"]
    e_fast = close.ewm(span=fast,   min_periods=fast,   adjust=False).mean()
    e_slow = close.ewm(span=slow,   min_periods=slow,   adjust=False).mean()
    line   = e_fast - e_slow
    sig    = line.ewm(span=signal,  min_periods=signal, adjust=False).mean()
    return pd.DataFrame({
        "MACD":        line,
        "MACD_SIGNAL": sig,
        "MACD_HIST":   line - sig,
    }, index=df.index)


def bollinger_bands(df, period=20, std_dev=2.0):
    """
    Bollinger Bands.
    BB_UPPER   = SMA + k*σ
    BB_LOWER   = SMA − k*σ
    BB_WIDTH   = (upper−lower)/mid   normalised band width
    BB_PERCENT = (close−lower)/(upper−lower)  0=at lower, 1=at upper
    Warmup: period bars.
    """
    close = df["close"]
    mid   = close.rolling(period, min_periods=period).mean()
    std   = close.rolling(period, min_periods=period).std(ddof=0)
    upper = mid + std_dev * std
    lower = mid - std_dev * std
    return pd.DataFrame({
        "BB_UPPER":   upper,
        "BB_MID":     mid,
        "BB_LOWER":   lower,
        "BB_WIDTH":   (upper - lower) / mid.replace(0, np.nan),
        "BB_PERCENT": (close - lower) / (upper - lower).replace(0, np.nan),
    }, index=df.index)


def atr(df, period=14):
    """
    Average True Range.
    TR = max(high−low, |high−prev_close|, |low−prev_close|)
    Uses Wilder's smoothing. Warmup: period bars.
    """
    h, l, c  = df["high"], df["low"], df["close"]
    prev     = c.shift(1)
    tr       = pd.concat([h-l, (h-prev).abs(), (l-prev).abs()], axis=1).max(axis=1)
    return tr.ewm(alpha=1/period, min_periods=period, adjust=False).mean().rename(f"ATR_{period}")


def stochastic(df, k_period=14, d_period=3):
    """
    Stochastic Oscillator.
    %K = (close − lowest_low) / (highest_high − lowest_low) × 100
    %D = SMA(%K, d_period)
    Range 0–100. Oversold < 20, overbought > 80.
    """
    lowest  = df["low"].rolling(k_period,  min_periods=k_period).min()
    highest = df["high"].rolling(k_period, min_periods=k_period).max()
    k = 100 * (df["close"] - lowest) / (highest - lowest).replace(0, np.nan)
    d = k.rolling(d_period, min_periods=d_period).mean()
    return pd.DataFrame({"STOCH_K": k, "STOCH_D": d}, index=df.index)


def cci(df, period=20):
    """
    Commodity Channel Index.
    CCI = (TP − SMA(TP)) / (0.015 × MeanDev)
    Range typically ±200. Overbought >100, oversold <-100.
    """
    tp      = (df["high"] + df["low"] + df["close"]) / 3
    sma_tp  = tp.rolling(period, min_periods=period).mean()
    mdev    = tp.rolling(period, min_periods=period).apply(
                  lambda x: np.mean(np.abs(x - x.mean())), raw=True)
    return ((tp - sma_tp) / (0.015 * mdev.replace(0, np.nan))).rename(f"CCI_{period}")


def williams_r(df, period=14):
    """
    Williams %R.
    %R = (highest_high − close) / (highest_high − lowest_low) × −100
    Range −100 to 0. Overbought > −20, oversold < −80.
    """
    high = df["high"].rolling(period, min_periods=period).max()
    low  = df["low"].rolling(period,  min_periods=period).min()
    return (-100 * (high - df["close"]) / (high - low).replace(0, np.nan)).rename("WILLIAMS_R")


def obv(df):
    """
    On-Balance Volume.
    Cumulative sum: +volume on up day, −volume on down day.
    """
    direction = np.sign(df["close"].diff()).fillna(0)
    return (direction * df["volume"]).cumsum().rename("OBV")


def vwap(df):
    """
    Volume-Weighted Average Price (cumulative from start of data).
    Best used intraday; on daily bars acts as a long-run fair value line.
    """
    tp = (df["high"] + df["low"] + df["close"]) / 3
    return ((tp * df["volume"]).cumsum() / df["volume"].cumsum().replace(0, np.nan)).rename("VWAP")


def mfi(df, period=14):
    """
    Money Flow Index.
    Volume-weighted RSI. Range 0–100.
    Overbought > 80, oversold < 20.
    """
    tp      = (df["high"] + df["low"] + df["close"]) / 3
    raw_mf  = tp * df["volume"]
    td      = tp.diff()
    pos_sum = raw_mf.where(td > 0, 0).rolling(period, min_periods=period).sum()
    neg_sum = raw_mf.where(td < 0, 0).rolling(period, min_periods=period).sum().replace(0, np.nan)
    return (100 - 100 / (1 + pos_sum / neg_sum)).rename(f"MFI_{period}")


def roc(df, period=10):
    """Rate of Change: % change over period bars."""
    c = df["close"]
    return ((c - c.shift(period)) / c.shift(period).replace(0, np.nan) * 100).rename(f"ROC_{period}")


def momentum(df, period=10):
    """Price momentum: close − close[period bars ago]."""
    return (df["close"] - df["close"].shift(period)).rename(f"MOM_{period}")


def adx(df, period=14):
    """
    Average Directional Index + Directional Indicators.
    ADX > 25 = trending, < 20 = ranging.
    Returns DataFrame: ADX, DI_PLUS, DI_MINUS.
    """
    h, l, c = df["high"], df["low"], df["close"]
    up, dn  = h.diff(), -l.diff()

    plus_dm  = np.where((up > dn)  & (up > 0), up, 0.0)
    minus_dm = np.where((dn > up)  & (dn > 0), dn, 0.0)

    tr = pd.concat([h-l, (h-c.shift(1)).abs(), (l-c.shift(1)).abs()], axis=1).max(axis=1)
    α  = 1 / period

    atr_s   = tr.ewm(alpha=α, min_periods=period, adjust=False).mean()
    plus_s  = pd.Series(plus_dm,  index=df.index).ewm(alpha=α, min_periods=period, adjust=False).mean()
    minus_s = pd.Series(minus_dm, index=df.index).ewm(alpha=α, min_periods=period, adjust=False).mean()

    di_p = 100 * plus_s  / atr_s.replace(0, np.nan)
    di_m = 100 * minus_s / atr_s.replace(0, np.nan)
    dx   = 100 * (di_p - di_m).abs() / (di_p + di_m).replace(0, np.nan)

    return pd.DataFrame({
        "ADX":      dx.ewm(alpha=α, min_periods=period, adjust=False).mean(),
        "DI_PLUS":  di_p,
        "DI_MINUS": di_m,
    }, index=df.index)


def ichimoku(df, conv=9, base=26, span_b=52, disp=26):
    """
    Ichimoku Cloud.
    Returns: ICHI_CONV, ICHI_BASE, ICHI_SPAN_A, ICHI_SPAN_B, ICHI_CHIKOU
    """
    def midpoint(period):
        return (df["high"].rolling(period).max() + df["low"].rolling(period).min()) / 2

    conv_line  = midpoint(conv)
    base_line  = midpoint(base)
    span_a     = ((conv_line + base_line) / 2).shift(disp)
    span_b_s   = midpoint(span_b).shift(disp)
    chikou     = df["close"].shift(-disp)

    return pd.DataFrame({
        "ICHI_CONV":   conv_line,
        "ICHI_BASE":   base_line,
        "ICHI_SPAN_A": span_a,
        "ICHI_SPAN_B": span_b_s,
        "ICHI_CHIKOU": chikou,
    }, index=df.index)


# ══════════════════════════════════════════════════════════════════════════════
# MASTER DISPATCHER
# ══════════════════════════════════════════════════════════════════════════════

def compute_indicators(df: pd.DataFrame, indicator_list: list) -> pd.DataFrame:
    """
    Main entry point.

    Input:
      df              — OHLCV DataFrame (any case column names)
      indicator_list  — DSL indicators array, e.g.:
                        [{"name": "RSI", "period": 14},
                         {"name": "MACD"},
                         {"name": "BB", "period": 20}]

    Output:
      Enriched DataFrame with all indicator columns appended.
      Every indicator stored as BOTH:
        RSI_14  (parametrised — for display and debug)
        RSI     (plain name   — for DSL condition eval)

    Columns with NaN in warmup period are kept — simulation loop
    handles NaN by skipping signal evaluation for those bars.
    """
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]

    # Normalise adj_close → close alias
    if "adj_close" in df.columns and "close" not in df.columns:
        df["close"] = df["adj_close"]
    if "volume" not in df.columns:
        df["volume"] = 0.0

    for required in ["open", "high", "low", "close"]:
        if required not in df.columns:
            raise ValueError(f"DataFrame missing required OHLCV column: '{required}'")

    for ind in indicator_list:
        name = ind.get("name", "").upper().strip()
        try:
            if name == "RSI":
                p = ind.get("period", 14)
                series = rsi(df, p)
                df[f"RSI_{p}"] = series.values
                df["RSI"]      = series.values

            elif name == "SMA":
                p = ind.get("period", 20)
                series = sma(df, p, ind.get("column", "close"))
                df[f"SMA_{p}"] = series.values
                df["SMA"]      = series.values

            elif name == "EMA":
                p = ind.get("period", 20)
                series = ema(df, p, ind.get("column", "close"))
                df[f"EMA_{p}"] = series.values
                df["EMA"]      = series.values

            elif name in ("MACD", "MACD_SIGNAL", "MACD_HIST"):
                if "MACD" not in df.columns:
                    r = macd(df, ind.get("fast", 12), ind.get("slow", 26), ind.get("signal", 9))
                    for col in r.columns:
                        df[col] = r[col].values

            elif name in ("BB", "BB_UPPER", "BB_LOWER", "BB_MID", "BOLLINGER"):
                if "BB_UPPER" not in df.columns:
                    p = ind.get("period", 20)
                    r = bollinger_bands(df, p, ind.get("std_dev", 2.0))
                    for col in r.columns:
                        df[f"{col}_{p}"] = r[col].values   # BB_UPPER_20
                        df[col]          = r[col].values   # BB_UPPER

            elif name == "ATR":
                p = ind.get("period", 14)
                series = atr(df, p)
                df[f"ATR_{p}"] = series.values
                df["ATR"]      = series.values

            elif name in ("STOCH", "STOCHASTIC", "STOCH_K", "STOCH_D"):
                if "STOCH_K" not in df.columns:
                    r = stochastic(df, ind.get("k_period", 14), ind.get("d_period", 3))
                    df["STOCH_K"] = r["STOCH_K"].values
                    df["STOCH_D"] = r["STOCH_D"].values

            elif name == "CCI":
                p = ind.get("period", 20)
                series = cci(df, p)
                df[f"CCI_{p}"] = series.values
                df["CCI"]      = series.values

            elif name == "WILLIAMS_R":
                p = ind.get("period", 14)
                df["WILLIAMS_R"] = williams_r(df, p).values

            elif name == "OBV":
                df["OBV"] = obv(df).values

            elif name == "VWAP":
                df["VWAP"] = vwap(df).values

            elif name == "MFI":
                p = ind.get("period", 14)
                series = mfi(df, p)
                df[f"MFI_{p}"] = series.values
                df["MFI"]      = series.values

            elif name == "ROC":
                p = ind.get("period", 10)
                series = roc(df, p)
                df[f"ROC_{p}"] = series.values
                df["ROC"]      = series.values

            elif name in ("MOM", "MOMENTUM"):
                p = ind.get("period", 10)
                series = momentum(df, p)
                df[f"MOM_{p}"] = series.values
                df["MOM"]      = series.values

            elif name == "ADX":
                if "ADX" not in df.columns:
                    r = adx(df, ind.get("period", 14))
                    for col in r.columns:
                        df[col] = r[col].values

            elif name in ("ICHIMOKU", "ICHI"):
                if "ICHI_CONV" not in df.columns:
                    r = ichimoku(df)
                    for col in r.columns:
                        df[col] = r[col].values

            else:
                warnings.warn(f"[indicators] Unknown indicator '{name}' — skipped")

        except Exception as e:
            warnings.warn(f"[indicators] Failed to compute '{name}': {e}")

    return df


def indicator_debug_stats(df: pd.DataFrame, indicator_list: list) -> dict:
    """
    Returns debug stats for every computed indicator:
      current_value, min, max, mean, std, warmup_bars, null_count
    Used in the backtest result's indicator_debug section.
    """
    stats = {}
    computed_cols = set(df.columns) - {"open","high","low","close","volume","adj_close","date","ticker","source","asset_class","fetched_at"}

    for ind in indicator_list:
        name = ind.get("name","").upper()
        period = ind.get("period", ind.get("k_period", 14))
        key = f"{name}_{period}" if f"{name}_{period}" in df.columns else name

        if key not in df.columns:
            continue
        col = df[key].dropna()
        if col.empty:
            continue

        stats[key] = {
            "current_value": round(float(df[key].iloc[-1]), 4) if not pd.isna(df[key].iloc[-1]) else None,
            "min":           round(float(col.min()), 4),
            "max":           round(float(col.max()), 4),
            "mean":          round(float(col.mean()), 4),
            "std":           round(float(col.std()), 4),
            "warmup_bars":   int(df[key].isna().sum()),
            "total_bars":    len(df),
        }
    return stats