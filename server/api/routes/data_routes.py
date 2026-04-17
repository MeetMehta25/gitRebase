"""
api/routes/data_routes.py
──────────────────────────
All data pipeline endpoints.
Response envelope: { success, data, error, meta }

Endpoints:
  POST /api/data/fetch              — pull + store single ticker
  POST /api/data/fetch/bulk         — pull + store multiple tickers
  GET  /api/data/ohlcv/<ticker>     — query stored OHLCV
  GET  /api/data/ohlcv/<ticker>/latest — latest bar only
  GET  /api/data/tickers            — list all tickers in DB
  GET  /api/data/indicators/<ticker>— all computed indicators
  GET  /api/data/meta/<ticker>      — ticker metadata
  POST /api/data/macro/fetch        — pull FRED macro series
  GET  /api/data/macro/<series_id>  — query stored macro
  GET  /api/data/runs               — pipeline run logs
  GET  /api/data/health             — data layer health check
"""

from flask import Blueprint, request, jsonify
from config.database import get_db
from utils.serializer import serialize_doc, serialize_docs
import yfinance as yf
import pandas as pd
from datetime import datetime, timezone
import uuid

data_bp = Blueprint("data", __name__, url_prefix="/api/data")


# ── Response helper ────────────────────────────────────────────────────────────

def _resp(data=None, error=None, status=200, meta=None):
    return jsonify({
        "success": error is None,
        "data":    data,
        "error":   error,
        "meta":    meta or {},
    }), status


# ── Health ─────────────────────────────────────────────────────────────────────

@data_bp.get("/health")
def data_health():
    """GET /api/data/health — quick check: DB up + doc counts."""
    db = get_db()
    try:
        collections = {
            col: db[col].count_documents({})
            for col in ["ohlcv", "indicators", "macro_data",
                        "ticker_metadata", "pipeline_runs"]
        }
        tickers = db.ohlcv.distinct("ticker")
        return _resp(data={
            "db_connected":  True,
            "collections":   collections,
            "tickers_in_db": tickers,
        })
    except Exception as e:
        return _resp(error=str(e), status=500)


# ── List tickers ───────────────────────────────────────────────────────────────

@data_bp.get("/tickers")
def list_tickers():
    """
    GET /api/data/tickers?asset_class=equity
    Returns all tickers stored in ohlcv collection with their stats.
    """
    db = get_db()
    asset_class = request.args.get("asset_class")

    match = {}
    if asset_class:
        match["asset_class"] = asset_class.lower()

    pipeline = [
        {"$match": match} if match else {"$match": {}},
        {"$group": {
            "_id":        "$ticker",
            "asset_class": {"$first": "$asset_class"},
            "count":      {"$sum": 1},
            "first_date": {"$min": "$date"},
            "last_date":  {"$max": "$date"},
            "source":     {"$first": "$source"},
        }},
        {"$sort": {"_id": 1}},
    ]

    docs = list(db.ohlcv.aggregate(pipeline))
    result = [
        {
            "ticker":      d["_id"],
            "asset_class": d.get("asset_class", "unknown"),
            "bar_count":   d["count"],
            "first_date":  d["first_date"].isoformat() if d.get("first_date") else None,
            "last_date":   d["last_date"].isoformat()  if d.get("last_date")  else None,
            "source":      d.get("source", ""),
        }
        for d in docs
    ]
    return _resp(data=result, meta={"total": len(result)})


# ── OHLCV query ────────────────────────────────────────────────────────────────

@data_bp.get("/ohlcv/<ticker>")
def get_ohlcv(ticker: str):
    """
    GET /api/data/ohlcv/INFY.NS
    GET /api/data/ohlcv/INFY.NS?start=2024-01-01&end=2024-12-31
    GET /api/data/ohlcv/INFY.NS?limit=100
    Returns sorted OHLCV bars for a ticker.
    """
    db    = get_db()
    start = request.args.get("start")
    end   = request.args.get("end")
    limit = min(int(request.args.get("limit", 500)), 5000)

    query = {"ticker": ticker.upper()}
    date_filter = {}
    if start:
        date_filter["$gte"] = pd.Timestamp(start, tz="UTC").to_pydatetime()
    if end:
        date_filter["$lte"] = pd.Timestamp(end, tz="UTC").to_pydatetime()
    if date_filter:
        query["date"] = date_filter

    docs = list(
        db.ohlcv.find(query, {"_id": 0})
                .sort("date", 1)
                .limit(limit)
    )

    if not docs:
        return _resp(
            error=f"No data for '{ticker.upper()}'. "
                  f"Run POST /api/data/fetch with ticker='{ticker.upper()}' first.",
            status=404,
        )

    return _resp(
        data=serialize_docs(docs),
        meta={
            "ticker":     ticker.upper(),
            "count":      len(docs),
            "first_date": docs[0]["date"].isoformat()  if docs else None,
            "last_date":  docs[-1]["date"].isoformat() if docs else None,
        },
    )


@data_bp.get("/ohlcv/<ticker>/latest")
def get_ohlcv_latest(ticker: str):
    """GET /api/data/ohlcv/INFY.NS/latest — most recent bar."""
    db  = get_db()
    doc = db.ohlcv.find_one({"ticker": ticker.upper()}, {"_id": 0}, sort=[("date", -1)])
    if not doc:
        return _resp(error=f"No data for '{ticker.upper()}'", status=404)
    return _resp(data=serialize_doc(doc))


# ── Single ticker fetch (pull → store) ────────────────────────────────────────

@data_bp.post("/fetch")
def fetch_ticker():
    """
    POST /api/data/fetch
    Body: { "ticker": "RELIANCE.NS", "period": "1y", "force_refresh": false }

    Pulls OHLCV from yfinance → stores in MongoDB.
    Returns summary of what was written.
    """
    body   = request.get_json(silent=True) or {}
    ticker = body.get("ticker", "").upper().strip()
    period = body.get("period", "1y")
    force  = body.get("force_refresh", False)

    if not ticker:
        return _resp(error="'ticker' is required", status=400)

    db = get_db()

    # Cache check — skip fetch if recent data exists and force=False
    if not force:
        existing_count = db.ohlcv.count_documents({"ticker": ticker})
        if existing_count > 0:
            latest = db.ohlcv.find_one({"ticker": ticker}, sort=[("date", -1)])
            days_old = (datetime.now(timezone.utc) - latest["date"].replace(tzinfo=timezone.utc)).days
            if days_old <= 1:
                return _resp(
                    data={"status": "cached", "ticker": ticker,
                          "record_count": existing_count,
                          "last_date": latest["date"].isoformat()},
                    meta={"cached": True},
                )

    run_id     = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc)

    try:
        tkr = yf.Ticker(ticker)

        # Handle both old and new yfinance API
        try:
            df = tkr.history(period=period, interval="1d", auto_adjust=False, progress=False)
        except TypeError:
            df = tkr.history(period=period, interval="1d", auto_adjust=False)

        if df.empty:
            return _resp(error=f"yfinance returned no data for '{ticker}'", status=422)

        df.index = pd.to_datetime(df.index, utc=True)
        fetched_at = datetime.now(timezone.utc)

        # Detect asset class
        asset_class = _detect_asset_class(ticker)

        records = []
        for ts, row in df.iterrows():
            records.append({
                "ticker":     ticker,
                "date":       ts.to_pydatetime(),
                "open":       _safe_float(row.get("Open")),
                "high":       _safe_float(row.get("High")),
                "low":        _safe_float(row.get("Low")),
                "close":      _safe_float(row.get("Close")),
                "adj_close":  _safe_float(row.get("Adj Close", row.get("Close"))),
                "volume":     int(row.get("Volume", 0) or 0),
                "asset_class": asset_class,
                "source":     "yfinance",
                "fetched_at": fetched_at,
            })

        # Upsert all records
        upserted = 0
        for r in records:
            result = db.ohlcv.update_one(
                {"ticker": r["ticker"], "date": r["date"]},
                {"$set": r},
                upsert=True,
            )
            if result.upserted_id or result.modified_count:
                upserted += 1

        # Log the run
        db.pipeline_runs.insert_one({
            "run_id":       run_id,
            "ticker":       ticker,
            "status":       "success",
            "record_count": len(records),
            "upserted":     upserted,
            "period":       period,
            "started_at":   started_at,
            "finished_at":  datetime.now(timezone.utc),
        })

        return _resp(data={
            "status":       "success",
            "ticker":       ticker,
            "period":       period,
            "record_count": len(records),
            "upserted":     upserted,
            "first_date":   records[0]["date"].isoformat()  if records else None,
            "last_date":    records[-1]["date"].isoformat() if records else None,
            "run_id":       run_id,
        })

    except Exception as e:
        db.pipeline_runs.insert_one({
            "run_id":     run_id,
            "ticker":     ticker,
            "status":     "failed",
            "error":      str(e),
            "started_at": started_at,
            "finished_at": datetime.now(timezone.utc),
        })
        return _resp(error=f"Fetch failed for '{ticker}': {str(e)}", status=500)


# ── Bulk fetch ─────────────────────────────────────────────────────────────────

@data_bp.post("/fetch/bulk")
def fetch_bulk():
    """
    POST /api/data/fetch/bulk
    Body: { "tickers": ["RELIANCE.NS", "INFY.NS", "TCS.NS"], "period": "2y" }

    Uses yfinance bulk download (one HTTP call for all tickers).
    """
    body    = request.get_json(silent=True) or {}
    tickers = [t.upper().strip() for t in body.get("tickers", []) if t.strip()]
    period  = body.get("period", "1y")

    if not tickers:
        return _resp(error="'tickers' array is required", status=400)
    if len(tickers) > 50:
        return _resp(error="Maximum 50 tickers per bulk request", status=400)

    db = get_db()
    results = {}

    try:
        # yfinance bulk download — one call for all tickers
        try:
            raw = yf.download(
                tickers=" ".join(tickers),
                period=period,
                interval="1d",
                auto_adjust=False,
                group_by="ticker",
                progress=False,
            )
        except TypeError:
            raw = yf.download(
                tickers=" ".join(tickers),
                period=period,
                interval="1d",
                auto_adjust=False,
                group_by="ticker",
            )

        fetched_at = datetime.now(timezone.utc)

        for ticker in tickers:
            try:
                # Single ticker download has flat columns; multi has MultiIndex
                df = raw[ticker].dropna(how="all") if len(tickers) > 1 else raw.dropna(how="all")
                df.index = pd.to_datetime(df.index, utc=True)
                asset_class = _detect_asset_class(ticker)

                records = []
                for ts, row in df.iterrows():
                    records.append({
                        "ticker":      ticker,
                        "date":        ts.to_pydatetime(),
                        "open":        _safe_float(row.get("Open")),
                        "high":        _safe_float(row.get("High")),
                        "low":         _safe_float(row.get("Low")),
                        "close":       _safe_float(row.get("Close")),
                        "adj_close":   _safe_float(row.get("Adj Close", row.get("Close"))),
                        "volume":      int(row.get("Volume", 0) or 0),
                        "asset_class": asset_class,
                        "source":      "yfinance",
                        "fetched_at":  fetched_at,
                    })

                for r in records:
                    db.ohlcv.update_one(
                        {"ticker": r["ticker"], "date": r["date"]},
                        {"$set": r}, upsert=True,
                    )

                results[ticker] = {"status": "success", "record_count": len(records)}

            except Exception as te:
                results[ticker] = {"status": "failed", "error": str(te)}

    except Exception as e:
        return _resp(error=f"Bulk download failed: {str(e)}", status=500)

    success_count = sum(1 for r in results.values() if r["status"] == "success")
    return _resp(
        data=results,
        meta={"total": len(tickers), "success": success_count, "failed": len(tickers) - success_count},
    )


# ── Indicators ─────────────────────────────────────────────────────────────────

@data_bp.get("/indicators/<ticker>")
def get_indicators(ticker: str):
    """
    GET /api/data/indicators/INFY.NS
    GET /api/data/indicators/INFY.NS?date=2024-06-01

    Returns all computed indicator values (pivoted to flat dict).
    These are populated after running the compute_indicators pipeline step.
    """
    db   = get_db()
    date = request.args.get("date")

    query = {"ticker": ticker.upper()}
    if date:
        query["date"] = pd.Timestamp(date, tz="UTC").to_pydatetime()
        docs = list(db.indicators.find(query, {"_id": 0}).limit(200))
    else:
        # Get latest date's indicators
        latest = db.indicators.find_one({"ticker": ticker.upper()}, sort=[("date", -1)])
        if not latest:
            return _resp(
                error=f"No indicators for '{ticker.upper()}'. "
                      f"Indicators are computed after the full pipeline runs.",
                status=404,
            )
        query["date"] = latest["date"]
        docs = list(db.indicators.find(query, {"_id": 0}).limit(200))

    if not docs:
        return _resp(error=f"No indicators for '{ticker.upper()}'", status=404)

    snapshot = {d["indicator"]: d["value"] for d in docs}
    date_val = docs[0]["date"]
    return _resp(
        data=snapshot,
        meta={
            "ticker": ticker.upper(),
            "date":   date_val.isoformat() if hasattr(date_val, "isoformat") else str(date_val),
            "count":  len(snapshot),
        },
    )


# ── Ticker metadata ────────────────────────────────────────────────────────────

@data_bp.get("/meta/<ticker>")
def get_metadata(ticker: str):
    """
    GET /api/data/meta/INFY.NS
    Returns sector, industry, market cap, currency etc.
    Populated automatically when fetch is called.
    """
    db  = get_db()
    doc = db.ticker_metadata.find_one({"ticker": ticker.upper()}, {"_id": 0})
    if not doc:
        # Try to fetch on-demand from yfinance
        try:
            info = yf.Ticker(ticker).info
            doc = {
                "ticker":      ticker.upper(),
                "name":        info.get("longName") or info.get("shortName", ""),
                "sector":      info.get("sector", ""),
                "industry":    info.get("industry", ""),
                "market_cap":  info.get("marketCap"),
                "currency":    info.get("currency", "USD"),
                "exchange":    info.get("exchange", ""),
                "asset_class": _detect_asset_class(ticker),
                "country":     info.get("country", ""),
                "source":      "yfinance",
                "fetched_at":  datetime.now(timezone.utc),
            }
            db.ticker_metadata.update_one(
                {"ticker": ticker.upper()}, {"$set": doc}, upsert=True
            )
        except Exception as e:
            return _resp(error=f"No metadata for '{ticker.upper()}': {e}", status=404)

    return _resp(data=serialize_doc(doc))


# ── Macro data (FRED) ──────────────────────────────────────────────────────────

@data_bp.post("/macro/fetch")
def fetch_macro():
    """
    POST /api/data/macro/fetch
    Body: { "series_ids": ["VIXCLS", "DGS10"] }  — omit to fetch all defaults

    Requires FRED_API_KEY in .env
    """
    try:
        from fredapi import Fred
        import os
        fred_key = os.getenv("FRED_API_KEY", "")
        if not fred_key or fred_key == "your_fred_key_here":
            return _resp(
                error="FRED_API_KEY not configured. "
                      "Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html",
                status=422,
            )

        MACRO_SERIES = {
            "VIXCLS":       "CBOE VIX",
            "DGS10":        "10-Year Treasury Yield",
            "DGS2":         "2-Year Treasury Yield",
            "T10Y2Y":       "Yield Curve Spread (10Y-2Y)",
            "CPIAUCSL":     "CPI (All Urban)",
            "UNRATE":       "Unemployment Rate",
            "FEDFUNDS":     "Federal Funds Rate",
            "DCOILWTICO":   "WTI Crude Oil",
        }

        body       = request.get_json(silent=True) or {}
        series_ids = body.get("series_ids") or list(MACRO_SERIES.keys())
        start      = body.get("start", "2010-01-01")

        fred = Fred(api_key=fred_key)
        db   = get_db()

        results = {}
        for series_id in series_ids:
            try:
                data = fred.get_series(series_id, observation_start=start).dropna()
                records = [
                    {
                        "series_id":  series_id,
                        "name":       MACRO_SERIES.get(series_id, series_id),
                        "date":       pd.Timestamp(date, tz="UTC").to_pydatetime(),
                        "value":      round(float(val), 6),
                        "source":     "fred",
                        "fetched_at": datetime.now(timezone.utc),
                    }
                    for date, val in data.items()
                ]
                for r in records:
                    db.macro_data.update_one(
                        {"series_id": r["series_id"], "date": r["date"]},
                        {"$set": r}, upsert=True,
                    )
                results[series_id] = {"status": "success", "record_count": len(records)}
            except Exception as se:
                results[series_id] = {"status": "failed", "error": str(se)}

        success = sum(1 for r in results.values() if r["status"] == "success")
        return _resp(data=results, meta={"series_fetched": success})

    except ImportError:
        return _resp(
            error="fredapi not installed. Run: pip install fredapi",
            status=500,
        )


@data_bp.get("/macro/<series_id>")
def get_macro(series_id: str):
    """
    GET /api/data/macro/VIXCLS
    GET /api/data/macro/VIXCLS?start=2020-01-01&limit=500
    """
    db    = get_db()
    start = request.args.get("start")
    limit = min(int(request.args.get("limit", 500)), 5000)

    query = {"series_id": series_id.upper()}
    if start:
        query["date"] = {"$gte": pd.Timestamp(start, tz="UTC").to_pydatetime()}

    docs = list(db.macro_data.find(query, {"_id": 0}).sort("date", 1).limit(limit))
    if not docs:
        return _resp(
            error=f"No data for series '{series_id.upper()}'. "
                  f"Run POST /api/data/macro/fetch first.",
            status=404,
        )

    return _resp(data=serialize_docs(docs), meta={"series_id": series_id.upper(), "count": len(docs)})


# ── Pipeline run logs ──────────────────────────────────────────────────────────

@data_bp.get("/runs")
def get_runs():
    """
    GET /api/data/runs
    GET /api/data/runs?ticker=RELIANCE.NS&status=success&limit=20
    """
    db     = get_db()
    ticker = request.args.get("ticker", "").upper()
    status = request.args.get("status")
    limit  = min(int(request.args.get("limit", 20)), 100)

    query = {}
    if ticker:
        query["ticker"] = ticker
    if status:
        query["status"] = status

    docs = list(db.pipeline_runs.find(query, {"_id": 0}).sort("started_at", -1).limit(limit))
    return _resp(data=serialize_docs(docs), meta={"count": len(docs)})


# ── Internal helpers ───────────────────────────────────────────────────────────

_CRYPTO_SUFFIXES = ("-USD", "-USDT", "-BTC", "-ETH")
_ETF_SET         = {"NIFTYBEES.NS", "BANKBEES.NS", "JUNIORBEES.NS", "GOLDBEES.NS", "ITBEES.NS", "INFRABEES.NS"}

def _detect_asset_class(ticker: str) -> str:
    t = ticker.upper()
    if any(t.endswith(s) for s in _CRYPTO_SUFFIXES): return "crypto"
    if t in _ETF_SET:                                 return "etf"
    if t.startswith("^"):                             return "index"
    if "=X" in t:                                     return "forex"
    return "equity"

def _safe_float(val) -> float:
    try:
        import math
        f = float(val)
        return round(f, 6) if not (math.isnan(f) or math.isinf(f)) else 0.0
    except (TypeError, ValueError):
        return 0.0