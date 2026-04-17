"""
FRED (Federal Reserve Economic Data) source — free API key from fred.stlouisfed.org
Covers: interest rates, inflation, GDP, unemployment, VIX, yield curves.
These feed the regime detection and macro context layers.
"""

import os
import pandas as pd
from datetime import datetime, timezone
from fredapi import Fred
from utils.logger import setup_logger
from utils.rate_limiter import RateLimiter

logger = setup_logger(__name__)
_limiter = RateLimiter(calls_per_minute=120, source="fred")

# Key macro series used in regime detection and strategy context
MACRO_SERIES = {
    # Interest rates
    "DFF":    "Fed Funds Rate (daily)",
    "DGS10":  "10-Year Treasury Yield",
    "DGS2":   "2-Year Treasury Yield",
    "T10Y2Y": "Yield Curve (10Y-2Y spread)",

    # Inflation
    "CPIAUCSL": "CPI (Urban, All Items)",
    "CPILFESL": "Core CPI (ex Food & Energy)",
    "T10YIE":   "10-Year Breakeven Inflation",

    # Economic activity
    "GDP":      "US GDP (quarterly)",
    "UNRATE":   "Unemployment Rate",
    "INDPRO":   "Industrial Production Index",

    # Market / risk
    "VIXCLS":   "CBOE VIX",
    "BAMLH0A0HYM2": "High Yield Spread",
    "TEDRATE":  "TED Spread",

    # Credit / liquidity
    "M2SL":     "M2 Money Supply",
    "DCOILWTICO": "WTI Crude Oil Price",
}


def _get_client() -> Fred:
    api_key = os.getenv("FRED_API_KEY", "")
    if not api_key:
        raise ValueError("FRED_API_KEY not set. Get a free key at fred.stlouisfed.org")
    return Fred(api_key=api_key)


def fetch_series(series_id: str, start: str = "2000-01-01") -> list[dict]:
    """Fetch a single FRED series and return standardised records."""
    _limiter.wait()
    try:
        fred = _get_client()
        raw: pd.Series = fred.get_series(series_id, observation_start=start)
        raw = raw.dropna()

        fetched_at = datetime.now(timezone.utc)
        name = MACRO_SERIES.get(series_id, series_id)

        records = [
            {
                "series_id": series_id,
                "name": name,
                "date": pd.Timestamp(date, tz="UTC").to_pydatetime(),
                "value": round(float(val), 6),
                "source": "fred",
                "fetched_at": fetched_at,
            }
            for date, val in raw.items()
        ]
        logger.info(f"FRED → {series_id} ({name}): {len(records)} observations")
        return records

    except Exception as e:
        logger.error(f"FRED fetch failed for {series_id}: {e}")
        return []


def fetch_all_macro(start: str = "2000-01-01") -> dict[str, list[dict]]:
    """Fetch all key macro series. Used for regime detection pipeline."""
    result = {}
    for series_id in MACRO_SERIES:
        result[series_id] = fetch_series(series_id, start=start)
    return result


def fetch_yield_curve_snapshot() -> dict:
    """
    Current yield curve shape — used as a real-time regime signal.
    Returns spread values and inversion flag.
    """
    _limiter.wait()
    try:
        fred = _get_client()
        t10 = fred.get_series_latest_release("DGS10")
        t2  = fred.get_series_latest_release("DGS2")
        t3m = fred.get_series_latest_release("DGS3MO")

        spread_10_2  = round(float(t10.iloc[-1]) - float(t2.iloc[-1]),  4)
        spread_10_3m = round(float(t10.iloc[-1]) - float(t3m.iloc[-1]), 4)

        return {
            "t3m": round(float(t3m.iloc[-1]), 4),
            "t2":  round(float(t2.iloc[-1]),  4),
            "t10": round(float(t10.iloc[-1]), 4),
            "spread_10_2":  spread_10_2,
            "spread_10_3m": spread_10_3m,
            "inverted": spread_10_2 < 0,
            "fetched_at": datetime.now(timezone.utc),
        }
    except Exception as e:
        logger.error(f"Yield curve snapshot failed: {e}")
        return {}