# Hackanova5 — Complete Setup Requirements

## Quick Summary

This is a **trading strategy backtesting platform** with:
- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Python Flask (port 5000)
- **Database**: MongoDB
- **AI**: Groq LLM for strategy parsing and agents
- **Data**: yfinance (free), FRED macro data (with key), Alpha Vantage (optional)

---

## 1. Dependencies Installation

### Server (Python)
```bash
cd server
python3 -m pip install -r requirements.txt
```

**Key packages:**
- Flask, Flask-CORS
- pymongo (MongoDB)
- yfinance (free stock data)
- python-dotenv
- langchain-groq (LLM integration)
- fredapi (optional, for macro data)
- python-telegram-bot (Telegram integration)

### Client (Node.js)
```bash
cd client
npm install
```

---

## 2. Environment Setup (server/.env)

### ✅ **REQUIRED** (Backend won't start without these)

| Variable | Value | Source |
|----------|-------|--------|
| `GROQ_API_KEY` | `gsk_Y4t...` | [console.groq.com/keys](https://console.groq.com/keys) |
| `MONGO_URI` | `mongodb://localhost:27017` | Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |
| `MONGO_DB_NAME` | `backtest_platform` | Any name you want |
| `SECRET_KEY` | `dev-secret` | Change in production |
| `FLASK_DEBUG` | `1` | Set to `0` in production |
| `PORT` | `5000` | Backend server port |

### ⚙️ **HIGHLY RECOMMENDED** (Most features use these)

| Variable | Value | Why |
|----------|-------|-----|
| `GROQ_API_KEY1`, `GROQ_API_KEY2` | API keys | Agent rotation to avoid rate limits |
| `FRED_API_KEY` | From FRED | Enables macro data (VIX, yield curves) at `/api/data/macro/*` |
| `TELEGRAM_BOT_TOKEN` | From @BotFather | Telegram integration for notifications |

### 📊 **OPTIONAL** (Nice-to-have)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ALPHA_VANTAGE_API_KEY` | ` ` | Alternative stock data API (5 calls/min limit) |
| `REDIS_URL` | `redis://localhost:6379/0` | Caching for faster queries |
| `CACHE_TTL_SECONDS` | `3600` | Cache expiry time (seconds) |
| `YFINANCE_RATE_LIMIT_PER_MIN` | `60` | Rate limiting |

---

## 3. Database Setup

### Option A: Local MongoDB (Development)
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Verify
mongosh  # should connect to mongodb://localhost:27017
```

### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/backtest_platform`
4. Update `.env`:
   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/backtest_platform
   ```

---

## 4. API Keys Setup

### Groq (LLM - CRITICAL)
- Visit: https://console.groq.com/keys
- Create new API key
- Copy to `.env`:
  ```
  GROQ_API_KEY=gsk_xxx...
  GROQ_API_KEY1=gsk_xxx...
  GROQ_API_KEY2=gsk_yyy...
  ```

### FRED (Macro Data - OPTIONAL)
- Visit: https://fred.stlouisfed.org/docs/api/api_key.html
- Register for free key
- Add to `.env`:
  ```
  FRED_API_KEY=your_fred_key
  ```

### Telegram Bot Token (OPTIONAL)
- Chat with [@BotFather](https://t.me/BotFather) on Telegram
- Create new bot → get token
- Add to `.env`:
  ```
  TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
  ```

### Alpha Vantage (OPTIONAL)
- Visit: https://www.alphavantage.co/
- Register for free key (rate limited to 5/min)
- Add to `.env`:
  ```
  ALPHA_VANTAGE_API_KEY=your_av_key
  ```

---

## 5. Run the Project

### Terminal 1 — Backend
```bash
cd server
python3 run.py
# Should print:
# ✓ Backtest engine (DSL) loaded successfully
# [db] MongoDB connected → backtest_platform
# * Running on http://127.0.0.1:5000
```

### Terminal 2 — Frontend
```bash
cd client
npm run dev
# Should print:
# VITE v5.4.21  ready in 848 ms
# ➜  Local:   http://localhost:5173/
```

### Browser
- Open: http://localhost:5173
- Backend API proxied to: http://localhost:5000/api/*

---

## 6. Verify Everything Works

### Backend Health Check
```bash
curl http://localhost:5000/health
# Expected response:
# {"env":"development","status":"ok","version":"1.0.0"}
```

### Available Endpoints
```
GET  /health                           — server status
GET  /api/data/health                  — database + cache health
GET  /api/data/tickers                 — list all tickers
POST /api/data/fetch                   — fetch one ticker data
POST /api/data/fetch/bulk              — fetch multiple tickers
GET  /api/data/ohlcv/<ticker>          — query OHLCV
GET  /api/data/macro/fetch             — fetch FRED macro data
GET  /api/backtest/*                   — backtest runners
```

---

## 7. Troubleshooting

### **Backend won't start: "GROQ_API_KEY not found"**
- Add `GROQ_API_KEY` to `.env`
- Run: `source .env` (if needed)
- Restart server

### **MongoDB connection refused**
- Check if MongoDB is running: `ps aux | grep mongod`
- If not, start it: `mongod` or `brew services start mongodb-community`
- If using Atlas, verify MONGO_URI format includes credentials

### **Frontend shows "Cannot GET /api/*"**
- Check backend is running on port 5000
- Check `client/vite.config.ts` proxy points to `http://localhost:5000`
- Clear browser cache / hard refresh

### **Rate limit errors from Groq**
- Add `GROQ_API_KEY1` and `GROQ_API_KEY2` for key rotation
- `agents.py` automatically rotates between keys

### **FRED endpoint returns error**
- Verify `FRED_API_KEY` is set and valid
- Visit https://fred.stlouisfed.org/docs/api/ to test key manually

---

## 8. Production Checklist

- [ ] Change `SECRET_KEY` to random string
- [ ] Set `FLASK_DEBUG=0`
- [ ] Use MongoDB Atlas instead of localhost
- [ ] Set up all API keys (Groq, FRED, Telegram)
- [ ] Enable Redis for caching
- [ ] Use proper WSGI server (gunicorn) instead of Flask dev server
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS properly for your domain
- [ ] Set up monitoring + error logging

---

## 9. Key File Locations

```
server/
├── .env                          ← Fill this with all API keys
├── run.py                        ← Start server: python3 run.py
├── app.py                        ← Flask app (entry point)
├── config/
│   ├── settings.py              ← Config class reading .env
│   └── database.py              ← MongoDB connection
├── strategy_parser/
│   ├── strategy_parser.py       ← Uses GROQ_API_KEY
│   └── groq_client.py           ← LLM client
├── agents.py                    ← Uses GROQ_API_KEY1/2
├── telegram_bot.py              ← Uses TELEGRAM_BOT_TOKEN
└── data_pipeline/
    └── sources/
        ├── yfinance_source.py   ← Free, no key
        ├── fred_source.py       ← Uses FRED_API_KEY
        └── coingecko_source.py  ← Empty (not used)

client/
├── vite.config.ts               ← Proxy to backend:5000
├── package.json                 ← npm start here
└── src/
    └── main.tsx                 ← React entry point
```

---

## 10. Current Env File Status

✅ **Updated** [server/.env](server/.env):
- Added GROQ_API_KEY (primary)
- Kept GROQ_API_KEY1 & GROQ_API_KEY2 (rotation)
- Added FRED_API_KEY template
- Added TELEGRAM_BOT_TOKEN
- Added all optional tuning variables
- Added comprehensive comments & documentation

✅ **Fixed** [server/telegram_bot.py](server/telegram_bot.py):
- Moved hardcoded token to `.env`
- Now reads: `os.getenv("TELEGRAM_BOT_TOKEN", "")`

---

## 11. Quick Start (TL;DR)

```bash
# 1. Install deps
cd server && pip install -r requirements.txt && cd ..
cd client && npm install && cd ..

# 2. Start MongoDB
mongod  # or: brew services start mongodb-community

# 3. Edit .env with your API keys
nano server/.env  # Add GROQ_API_KEY, FRED_API_KEY, etc.

# 4. Run backend
cd server && python3 run.py &

# 5. Run frontend
cd client && npm run dev &

# 6. Open browser
open http://localhost:5173
```

---

**Version:** April 2026  
**Status:** ✅ Complete setup guide with all discovered dependencies
