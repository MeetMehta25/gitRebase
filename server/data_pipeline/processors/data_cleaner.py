"""
Data Cleaner & Normaliser.
Runs between raw source fetch and indicator computation.

Problems it solves:
- Splits, dividends causing price jumps (use adj_close everywhere)
- Missing trading days (weekends, holidays)
- Extreme outliers / bad ticks from the source
- Timezone inconsistencies
- Forward-fill gaps (max 3 days — beyond that we flag it)
"""

import pandas as pd
import numpy as np
from datetime import timezone
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Config
MAX_ALLOWED_GAP_DAYS = 3      # beyond this, don't forward-fill — flag it
OUTLIER_STD_THRESHOLD = 6     # z-score threshold for return outliers
MIN_PRICE = 0.0001            # reject prices below this (delisted/bad data)


def clean_ohlcv(records: list[dict]) -> list[dict]:
    """
    Full cleaning pipeline for OHLCV records.
    Returns cleaned records. Logs every action taken.
    """
    if not records:
        return []

    ticker = records[0].get("ticker", "UNKNOWN")
    df = pd.DataFrame(records)

    original_len = len(df)
    df = df.sort_values("date").reset_index(drop=True)

    # 1. Ensure UTC timestamps
    df["date"] = pd.to_datetime(df["date"], utc=True)

    # 2. Deduplicate on (ticker, date)
    before = len(df)
    df = df.drop_duplicates(subset=["ticker", "date"], keep="last")
    if len(df) < before:
        logger.warning(f"{ticker}: removed {before - len(df)} duplicate rows")

    # 3. Remove zero/negative/sub-penny prices
    bad_price_mask = (
        (df["close"] < MIN_PRICE) |
        (df["high"] < MIN_PRICE) |
        (df["low"] < MIN_PRICE) |
        (df["open"] < MIN_PRICE)
    )
    if bad_price_mask.any():
        logger.warning(f"{ticker}: dropped {bad_price_mask.sum()} rows with bad prices")
        df = df[~bad_price_mask]

    # 4. Ensure OHLC consistency (high >= close >= low, high >= open >= low)
    inconsistent = (
        (df["high"] < df["close"]) |
        (df["high"] < df["open"]) |
        (df["low"]  > df["close"]) |
        (df["low"]  > df["open"]) |
        (df["high"] < df["low"])
    )
    if inconsistent.any():
        logger.warning(f"{ticker}: fixing {inconsistent.sum()} OHLC inconsistency rows")
        df.loc[inconsistent, "high"] = df.loc[inconsistent, ["open", "close", "high"]].max(axis=1)
        df.loc[inconsistent, "low"]  = df.loc[inconsistent, ["open", "close", "low"]].min(axis=1)

    # 5. Outlier detection on daily returns (z-score)
    returns = df["adj_close"].pct_change()
    z_scores = (returns - returns.mean()) / (returns.std() + 1e-10)
    outliers = z_scores.abs() > OUTLIER_STD_THRESHOLD
    if outliers.any():
        logger.warning(f"{ticker}: flagged {outliers.sum()} return outliers (z > {OUTLIER_STD_THRESHOLD})")
        df.loc[outliers, "is_outlier"] = True
    if "is_outlier" not in df.columns:
        df["is_outlier"] = False

    # 6. Fill short gaps (weekends / holidays)
    if len(df) > 1:
        df = df.set_index("date")
        full_range = pd.date_range(df.index.min(), df.index.max(), freq="B", tz="UTC")
        gap_days = len(full_range) - len(df)
        if 0 < gap_days <= MAX_ALLOWED_GAP_DAYS * 10:
            df = df.reindex(full_range)
            # Forward-fill price columns, NOT volume (set volume to 0 for filled days)
            price_cols = ["open", "high", "low", "close", "adj_close"]
            df[price_cols] = df[price_cols].ffill()
            df["volume"] = df["volume"].fillna(0)
            df["ticker"] = df["ticker"].ffill()
            df["asset_class"] = df["asset_class"].ffill()
            df["source"] = df["source"].ffill()
            df["fetched_at"] = df["fetched_at"].ffill()
            df["is_filled_gap"] = df["is_outlier"].isna()  # rows that were reindexed
            df["is_outlier"] = df["is_outlier"].fillna(False)
            logger.info(f"{ticker}: forward-filled {gap_days} missing trading days")
        elif gap_days > MAX_ALLOWED_GAP_DAYS * 10:
            logger.warning(f"{ticker}: {gap_days} missing days — too many to fill safely, leaving raw")

        df = df.reset_index().rename(columns={"index": "date"})

    # 7. Volume — negative values to 0
    df["volume"] = df["volume"].clip(lower=0)

    # 8. Normalise adj_close — if not present, use close
    if "adj_close" not in df.columns or df["adj_close"].isna().all():
        df["adj_close"] = df["close"]

    cleaned_len = len(df)
    logger.info(f"{ticker}: cleaning complete. {original_len} → {cleaned_len} rows")

    return df.to_dict("records")


def normalise_for_backtest(df: pd.DataFrame) -> pd.DataFrame:
    """
    Final normalisation step before the backtest engine receives data.
    Returns a clean DataFrame with exactly the columns the engine expects.
    Prices are split-adjusted. Returns are pre-computed.
    """
    required = ["date", "open", "high", "low", "close", "adj_close", "volume"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"normalise_for_backtest: missing columns {missing}")

    df = df.copy().sort_values("date").reset_index(drop=True)

    # Adjustment ratio — scales open/high/low to be consistent with adj_close
    adj_ratio = df["adj_close"] / df["close"]
    df["open_adj"]  = df["open"] * adj_ratio
    df["high_adj"]  = df["high"] * adj_ratio
    df["low_adj"]   = df["low"]  * adj_ratio

    # Pre-compute log returns for the backtest engine
    df["log_return"] = np.log(df["adj_close"] / df["adj_close"].shift(1))

    # Drop any rows still missing a close price
    df = df.dropna(subset=["adj_close"])

    return df[["date", "open_adj", "high_adj", "low_adj",
               "adj_close", "volume", "log_return"] +
              [c for c in df.columns if c.isupper()]]   # keep all indicator cols