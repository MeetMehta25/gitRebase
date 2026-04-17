"""
run.py — start the Flask development server

Usage:
    cd server
    python run.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app

app = create_app()

if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"

    print(f"""
╔══════════════════════════════════════════════╗
║   Backtest Platform — Flask Server           ║
╠══════════════════════════════════════════════╣
║   http://localhost:{port}                       ║
║                                              ║
║   Key endpoints:                             ║
║   GET  /health                               ║
║   GET  /api/data/health                      ║
║   GET  /api/data/tickers                     ║
║   GET  /api/data/ohlcv/<ticker>              ║
║   POST /api/data/fetch                       ║
║   POST /api/data/fetch/bulk                  ║
╚══════════════════════════════════════════════╝
""")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=debug,
    )