"""
Pipeline Orchestrator — the single entry point.
Calling code (routes, backtest engine, strategy parser) only imports this.

Full pipeline per ticker:
  Source fetch → Clean → Validate → Compute indicators → Upsert MongoDB → Return

Also handles:
  - Cache checking (skip re-fetch if data is fresh)
  - Source fallback (yfinance → coingecko for crypto)
  - Pipeline run logging to MongoDB
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from config.database import get_db
from data_pipeline.sources.yfinance_source import fetch_ohlcv as yf_fetch, fetch_bulk_ohlcv, fetch_ticker_metadata
from data_pipeline.sources.coingecko_source import fetch_ohlcv as cg_fetch
from data_pipeline.sources.fred_source import fetch_series, fetch_all_macro
from data_pipeline.processors.data_cleaner import clean_ohlcv, normalise_for_backtest
from data_pipeline.processors.indicator_processor import compute_all_indicators, to_indicator_records
from data_pipeline.validators.data_validator import validate_ohlcv
from utils.logger import setup_logger
import pandas as pd

logger = setup_logger(__name__)

CRYPTO_TICKERS = {"BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOGE"}


def run_pipeline(
    ticker: str,
    period: str = "5y",
    force_refresh: bool = False,
    compute_indicators: bool = True,
) -> dict:
    """
    Full data pipeline for a single ticker.

    Returns:
    {
        "ticker": str,
        "status": "success" | "cached" | "failed",
        "record_count": int,
        "date_range": [start, end],
        "validation": ValidationReport.to_dict(),
        "run_id": str,
        "dataframe": pd.DataFrame   ← enriched, ready for backtest engine
    }
    """
    run_id = str(uuid.uuid4())
    db = get_db()
    started_at = datetime.now(timezone.utc)

    _log_run(db, run_id, ticker, "started", started_at)
    logger.info(f"Pipeline start | ticker={ticker} | period={period} | run_id={run_id}")

    try:
        # ── 1. Cache check ─────────────────────────────────────────────────────
        if not force_refresh:
            cached = _check_cache(db, ticker)
            if cached is not None:
                logger.info(f"Cache hit for {ticker} — skipping fetch")
                _log_run(db, run_id, ticker, "cached", started_at)
                return {**cached, "status": "cached", "run_id": run_id}

        # ── 2. Fetch raw OHLCV ─────────────────────────────────────────────────
        raw_records = _fetch_with_fallback(ticker, period)
        if not raw_records:
            raise ValueError(f"All sources returned empty data for {ticker}")

        # ── 3. Clean ───────────────────────────────────────────────────────────
        cleaned = clean_ohlcv(raw_records)

        # ── 4. Validate ────────────────────────────────────────────────────────
        report = validate_ohlcv(cleaned, ticker)
        if not report.passed:
            logger.error(f"Validation failed for {ticker}: {report.issues}")
            _log_run(db, run_id, ticker, "validation_failed", started_at, error=str(report.issues))
            return {"ticker": ticker, "status": "failed", "validation": report.to_dict(), "run_id": run_id}

        # ── 5. Upsert OHLCV to MongoDB ─────────────────────────────────────────
        _upsert_ohlcv(db, cleaned)

        # ── 6. Compute indicators ──────────────────────────────────────────────
        df = None
        if compute_indicators:
            df = compute_all_indicators(cleaned)
            indicator_records = to_indicator_records(df)
            _upsert_indicators(db, indicator_records)

            # Also store normalised version for backtest engine
            df = normalise_for_backtest(df)

        # ── 7. Upsert metadata ─────────────────────────────────────────────────
        meta = fetch_ticker_metadata(ticker)
        db.ticker_metadata.update_one(
            {"ticker": ticker}, {"$set": meta}, upsert=True
        )

        result = {
            "ticker": ticker,
            "status": "success",
            "record_count": len(cleaned),
            "date_range": [report.date_range[0], report.date_range[1]],
            "validation": report.to_dict(),
            "run_id": run_id,
            "dataframe": df,
        }
        _log_run(db, run_id, ticker, "success", started_at, record_count=len(cleaned))
        return result

    except Exception as e:
        logger.error(f"Pipeline failed for {ticker}: {e}")
        _log_run(db, run_id, ticker, "failed", started_at, error=str(e))
        return {"ticker": ticker, "status": "failed", "error": str(e), "run_id": run_id}


def run_bulk_pipeline(tickers: list[str], period: str = "5y") -> dict[str, dict]:
    """
    Run pipeline for multiple tickers. Uses bulk yfinance download where possible.
    Returns {ticker: pipeline_result}.
    """
    logger.info(f"Bulk pipeline start: {len(tickers)} tickers")

    # Separate crypto from equities (different sources)
    equity_tickers = [t for t in tickers if t.upper().split("-")[0] not in CRYPTO_TICKERS]
    crypto_tickers = [t for t in tickers if t.upper().split("-")[0] in CRYPTO_TICKERS]

    results = {}

    # Bulk fetch equities
    if equity_tickers:
        bulk_raw = fetch_bulk_ohlcv(equity_tickers, period=period)
        for ticker, raw in bulk_raw.items():
            if raw:
                db = get_db()
                cleaned = clean_ohlcv(raw)
                report  = validate_ohlcv(cleaned, ticker)
                if report.passed:
                    _upsert_ohlcv(db, cleaned)
                    df = compute_all_indicators(cleaned)
                    _upsert_indicators(db, to_indicator_records(df))
                    df = normalise_for_backtest(df)
                    results[ticker] = {"ticker": ticker, "status": "success",
                                       "record_count": len(cleaned),
                                       "dataframe": df, "validation": report.to_dict()}
                else:
                    results[ticker] = {"ticker": ticker, "status": "failed",
                                       "validation": report.to_dict()}
            else:
                results[ticker] = {"ticker": ticker, "status": "failed", "error": "Empty source data"}

    # Individual fetch for crypto
    for ticker in crypto_tickers:
        results[ticker] = run_pipeline(ticker, period=period)

    return results


def get_dataframe(ticker: str, start: Optional[str] = None, end: Optional[str] = None) -> pd.DataFrame:
    """
    Retrieve an enriched DataFrame from MongoDB (no re-fetch).
    Used by the backtest engine after pipeline has run.
    """
    db = get_db()
    query = {"ticker": ticker.upper()}
    if start:
        query["date"] = {"$gte": pd.Timestamp(start, tz="UTC").to_pydatetime()}
    if end:
        query.setdefault("date", {})["$lte"] = pd.Timestamp(end, tz="UTC").to_pydatetime()

    ohlcv = list(db.ohlcv.find(query, {"_id": 0}).sort("date", 1))
    if not ohlcv:
        return pd.DataFrame()

    df = pd.DataFrame(ohlcv)

    # Merge indicators
    indicator_docs = list(db.indicators.find({"ticker": ticker.upper()}, {"_id": 0}))
    if indicator_docs:
        ind_df = pd.DataFrame(indicator_docs).pivot_table(
            index="date", columns="indicator", values="value", aggfunc="last"
        ).reset_index()
        df["date"] = pd.to_datetime(df["date"], utc=True)
        ind_df["date"] = pd.to_datetime(ind_df["date"], utc=True)
        df = df.merge(ind_df, on="date", how="left")

    return df.sort_values("date").reset_index(drop=True)


def run_macro_pipeline(series_ids: Optional[list[str]] = None) -> dict:
    """Fetch and store FRED macro data."""
    db = get_db()
    if series_ids:
        data = {s: fetch_series(s) for s in series_ids}
    else:
        data = fetch_all_macro()

    total = 0
    for series_id, records in data.items():
        if records:
            for r in records:
                db.macro_data.update_one(
                    {"series_id": r["series_id"], "date": r["date"]},
                    {"$set": r}, upsert=True
                )
            total += len(records)

    logger.info(f"Macro pipeline: upserted {total} records for {len(data)} series")
    return {"status": "success", "series_count": len(data), "record_count": total}


# ── Internal helpers ──────────────────────────────────────────────────────────

def _fetch_with_fallback(ticker: str, period: str) -> list[dict]:
    """Try yfinance first; fall back to CoinGecko for crypto."""
    base = ticker.upper().split("-")[0]
    if base in CRYPTO_TICKERS:
        records = cg_fetch(ticker, days=365)
        if not records:
            records = yf_fetch(ticker + "-USD" if not ticker.endswith("-USD") else ticker, period=period)
    else:
        records = yf_fetch(ticker, period=period)
    return records


def _check_cache(db, ticker: str, max_age_hours: int = 24) -> Optional[dict]:
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    latest = db.ohlcv.find_one(
        {"ticker": ticker.upper(), "fetched_at": {"$gte": cutoff}},
        sort=[("date", -1)]
    )
    if latest:
        return {"ticker": ticker, "record_count": None, "dataframe": None}
    return None


def _upsert_ohlcv(db, records: list[dict]):
    for r in records:
        db.ohlcv.update_one(
            {"ticker": r["ticker"], "date": r["date"]},
            {"$set": r}, upsert=True
        )


def _upsert_indicators(db, records: list[dict]):
    for r in records:
        db.indicators.update_one(
            {"ticker": r["ticker"], "indicator": r["indicator"], "date": r["date"]},
            {"$set": r}, upsert=True
        )


def _log_run(db, run_id, ticker, status, started_at, error=None, record_count=None):
    db.pipeline_runs.update_one(
        {"run_id": run_id},
        {"$set": {
            "run_id": run_id,
            "ticker": ticker,
            "status": status,
            "started_at": started_at,
            "updated_at": datetime.now(timezone.utc),
            "error": error,
            "record_count": record_count,
        }},
        upsert=True
    )