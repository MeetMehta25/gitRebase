"""
config/database.py
───────────────────
MongoDB connection + index setup.
Called once at app startup via init_db(app).
get_db() is imported everywhere else.
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure
import os

_client = None
_db     = None


def init_db(app):
    global _client, _db
    uri  = app.config.get("MONGO_URI", os.getenv("MONGO_URI", ""))
    name = app.config.get("MONGO_DB_NAME", os.getenv("MONGO_DB_NAME", "backtest_platform"))

    if not uri:
        raise RuntimeError("MONGO_URI is not set in .env")

    _client = MongoClient(uri, serverSelectionTimeoutMS=8000)
    try:
        _client.admin.command("ping")
    except ConnectionFailure as e:
        raise RuntimeError(f"MongoDB connection failed: {e}")

    _db = _client[name]
    _ensure_indexes()
    print(f"[db] MongoDB connected → {name}")


def get_db():
    if _db is None:
        raise RuntimeError("Database not initialised — call init_db() first")
    return _db


def _ensure_indexes():
    """
    Safe index creation — uses create_index which is idempotent.
    If an index already exists with the same name and options, it's a no-op.
    """
    db = _db

    def safe_index(collection, keys, **kwargs):
        try:
            db[collection].create_index(keys, **kwargs)
        except OperationFailure:
            pass   # index already exists with different options — skip

    # ohlcv — (ticker, date) is the primary lookup key
    safe_index("ohlcv", [("ticker", ASCENDING), ("date", ASCENDING)],
               unique=True, name="ticker_date_uq")
    safe_index("ohlcv", [("ticker", ASCENDING), ("date", DESCENDING)],
               name="ticker_date_desc")
    safe_index("ohlcv", [("asset_class", ASCENDING)],
               name="asset_class_idx")

    # indicators
    safe_index("indicators",
               [("ticker", ASCENDING), ("indicator", ASCENDING), ("date", ASCENDING)],
               unique=True, name="ticker_ind_date_uq")

    # macro_data
    safe_index("macro_data",
               [("series_id", ASCENDING), ("date", ASCENDING)],
               unique=True, name="series_date_uq")

    # ticker_metadata
    safe_index("ticker_metadata", [("ticker", ASCENDING)],
               unique=True, name="ticker_uq")

    # pipeline_runs
    safe_index("pipeline_runs", [("ticker", ASCENDING), ("started_at", DESCENDING)],
               name="runs_ticker_date")

    # strategies
    safe_index("strategies", [("strategy_id", ASCENDING)],
               unique=True, name="strategy_id_uq")
    safe_index("strategies", [("ticker", ASCENDING), ("created_at", DESCENDING)],
               name="ticker_created_desc")

    # adversarial_results
    safe_index("adversarial_results", [("adversarial_id", ASCENDING)],
               unique=True, name="adversarial_id_uq")
    safe_index("adversarial_results", [("original_strategy_id", ASCENDING)],
               name="orig_strategy_idx")
    safe_index("adversarial_results", [("ticker", ASCENDING), ("created_at", DESCENDING)],
               name="adv_ticker_created_desc")

    # strategies + backtest_results
    safe_index("strategies",       [("strategy_id", ASCENDING)], unique=True, name="strat_id_uq")
    safe_index("backtest_results", [("strategy_id", ASCENDING), ("epoch", ASCENDING)],
               name="result_strat_epoch")

    print("[db] Indexes ready")