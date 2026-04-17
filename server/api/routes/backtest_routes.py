"""
api/routes/backtest_routes.py
──────────────────────────────
Backtest endpoints that consume the parser's DSL output.

POST /api/backtest/run        — run a backtest from DSL
GET  /api/backtest/<id>       — fetch saved result
GET  /api/backtest/results    — list all results
POST /api/backtest/indicators — compute + preview indicators for a ticker
"""

import sys
import os
from pathlib import Path

# Add server root to path for imports
server_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(server_root))

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import pandas as pd
import threading
import uuid
import logging

try:
    from backtest_engine.dsl_engine import run_dsl_backtest
except ImportError:
    # Provide a stub if backtest_engine doesn't exist yet
    def run_dsl_backtest(*args, **kwargs):
        raise NotImplementedError("Backtest engine not implemented yet")

from config.database import get_db
from utils.serializer import serialize_doc, serialize_docs

logger = logging.getLogger(__name__)

backtest_bp = Blueprint("backtest", __name__, url_prefix="/api/backtest")


def _resp(data=None, error=None, status=200, meta=None):
    return jsonify({
        "success": error is None,
        "data":    data,
        "error":   error,
        "meta":    meta or {},
    }), status


# ── Run backtest ───────────────────────────────────────────────────────────────

@backtest_bp.post("/run")
def run():
    """
    POST /api/backtest/run
    Body:  the full DSL object from the parser, or wrapped in {"dsl": {...}}
    """
    body = request.get_json(silent=True) or {}
    print(f"[BACKTEST] Request body: {body}")

    # Accept either a raw DSL or a wrapped {"dsl": {...}} shape
    dsl = body.get("dsl") or body
    print(f"[BACKTEST] DSL extracted: {dsl}")
    print(f"[BACKTEST] Ticker value: {dsl.get('ticker')}")

    if not dsl.get("ticker"):
        print(f"[BACKTEST] ERROR: ticker is missing or empty")
        return _resp(error="'ticker' is required in the DSL", status=400)
    if not dsl.get("entry_conditions"):
        return _resp(error="'entry_conditions' is required in the DSL", status=400)
    if not dsl.get("exit_conditions"):
        return _resp(error="'exit_conditions' is required in the DSL", status=400)

    # Generate a result_id and queue the backtest in a background thread so the HTTP
    # request returns immediately instead of blocking for the full backtest.
    result_id = str(uuid.uuid4())

    db = get_db()
    # Insert placeholder record so clients can poll immediately
    db.backtest_results.update_one(
        {"result_id": result_id},
        {"$set": {"result_id": result_id, "status": "queued", "dsl": dsl, "queued_at": datetime.now(timezone.utc)}},
        upsert=True,
    )

    def _worker(dsl_obj, rid):
        try:
            logger.info(f"Starting background backtest {rid} for {dsl_obj.get('ticker')}")
            res = run_dsl_backtest(dsl_obj, result_id=rid)
            # Save final result
            db = get_db()
            db.backtest_results.update_one(
                {"result_id": rid},
                {"$set": {**res, "saved_at": datetime.now(timezone.utc), "dsl": dsl_obj}},
                upsert=True,
            )
            logger.info(f"Background backtest {rid} finished: success={res.get('success')}")
        except Exception as e:
            logger.exception(f"Background backtest {rid} failed: {e}")
            db = get_db()
            db.backtest_results.update_one(
                {"result_id": rid},
                {"$set": {"result_id": rid, "status": "failed", "error": str(e), "finished_at": datetime.now(timezone.utc)}},
                upsert=True,
            )

    thread = threading.Thread(target=_worker, args=(dsl, result_id), daemon=True)
    thread.start()

    return _resp(
        data={"status": "queued"},
        meta={"ticker": dsl.get("ticker"), "result_id": result_id},
    )


# ── Indicator preview ──────────────────────────────────────────────────────────

@backtest_bp.post("/indicators/preview")
def preview_indicators():
    """
    POST /api/backtest/indicators/preview
    Body: {
            "ticker": "INFY.NS",
      "indicators": [{"name": "RSI", "period": 14}, {"name": "SMA", "period": 50}],
      "limit": 30
    }

    Returns the last N bars with indicator values computed.
    Useful for the frontend to verify indicators before running backtest.
    """
    body    = request.get_json(silent=True) or {}
    ticker  = body.get("ticker", "").upper()
    inds    = body.get("indicators", [])
    limit   = min(int(body.get("limit", 30)), 200)

    if not ticker:
        return _resp(error="'ticker' is required", status=400)

    db   = get_db()
    docs = list(db.ohlcv.find({"ticker": ticker}, {"_id": 0}).sort("date", 1))

    if not docs:
        return _resp(
            error=f"No data for '{ticker}'. Run POST /api/data/fetch first.",
            status=404,
        )

    from backtest_engine.indicator_engine import compute_indicators
    df = pd.DataFrame(docs)
    df.columns = [c.lower() for c in df.columns]
    df = compute_indicators(df, inds)

    # Return last `limit` rows
    df_tail = df.tail(limit).copy()

    # Serialise
    rows = []
    for _, row in df_tail.iterrows():
        r = {}
        for col in df_tail.columns:
            val = row[col]
            if pd.isna(val) if not isinstance(val, (str, datetime)) else False:
                r[col] = None
            elif hasattr(val, "isoformat"):
                r[col] = val.isoformat()[:10]
            elif isinstance(val, float):
                import math
                r[col] = None if math.isnan(val) or math.isinf(val) else round(val, 4)
            else:
                try:
                    r[col] = float(val)
                except Exception:
                    r[col] = str(val)
        rows.append(r)

    return _resp(data=rows, meta={"ticker": ticker, "rows": len(rows), "indicators_computed": [i.get("name") for i in inds]})


# ── Fetch saved result ─────────────────────────────────────────────────────────

@backtest_bp.get("/<result_id>")
def get_result(result_id: str):
    """GET /api/backtest/<result_id>"""
    db  = get_db()
    doc = db.backtest_results.find_one({"result_id": result_id}, {"_id": 0})
    if not doc:
        return _resp(error=f"No result found for id '{result_id}'", status=404)
    return _resp(data=serialize_doc(doc))


# ── List all results ───────────────────────────────────────────────────────────

@backtest_bp.get("/results")
def list_results():
    """
    GET /api/backtest/results?ticker=INFY.NS&limit=20
    Returns all saved backtest results (without equity curve / trades for speed).
    """
    db     = get_db()
    ticker = request.args.get("ticker", "").upper()
    limit  = min(int(request.args.get("limit", 20)), 100)

    query = {}
    if ticker:
        query["ticker"] = ticker

    docs = list(
        db.backtest_results.find(query, {"_id": 0, "equity_curve": 0, "trades": 0})
                            .sort("saved_at", -1)
                            .limit(limit)
    )
    return _resp(data=serialize_docs(docs), meta={"count": len(docs)})