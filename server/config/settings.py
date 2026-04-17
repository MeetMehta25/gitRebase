import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "backtest_platform")

    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # API Keys
    FRED_API_KEY = os.getenv("FRED_API_KEY", "")
    ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")

    # Pipeline config
    CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", 3600))
    OHLCV_DEFAULT_PERIOD = os.getenv("OHLCV_DEFAULT_PERIOD", "5y")
    MAX_TICKERS_PER_REQUEST = int(os.getenv("MAX_TICKERS_PER_REQUEST", 50))

    # Rate limits (requests per minute)
    RATE_LIMITS = {
        "yfinance": int(os.getenv("YFINANCE_RATE_LIMIT_PER_MIN", 60)),
        "alpha_vantage": int(os.getenv("AV_RATE_LIMIT_PER_MIN", 5)),
        "coingecko": int(os.getenv("COINGECKO_RATE_LIMIT_PER_MIN", 50)),
    }