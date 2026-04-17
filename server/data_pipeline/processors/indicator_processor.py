"""
Technical Indicator Processor.
Takes raw OHLCV records → computes all indicators → returns enriched records.

This is the most critical processing step. The LLM-parsed strategy rules
reference these indicator names directly (e.g. "RSI", "SMA_50", "MACD_signal").
"""

import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Optional
import ta                      # ta library for clean indicator API
from utils.logger import setup_logger

logger = setup_logger(__name__)

# ── Indicator catalogue ────────────────────────────────────────────────────────
# These names MUST match what the LLM strategy parser outputs.
# Format: INDICATOR_PARAM (e.g. SMA_50, EMA_20, BB_UPPER_20)

INDICATOR_GROUPS = {
    "trend": [
        "SMA_20", "SMA_50", "SMA_100", "SMA_200",
        "EMA_9", "EMA_12", "EMA_20", "EMA_26", "EMA_50",
        "MACD", "MACD_SIGNAL", "MACD_HIST",
        "ADX", "DI_PLUS", "DI_MINUS",
        "ICHIMOKU_CONV", "ICHIMOKU_BASE",
    ],
    "momentum": [
        "RSI_14", "RSI_7",
        "STOCH_K", "STOCH_D",
        "CCI_20",
        "WILLIAMS_R",
        "ROC_10",
        "MOM_10",
    ],
    "volatility": [
        "BB_UPPER_20", "BB_LOWER_20", "BB_MID_20", "BB_WIDTH_20", "BB_PERCENT_20",
        "ATR_14",
        "KELTNER_UPPER", "KELTNER_LOWER",
        "HISTORICAL_VOL_20", "HISTORICAL_VOL_60",
    ],
    "volume": [
        "OBV",
        "VWAP",
        "MFI_14",
        "CMF_20",
        "VOLUME_SMA_20",
        "VOLUME_RATIO",          # current volume / 20-day avg
    ],
    "price_derived": [
        "RETURNS_1D", "RETURNS_5D", "RETURNS_20D",
        "LOG_RETURNS_1D",
        "HIGH_LOW_RANGE",        # (high - low) / close
        "CLOSE_TO_HIGH",         # (high - close) / high
        "GAP",                   # (open - prev_close) / prev_close
    ],
    "cross_signals": [
        "GOLDEN_CROSS",          # SMA50 > SMA200
        "DEATH_CROSS",           # SMA50 < SMA200
        "MACD_CROSS_UP",         # MACD crosses above signal
        "MACD_CROSS_DOWN",
        "RSI_OVERBOUGHT",        # RSI > 70
        "RSI_OVERSOLD",          # RSI < 30
        "PRICE_ABOVE_SMA200",
        "PRICE_ABOVE_SMA50",
    ],
}


def compute_all_indicators(ohlcv_records: list[dict]) -> pd.DataFrame:
    """
    Primary entry point.
    Input:  list of OHLCV dicts (from any source)
    Output: DataFrame with all indicators appended as columns.
            Each row = one trading day + all computed values.
    """
    if not ohlcv_records:
        logger.warning("compute_all_indicators: empty OHLCV input")
        return pd.DataFrame()

    df = pd.DataFrame(ohlcv_records).sort_values("date").reset_index(drop=True)

    if len(df) < 30:
        logger.warning(f"Too few bars ({len(df)}) — some indicators will be NaN")

    close = df["adj_close"] if "adj_close" in df.columns else df["close"]
    high  = df["high"]
    low   = df["low"]
    open_ = df["open"]
    vol   = df["volume"].fillna(0).astype(float)

    # ── Trend ──────────────────────────────────────────────────────────────────
    df["SMA_20"]  = ta.trend.sma_indicator(close, window=20)
    df["SMA_50"]  = ta.trend.sma_indicator(close, window=50)
    df["SMA_100"] = ta.trend.sma_indicator(close, window=100)
    df["SMA_200"] = ta.trend.sma_indicator(close, window=200)

    df["EMA_9"]  = ta.trend.ema_indicator(close, window=9)
    df["EMA_12"] = ta.trend.ema_indicator(close, window=12)
    df["EMA_20"] = ta.trend.ema_indicator(close, window=20)
    df["EMA_26"] = ta.trend.ema_indicator(close, window=26)
    df["EMA_50"] = ta.trend.ema_indicator(close, window=50)

    macd = ta.trend.MACD(close)
    df["MACD"]        = macd.macd()
    df["MACD_SIGNAL"] = macd.macd_signal()
    df["MACD_HIST"]   = macd.macd_diff()

    adx = ta.trend.ADXIndicator(high, low, close, window=14)
    df["ADX"]      = adx.adx()
    df["DI_PLUS"]  = adx.adx_pos()
    df["DI_MINUS"] = adx.adx_neg()

    # ── Momentum ───────────────────────────────────────────────────────────────
    df["RSI_14"] = ta.momentum.RSIIndicator(close, window=14).rsi()
    df["RSI_7"]  = ta.momentum.RSIIndicator(close, window=7).rsi()

    stoch = ta.momentum.StochasticOscillator(high, low, close, window=14, smooth_window=3)
    df["STOCH_K"] = stoch.stoch()
    df["STOCH_D"] = stoch.stoch_signal()

    df["CCI_20"]     = ta.trend.CCIIndicator(high, low, close, window=20).cci()
    df["WILLIAMS_R"] = ta.momentum.WilliamsRIndicator(high, low, close, lbp=14).williams_r()
    df["ROC_10"]     = ta.momentum.ROCIndicator(close, window=10).roc()
    df["MOM_10"]     = close.diff(10)

    # ── Volatility ─────────────────────────────────────────────────────────────
    bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
    df["BB_UPPER_20"]   = bb.bollinger_hband()
    df["BB_LOWER_20"]   = bb.bollinger_lband()
    df["BB_MID_20"]     = bb.bollinger_mavg()
    df["BB_WIDTH_20"]   = bb.bollinger_wband()
    df["BB_PERCENT_20"] = bb.bollinger_pband()

    df["ATR_14"] = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range()

    kelt = ta.volatility.KeltnerChannel(high, low, close, window=20)
    df["KELTNER_UPPER"] = kelt.keltner_channel_hband()
    df["KELTNER_LOWER"] = kelt.keltner_channel_lband()

    df["HISTORICAL_VOL_20"] = close.pct_change().rolling(20).std() * (252 ** 0.5)
    df["HISTORICAL_VOL_60"] = close.pct_change().rolling(60).std() * (252 ** 0.5)

    # ── Volume ─────────────────────────────────────────────────────────────────
    if vol.sum() > 0:
        df["OBV"]           = ta.volume.OnBalanceVolumeIndicator(close, vol).on_balance_volume()
        df["MFI_14"]        = ta.volume.MFIIndicator(high, low, close, vol, window=14).money_flow_index()
        df["CMF_20"]        = ta.volume.ChaikinMoneyFlowIndicator(high, low, close, vol, window=20).chaikin_money_flow()
        df["VOLUME_SMA_20"] = vol.rolling(20).mean()
        df["VOLUME_RATIO"]  = vol / vol.rolling(20).mean()

        # VWAP (rolling daily approximation)
        typical_price = (high + low + close) / 3
        df["VWAP"] = (typical_price * vol).cumsum() / vol.cumsum()
    else:
        for col in ["OBV", "MFI_14", "CMF_20", "VOLUME_SMA_20", "VOLUME_RATIO", "VWAP"]:
            df[col] = np.nan

    # ── Price derived ──────────────────────────────────────────────────────────
    df["RETURNS_1D"]     = close.pct_change(1)
    df["RETURNS_5D"]     = close.pct_change(5)
    df["RETURNS_20D"]    = close.pct_change(20)
    df["LOG_RETURNS_1D"] = np.log(close / close.shift(1))
    df["HIGH_LOW_RANGE"] = (high - low) / close
    df["CLOSE_TO_HIGH"]  = (high - close) / high
    df["GAP"]            = (open_ - close.shift(1)) / close.shift(1)

    # ── Cross signals (boolean → 0/1) ─────────────────────────────────────────
    df["GOLDEN_CROSS"]       = (df["SMA_50"] > df["SMA_200"]).astype(int)
    df["DEATH_CROSS"]        = (df["SMA_50"] < df["SMA_200"]).astype(int)
    df["MACD_CROSS_UP"]      = ((df["MACD"] > df["MACD_SIGNAL"]) &
                                 (df["MACD"].shift(1) <= df["MACD_SIGNAL"].shift(1))).astype(int)
    df["MACD_CROSS_DOWN"]    = ((df["MACD"] < df["MACD_SIGNAL"]) &
                                 (df["MACD"].shift(1) >= df["MACD_SIGNAL"].shift(1))).astype(int)
    df["RSI_OVERBOUGHT"]     = (df["RSI_14"] > 70).astype(int)
    df["RSI_OVERSOLD"]       = (df["RSI_14"] < 30).astype(int)
    df["PRICE_ABOVE_SMA200"] = (close > df["SMA_200"]).astype(int)
    df["PRICE_ABOVE_SMA50"]  = (close > df["SMA_50"]).astype(int)

    # Add metadata columns back
    df["ticker"]     = ohlcv_records[0].get("ticker", "")
    df["asset_class"] = ohlcv_records[0].get("asset_class", "")
    df["computed_at"] = datetime.now(timezone.utc)

    logger.info(f"Indicators computed for {df['ticker'].iloc[0]}: "
                f"{len(df)} rows × {len(df.columns)} columns")
    return df


def to_indicator_records(df: pd.DataFrame) -> list[dict]:
    """
    Flatten the enriched DataFrame into MongoDB-ready indicator records.
    One record per (ticker, indicator_name, date).
    Stored separately from OHLCV for efficient indicator-level queries.
    """
    indicator_cols = [
        c for c in df.columns
        if c not in {"ticker", "date", "open", "high", "low", "close",
                     "adj_close", "volume", "asset_class", "source",
                     "fetched_at", "computed_at"}
    ]
    records = []
    for _, row in df.iterrows():
        for col in indicator_cols:
            val = row[col]
            if pd.isna(val):
                continue
            records.append({
                "ticker":     row["ticker"],
                "date":       row["date"],
                "indicator":  col,
                "value":      round(float(val), 8),
                "computed_at": row["computed_at"],
            })
    return records


def get_indicator_snapshot(df: pd.DataFrame, date: Optional[str] = None) -> dict:
    """
    Return all indicator values for a single date as a flat dict.
    Used by the strategy parser to validate that indicator names exist.
    Default: latest available row.
    """
    if date:
        row = df[df["date"].astype(str).str.startswith(date)]
        if row.empty:
            return {}
        row = row.iloc[-1]
    else:
        row = df.iloc[-1]

    return {
        col: (None if pd.isna(row[col]) else round(float(row[col]), 8))
        for col in df.columns
        if col not in {"ticker", "date", "source", "fetched_at", "computed_at"}
    }