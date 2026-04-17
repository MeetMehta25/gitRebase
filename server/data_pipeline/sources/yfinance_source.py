"""
yfinance source — primary free data provider.
Covers: equities, ETFs, indices, forex pairs, crypto (*-USD tickers).

Returns standardised OHLCV dicts ready for MongoDB upsert.
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timezone
from typing import Optional
from utils.logger import setup_logger
from utils.rate_limiter import RateLimiter

logger = setup_logger(__name__)
_limiter = RateLimiter(calls_per_minute=60, source="yfinance")

# ── Asset class detection ──────────────────────────────────────────────────────
_CRYPTO_SUFFIXES = ("-USD", "-USDT", "-BTC", "-ETH")
_ETF_LIST = {
    "NIFTYBEES.NS",
    "BANKBEES.NS",
    "JUNIORBEES.NS",
    "GOLDBEES.NS",
    "ITBEES.NS",
    "INFRABEES.NS",
}


def _detect_asset_class(ticker: str) -> str:
    t = ticker.upper()
    if any(t.endswith(s) for s in _CRYPTO_SUFFIXES):
        return "crypto"
    if t in _ETF_LIST:
        return "etf"
    if t.startswith("^"):
        return "index"
    if "=X" in t:
        return "forex"
    return "equity"


# ── Main fetch ─────────────────────────────────────────────────────────────────

def fetch_ohlcv(
    ticker: str,
    period: str = "5y",
    interval: str = "1d",
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> list[dict]:
    """
    Pull OHLCV from yfinance and return a list of standardised dicts.

    Each dict shape:
    {
        ticker, date, open, high, low, close, adj_close, volume,
        asset_class, source, fetched_at
    }
    """
    _limiter.wait()
    try:
        tkr = yf.Ticker(ticker)

        kwargs = {"interval": interval, "auto_adjust": False, "progress": False}
        if start and end:
            kwargs["start"] = start
            kwargs["end"] = end
        else:
            kwargs["period"] = period

        df: pd.DataFrame = tkr.history(**kwargs)

        if df.empty:
            logger.warning(f"yfinance returned empty data for {ticker}")
            return []

        df.index = pd.to_datetime(df.index, utc=True)
        asset_class = _detect_asset_class(ticker)
        fetched_at = datetime.now(timezone.utc)

        records = []
        for ts, row in df.iterrows():
            records.append({
                "ticker": ticker.upper(),
                "date": ts.to_pydatetime(),
                "open": round(float(row.get("Open", 0)), 6),
                "high": round(float(row.get("High", 0)), 6),
                "low": round(float(row.get("Low", 0)), 6),
                "close": round(float(row.get("Close", 0)), 6),
                "adj_close": round(float(row.get("Adj Close", row.get("Close", 0))), 6),
                "volume": int(row.get("Volume", 0)),
                "asset_class": asset_class,
                "source": "yfinance",
                "fetched_at": fetched_at,
            })

        logger.info(f"yfinance → {ticker}: {len(records)} bars ({interval})")
        return records

    except Exception as e:
        logger.error(f"yfinance fetch failed for {ticker}: {e}")
        return []


def fetch_ticker_metadata(ticker: str) -> dict:
    """Pull static info: sector, industry, market cap, currency, exchange."""
    _limiter.wait()
    try:
        info = yf.Ticker(ticker).info
        return {
            "ticker": ticker.upper(),
            "name": info.get("longName") or info.get("shortName", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "market_cap": info.get("marketCap"),
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange", ""),
            "asset_class": _detect_asset_class(ticker),
            "country": info.get("country", ""),
            "source": "yfinance",
            "fetched_at": datetime.now(timezone.utc),
        }
    except Exception as e:
        logger.error(f"Metadata fetch failed for {ticker}: {e}")
        return {"ticker": ticker.upper(), "error": str(e)}


def fetch_bulk_ohlcv(tickers: list[str], period: str = "5y") -> dict[str, list[dict]]:
    """
    Fetch multiple tickers in one yfinance call (more efficient).
    Returns {ticker: [records]}.
    """
    _limiter.wait()
    try:
        raw = yf.download(
            tickers=" ".join(tickers),
            period=period,
            interval="1d",
            auto_adjust=False,
            progress=False,
            group_by="ticker",
        )

        result = {}
        for ticker in tickers:
            try:
                if len(tickers) == 1:
                    df = raw
                else:
                    df = raw[ticker]

                df = df.dropna(how="all")
                df.index = pd.to_datetime(df.index, utc=True)
                asset_class = _detect_asset_class(ticker)
                fetched_at = datetime.now(timezone.utc)

                result[ticker] = [
                    {
                        "ticker": ticker.upper(),
                        "date": ts.to_pydatetime(),
                        "open": round(float(row["Open"]), 6),
                        "high": round(float(row["High"]), 6),
                        "low": round(float(row["Low"]), 6),
                        "close": round(float(row["Close"]), 6),
                        "adj_close": round(float(row.get("Adj Close", row["Close"])), 6),
                        "volume": int(row["Volume"]),
                        "asset_class": asset_class,
                        "source": "yfinance",
                        "fetched_at": fetched_at,
                    }
                    for ts, row in df.iterrows()
                ]
                logger.info(f"Bulk yfinance → {ticker}: {len(result[ticker])} bars")
            except Exception as e:
                logger.warning(f"Bulk parse failed for {ticker}: {e}")
                result[ticker] = []

        return result
    except Exception as e:
        logger.error(f"Bulk yfinance download failed: {e}")
        return {t: [] for t in tickers}