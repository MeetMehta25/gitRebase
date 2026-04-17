"""
test_data_pull.py
─────────────────
Run this BEFORE starting Flask to verify:
  1. MongoDB Atlas connection works
  2. yfinance pulls OHLCV data correctly
  3. CoinGecko pulls crypto data
  4. FRED pulls macro data (only if you have a key)
  5. All data lands in MongoDB with the right shape

Usage:
  cd server
  python test_data_pull.py

Expected output: green checkmarks for each step.
No Flask, no Redis, no Celery — just pure data pipeline smoke test.
"""

import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# ─── Colour helpers ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
RESET  = "\033[0m"

def ok(msg):    print(f"  {GREEN}✓{RESET} {msg}")
def fail(msg):  print(f"  {RED}✗ {msg}{RESET}")
def warn(msg):  print(f"  {YELLOW}⚠ {msg}{RESET}")
def section(msg): print(f"\n{BLUE}{'─'*50}\n  {msg}\n{'─'*50}{RESET}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1 — MongoDB connection
# ══════════════════════════════════════════════════════════════════════════════
section("STEP 1 — MongoDB connection")

MONGO_URI    = os.getenv("MONGO_URI", "")
print(f"  Testing connection to MongoDB at: {MONGO_URI}")
MONGO_DB     = os.getenv("MONGO_DB_NAME", "backtest_platform")

if not MONGO_URI or MONGO_URI == "mongodb://localhost:27017":
    fail("MONGO_URI is not set or still points to localhost.")
    print("       → Open your .env file and paste your Atlas connection string.")
    print("       → It should look like:")
    print("         mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/")
    sys.exit(1)

try:
    from pymongo import MongoClient
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
    client.admin.command("ping")
    db = client[MONGO_DB]
    ok(f"MongoDB connected → database: '{MONGO_DB}'")
    ok(f"Collections available: {db.list_collection_names() or '(none yet — will be created)'}")
except Exception as e:
    fail(f"MongoDB connection failed: {e}")
    print("\n  Common fixes:")
    print("  • Make sure your IP is whitelisted in Atlas → Network Access")
    print("  • Check the username/password in the connection string")
    print("  • Ensure the cluster is not paused (free tier pauses after inactivity)")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════════
# STEP 2 — yfinance (no key needed)
# ══════════════════════════════════════════════════════════════════════════════
section("STEP 2 — yfinance data pull (NSE equities)")

try:
    import yfinance as yf

    TEST_TICKER = os.getenv("TEST_TICKER", "RELIANCE.NS")
    print(f"  Pulling {TEST_TICKER} — 6 months daily OHLCV...")
    ticker_obj = yf.Ticker(TEST_TICKER)
    df = ticker_obj.history(period="6mo", interval="1d", auto_adjust=False, progress=False)

    if df.empty:
        fail(f"yfinance returned empty DataFrame for {TEST_TICKER}")
        print("  → This is usually a temporary yfinance rate-limit. Wait 60s and retry.")
    else:
        ok(f"yfinance pulled {len(df)} rows for {TEST_TICKER}")
        ok(f"Date range: {str(df.index[0])[:10]} → {str(df.index[-1])[:10]}")
        ok(f"Columns: {list(df.columns)}")

        # Write to MongoDB
        records = []
        for ts, row in df.iterrows():
            records.append({
                "ticker":     TEST_TICKER,
                "date":       ts.to_pydatetime(),
                "open":       round(float(row.get("Open", 0)), 6),
                "high":       round(float(row.get("High", 0)), 6),
                "low":        round(float(row.get("Low", 0)), 6),
                "close":      round(float(row.get("Close", 0)), 6),
                "adj_close":  round(float(row.get("Adj Close", row.get("Close", 0))), 6),
                "volume":     int(row.get("Volume", 0)),
                "asset_class": "equity",
                "source":     "yfinance",
                "fetched_at": datetime.now(timezone.utc),
            })

        for r in records:
            db.ohlcv.update_one(
                {"ticker": r["ticker"], "date": r["date"]},
                {"$set": r},
                upsert=True
            )

        count = db.ohlcv.count_documents({"ticker": TEST_TICKER})
        ok(f"MongoDB upsert done → {count} documents in ohlcv collection for {TEST_TICKER}")

except ImportError:
    fail("yfinance not installed. Run: pip install yfinance")
except Exception as e:
    fail(f"yfinance failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 3 — Multiple equity tickers (bulk pull)
# ══════════════════════════════════════════════════════════════════════════════
section("STEP 3 — Bulk equity pull (INFY.NS, TCS.NS, HDFCBANK.NS)")

try:
    BULK_TICKERS = ["INFY.NS", "TCS.NS", "HDFCBANK.NS"]
    print(f"  Pulling {BULK_TICKERS} — 1 year daily...")

    import yfinance as yf
    raw = yf.download(
        " ".join(BULK_TICKERS),
        period="1y",
        interval="1d",
        auto_adjust=False,
        progress=False,
        group_by="ticker"
    )

    for ticker in BULK_TICKERS:
        try:
            df_t = raw[ticker].dropna(how="all")
            records = []
            for ts, row in df_t.iterrows():
                records.append({
                    "ticker":     ticker,
                    "date":       ts.to_pydatetime(),
                    "open":       round(float(row.get("Open", 0)), 6),
                    "high":       round(float(row.get("High", 0)), 6),
                    "low":        round(float(row.get("Low", 0)), 6),
                    "close":      round(float(row.get("Close", 0)), 6),
                    "adj_close":  round(float(row.get("Adj Close", row.get("Close", 0))), 6),
                    "volume":     int(row.get("Volume", 0)),
                    "asset_class": "equity",
                    "source":     "yfinance",
                    "fetched_at": datetime.now(timezone.utc),
                })
            for r in records:
                db.ohlcv.update_one(
                    {"ticker": r["ticker"], "date": r["date"]},
                    {"$set": r}, upsert=True
                )
            ok(f"{ticker}: {len(records)} rows → MongoDB")
        except Exception as te:
            warn(f"{ticker} failed: {te}")

except Exception as e:
    fail(f"Bulk pull failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 4 — CoinGecko crypto (no key needed)
# ══════════════════════════════════════════════════════════════════════════════
section("STEP 4 — CoinGecko crypto pull (BTC)")

try:
    from pycoingecko import CoinGeckoAPI
    cg = CoinGeckoAPI()

    print("  Pulling BTC/USD — 90 days from CoinGecko...")
    raw = cg.get_coin_ohlc_by_id(id="bitcoin", vs_currency="usd", days="90")

    if not raw:
        warn("CoinGecko returned empty data")
    else:
        records = []
        for candle in raw:
            ts_ms, o, h, l, c = candle
            records.append({
                "ticker":     "BTC-USD",
                "date":       datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc),
                "open":       round(float(o), 4),
                "high":       round(float(h), 4),
                "low":        round(float(l), 4),
                "close":      round(float(c), 4),
                "adj_close":  round(float(c), 4),
                "volume":     0,
                "asset_class": "crypto",
                "source":     "coingecko",
                "fetched_at": datetime.now(timezone.utc),
            })

        for r in records:
            db.ohlcv.update_one(
                {"ticker": r["ticker"], "date": r["date"]},
                {"$set": r}, upsert=True
            )
        ok(f"CoinGecko BTC: {len(records)} candles → MongoDB")

except ImportError:
    fail("pycoingecko not installed. Run: pip install pycoingecko")
except Exception as e:
    fail(f"CoinGecko failed: {e}")
    warn("CoinGecko rate limits aggressively. If you see a 429, wait 60s and retry.")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 5 — FRED macro data (needs free key)
# ══════════════════════════════════════════════════════════════════════════════
section("STEP 5 — FRED macro data (VIX, yield curve)")

FRED_KEY = os.getenv("FRED_API_KEY", "")
if not FRED_KEY or FRED_KEY == "your_fred_key_here":
    warn("FRED_API_KEY not set — skipping macro pull")
    warn("Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html")
    warn("Takes 30 seconds to register. Add it to .env as FRED_API_KEY=xxx")
else:
    try:
        from fredapi import Fred
        fred = Fred(api_key=FRED_KEY)

        MACRO_SERIES = {
            "VIXCLS":   "CBOE VIX",
            "DGS10":    "10-Year Treasury Yield",
            "T10Y2Y":   "Yield Curve (10Y-2Y)",
            "UNRATE":   "Unemployment Rate",
            "CPIAUCSL": "CPI",
        }

        for series_id, name in MACRO_SERIES.items():
            try:
                import pandas as pd
                data = fred.get_series(series_id, observation_start="2010-01-01")
                data = data.dropna()
                records = [
                    {
                        "series_id":  series_id,
                        "name":       name,
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
                        {"$set": r}, upsert=True
                    )
                ok(f"FRED {series_id} ({name}): {len(records)} observations → MongoDB")
            except Exception as se:
                fail(f"FRED {series_id} failed: {se}")

    except ImportError:
        fail("fredapi not installed. Run: pip install fredapi")
    except Exception as e:
        fail(f"FRED connection failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Verify MongoDB state
# ══════════════════════════════════════════════════════════════════════════════
section("STEP 6 — MongoDB collection summary")

try:
    collections = ["ohlcv", "macro_data", "ticker_metadata"]
    for col in collections:
        count = db[col].count_documents({})
        if count > 0:
            # Sample one doc to show shape
            sample = db[col].find_one({}, {"_id": 0})
            ok(f"{col}: {count} documents. Sample keys: {list(sample.keys()) if sample else '?'}")
        else:
            warn(f"{col}: 0 documents (empty)")

    # Show tickers in ohlcv
    tickers_in_db = db.ohlcv.distinct("ticker")
    ok(f"Tickers in ohlcv collection: {tickers_in_db}")

    # Date range per ticker
    for ticker in tickers_in_db[:5]:
        first = db.ohlcv.find_one({"ticker": ticker}, sort=[("date", 1)])
        last  = db.ohlcv.find_one({"ticker": ticker}, sort=[("date", -1)])
        if first and last:
            ok(f"  {ticker}: {str(first['date'])[:10]} → {str(last['date'])[:10]}")

except Exception as e:
    fail(f"MongoDB summary failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# DONE
# ══════════════════════════════════════════════════════════════════════════════
print(f"\n{GREEN}{'═'*50}")
print("  All steps complete.")
print(f"  Open MongoDB Atlas → Browse Collections → backtest_platform")
print(f"  You should see: ohlcv, macro_data collections with real data.")
print(f"{'═'*50}{RESET}\n")