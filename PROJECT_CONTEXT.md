## AI AGENT CONTEXT

This repository is an AI-assisted trading strategy and backtesting platform with:
- A Flask backend that handles NLP strategy parsing, multi-agent debate, market data fetch/storage, backtesting, and adversarial stress testing.
- A React + Vite frontend that presents strategy generation, visual workflow editing, backtest dashboards, and market/news UI.
- MongoDB as the main datastore for OHLCV bars, indicators, macro data, strategies, and backtest outputs.

High-level reality check:
- Core backend logic is substantial and mostly implemented in [server/app.py](server/app.py) and [server/backtest_engine/dsl_engine.py](server/backtest_engine/dsl_engine.py).
- Frontend has rich UI but relies heavily on hardcoded fallback data and simulated flows.
- Multiple modules are stubs/duplicates or partially integrated.
- Current environment did not run end-to-end out of the box (missing backend Python deps; frontend node_modules not installed).

Fast start summary for future agents:
1. Install backend deps from [server/requirements.txt](server/requirements.txt) after converting encoding (file is UTF-16 LE).
2. Provide env vars: MONGO_URI, MONGO_DB_NAME, GROQ_API_KEY (and optionally GROQ_API_KEY1/2, FRED_API_KEY).
3. Start backend from [server/run.py](server/run.py).
4. Install frontend deps in [client/package.json](client/package.json), then run Vite dev server.
5. Expect partial UX fallback even without backend because frontend contains extensive static strategy/backtest data.

Known important issues:
- HARDCODED: Frontend strategy/backtest pipelines use static fallback datasets in [client/src/data/strategyData.ts](client/src/data/strategyData.ts).
- HARDCODED: Login flow is simulated in [client/src/pages/LoginPage.tsx](client/src/pages/LoginPage.tsx).
- HARDCODED: Telegram bot token is embedded in [server/telegram_bot.py](server/telegram_bot.py) (security risk).
- Inconsistent API contracts between frontend store and backend strategy routes.
- Backend dependency manifest is incomplete relative to imports.

---

# 1. PROJECT OVERVIEW

This system is an AI-driven trading strategy platform intended to:
- Parse natural-language strategy prompts.
- Generate strategy ideas via multi-agent debate.
- Convert strategy logic to DSL conditions.
- Backtest strategy DSL against historical OHLCV data.
- Store strategy and result artifacts in MongoDB.
- Provide visual front-end workflows and backtest dashboards.

Core idea:
- Combine LLM-based strategy generation and deterministic quantitative backtesting.
- Add robustness through adversarial stress testing and quant diagnostics.

Primary stacks:
- Backend: Flask, PyMongo, pandas/numpy, yfinance, Groq/LangChain integration.
- Frontend: React, TypeScript, Vite, Zustand, charts/visualization components.
- Data: MongoDB collections for market and strategy artifacts.

---

# 2. ARCHITECTURE

## Backend Structure

Main backend entry and runtime:
- [server/run.py](server/run.py): executable startup script.
- [server/app.py](server/app.py): primary Flask application factory and most route implementations.

Backend packages:
- API routes:
  - [server/api/routes/backtest_routes.py](server/api/routes/backtest_routes.py): registered blueprint for /api/backtest/*.
  - [server/api/routes/data_routes.py](server/api/routes/data_routes.py): duplicated data routes module, not registered in app factory.
- Backtest engine:
  - [server/backtest_engine/dsl_engine.py](server/backtest_engine/dsl_engine.py): real implementation.
  - [server/backtest_engine/indicator_engine.py](server/backtest_engine/indicator_engine.py): indicator library.
  - [server/backtest_engine/engine.py](server/backtest_engine/engine.py): empty stub.
  - [server/backtest_engine/signal_engine.py](server/backtest_engine/signal_engine.py): empty stub.
  - [server/backtest_engine/portfolio.py](server/backtest_engine/portfolio.py): empty stub.
  - [server/backtest_engine/metrics.py](server/backtest_engine/metrics.py): empty stub.
- Data pipeline:
  - [server/data_pipeline/pipeline.py](server/data_pipeline/pipeline.py): orchestration.
  - [server/data_pipeline/processors/data_cleaner.py](server/data_pipeline/processors/data_cleaner.py): cleaning/normalization.
  - [server/data_pipeline/processors/indicator_processor.py](server/data_pipeline/processors/indicator_processor.py): ta-lib style indicator expansion.
  - [server/data_pipeline/validators/data_validator.py](server/data_pipeline/validators/data_validator.py): quality checks.
  - [server/data_pipeline/sources/yfinance_source.py](server/data_pipeline/sources/yfinance_source.py): primary source.
  - [server/data_pipeline/sources/fred_source.py](server/data_pipeline/sources/fred_source.py): macro source.
  - [server/data_pipeline/sources/coingecko_source.py](server/data_pipeline/sources/coingecko_source.py): empty stub.
- AI/agents:
  - [server/agents.py](server/agents.py): 16 strategy agents + consensus agent.
  - [server/adversarial_agents.py](server/adversarial_agents.py): stress-testing agents.
  - [server/strategy_parser/strategy_parser.py](server/strategy_parser/strategy_parser.py): Groq-based parser.
  - [server/strategy_parser/groq_client.py](server/strategy_parser/groq_client.py): Groq client wrapper.
- Config and utils:
  - [server/config/settings.py](server/config/settings.py)
  - [server/config/database.py](server/config/database.py)
  - [server/utils/serializer.py](server/utils/serializer.py)
  - [server/utils/rate_limiter.py](server/utils/rate_limiter.py)
  - [server/utils/logger.py](server/utils/logger.py)

## Frontend Structure

Main frontend entry and routing:
- [client/src/main.tsx](client/src/main.tsx): route table and app mount.
- [client/src/components/layout/AppLayout.tsx](client/src/components/layout/AppLayout.tsx): sidebar shell.

Primary frontend pages:
- [client/src/pages/AiAgentsPage.tsx](client/src/pages/AiAgentsPage.tsx): strategy prompt + debate UI.
- [client/src/pages/StrategyBuilderPage.tsx](client/src/pages/StrategyBuilderPage.tsx): visual strategy workflow.
- [client/src/pages/StrategyResultsPage.tsx](client/src/pages/StrategyResultsPage.tsx): strategy output review.
- [client/src/pages/BacktestRunPage1.tsx](client/src/pages/BacktestRunPage1.tsx): backtest run UX using fallback data.
- [client/src/pages/BacktestRunPage2.tsx](client/src/pages/BacktestRunPage2.tsx): suite visualization layout.
- [client/src/pages/BacktestHistoryPage.tsx](client/src/pages/BacktestHistoryPage.tsx): history table/charts (mock-heavy).
- [client/src/pages/NewsPage.tsx](client/src/pages/NewsPage.tsx): world map + news feed.
- [client/src/pages/PaperTradingPage.tsx](client/src/pages/PaperTradingPage.tsx): paper trading UI.
- [client/src/pages/LoginPage.tsx](client/src/pages/LoginPage.tsx): simulated auth.
- [client/src/pages/PlaygroundPage.tsx](client/src/pages/PlaygroundPage.tsx): validation suites playground.
- [client/src/pages/StrategyNotebookSandbox.tsx](client/src/pages/StrategyNotebookSandbox.tsx): notebook-style simulated sandbox.

Frontend data/state:
- [client/src/data/strategyData.ts](client/src/data/strategyData.ts): large hardcoded strategy and backtest fallback payloads.
- [client/src/data/backtestRunData.ts](client/src/data/backtestRunData.ts): generated/static backtest panel data.
- [client/src/store/strategyStore.ts](client/src/store/strategyStore.ts): Zustand store and API calls.

Build/runtime config:
- [client/vite.config.ts](client/vite.config.ts): /api proxy -> localhost:5000.
- [client/package.json](client/package.json)
- [client/tsconfig.app.json](client/tsconfig.app.json)
- [client/tsconfig.node.json](client/tsconfig.node.json)

## Data Flow Diagram (Textual)

User Prompt (frontend) -> /api/pipeline_full (backend) -> parse_trading_prompt + StrategyParser(Groq) -> market data load (MongoDB, fallback yfinance) -> indicator/statistics/macro context -> multi-agent debate synthesis -> strategy normalization to DSL -> run_dsl_backtest -> store strategy and results in MongoDB -> return payload -> frontend renders strategy/backtest.

Parallel/related flows:
- /api/data/* routes -> fetch/store/query OHLCV, indicators, macro.
- /api/trading/strategy* routes -> direct debate outputs without full pipeline.
- /api/adversarial -> retrieve prior strategy/backtest, run adversarial agents, modify payload, rerun backtest, store delta.
- Frontend fallback path -> if backend fails, local hardcoded conversation and fallback metrics are shown.

---

# 3. FEATURE BREAKDOWN

Status key:
- ✅ Fully Working
- ⚠️ Partially Working
- ❌ Broken
- 🧪 Hardcoded / Mocked

## Backend Features

### 3.1 Flask App Core
- Name: Main Flask API app factory
- Status: ✅ Fully Working (code-level), runtime depends on installed dependencies and MongoDB
- Files: [server/app.py](server/app.py), [server/run.py](server/run.py)
- Intended: App bootstrap, route exposure, DB init, CORS, error handlers.
- Actual: Fully implemented route-heavy app with successful blueprint registration for backtest routes.
- Dynamic vs hardcoded: Dynamic, with some hardcoded defaults/constants.
- Dependencies: flask, flask-cors, pymongo, dotenv.
- Failure points: Missing Python packages or invalid MONGO_URI prevent startup.

### 3.2 Data API Endpoints (/api/data/* in app.py)
- Status: ✅ Fully Working (implemented in main app)
- Files: [server/app.py](server/app.py)
- Intended: Data health, ticker list, OHLCV query, fetch/bulk fetch, indicators, metadata, macro fetch/query, run logs.
- Actual: Endpoints implemented and interact with MongoDB + yfinance/FRED.
- Dynamic vs hardcoded: Dynamic.
- Dependencies: pymongo, pandas, yfinance, fredapi.
- Failure points: absent FRED_API_KEY for macro fetch; yfinance failures; DB connectivity issues.

### 3.3 Backtest Routes Blueprint (/api/backtest/*)
- Status: ✅ Fully Working
- Files: [server/api/routes/backtest_routes.py](server/api/routes/backtest_routes.py), [server/app.py](server/app.py)
- Intended: Queue and retrieve backtest jobs; preview indicators.
- Actual: Registered blueprint in create_app; background thread stores results in backtest_results.
- Dynamic vs hardcoded: Dynamic.
- Dependencies: backtest engine import, MongoDB.
- Failure points: run_dsl_backtest import failure falls back to stub; malformed DSL returns validation errors.

### 3.4 Duplicate Data Blueprint Module
- Status: ⚠️ Partially Working (dead/duplicate)
- Files: [server/api/routes/data_routes.py](server/api/routes/data_routes.py), [server/app.py](server/app.py)
- Intended: reusable blueprint-based data APIs.
- Actual: Module exists but not registered in app factory; active behavior is in app.py routes.
- Dynamic vs hardcoded: Dynamic if registered.
- Failure points: integration drift risk due duplicated logic between this module and app.py.

### 3.5 Strategy Parsing (/api/strategy/parse)
- Status: ⚠️ Partially Working
- Files: [server/app.py](server/app.py), [server/strategy_parser/strategy_parser.py](server/strategy_parser/strategy_parser.py)
- Intended: Parse prompt to DSL plus execution plan.
- Actual: Regex-based parser plus Groq parser attempt; fallback minimal DSL on parse errors.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic (regex defaults for timeframe/goal/risk/style and default indicator plans).
- Dependencies: groq client, GROQ_API_KEY.
- Failure points: missing GROQ_API_KEY; invalid LLM JSON; fallback may return sparse DSL.

### 3.6 Full Strategy Execute (/api/strategy/execute)
- Status: ⚠️ Partially Working
- Files: [server/app.py](server/app.py)
- Intended: Parse -> fetch data -> calculate indicators/stats -> run debate -> return clean DSL.
- Actual: Full staged path implemented; debate result is enrichment, output is normalized DSL.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic (many fixed periods/thresholds and default fallback conditions).
- Dependencies: yfinance, MongoDB, Groq/langchain for debate.
- Failure points: data fetch failures, missing deps, parser failures.

### 3.7 End-to-End Pipeline (/api/pipeline_full)
- Status: ⚠️ Partially Working
- Files: [server/app.py](server/app.py), [server/backtest_engine/dsl_engine.py](server/backtest_engine/dsl_engine.py)
- Intended: full E2E from prompt to debate-generated backtest result plus storage.
- Actual: Comprehensive implementation with strategy normalization and result persistence.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic in normalization path (fallback/default indicators and conditions injected when parsing debates).
- Dependencies: all core backend stack + MongoDB.
- Failure points: parser/model failures, unsupported condition operators from LLM text, data availability.

### 3.8 Trading Debate APIs (/api/trading/*)
- Status: ✅ Fully Working
- Files: [server/app.py](server/app.py), [server/agents.py](server/agents.py)
- Intended: direct strategy generation via multi-agent debate.
- Actual: Debate + critique + consensus paths implemented.
- Dynamic vs hardcoded: Dynamic model-driven.
- Dependencies: langchain-groq, langchain-core, GROQ_API_KEY1/2.
- Failure points: missing keys, model/provider throttling, schema inconsistency in model output.

### 3.9 Adversarial Stress Test (/api/adversarial)
- Status: ⚠️ Partially Working
- Files: [server/app.py](server/app.py), [server/adversarial_agents.py](server/adversarial_agents.py)
- Intended: run adversarial agents, modify strategy, rerun backtest, compare metrics.
- Actual: End-to-end route implemented and persisted.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic (fixed thresholds and heuristic modifications).
- Failure points: metric-key mismatch risk (agents read flat keys such as win_rate/max_drawdown while backtest output is mostly nested under metrics), potentially reducing result correctness.

### 3.10 Backtest Engine DSL
- Status: ✅ Fully Working
- Files: [server/backtest_engine/dsl_engine.py](server/backtest_engine/dsl_engine.py)
- Intended: deterministic backtest with indicators, signals, simulation, metrics, quant tests.
- Actual: fully implemented with look-ahead prevention, order simulation, stop/take-profit/trailing, benchmark and multiple robustness tests.
- Dynamic vs hardcoded: Mostly dynamic with fixed constants.
- HARDCODED: This is not production logic (TRADING_DAYS=252, RISK_FREE_ANN=0.05, default commission/slippage etc).
- Dependencies: pandas, numpy, scipy, MongoDB fallback fetch via yfinance.
- Failure points: invalid DSL condition operators (for example unsupported "between" in adversarial suggestions), missing data, insufficient bars.

### 3.11 Indicator Engine
- Status: ✅ Fully Working
- Files: [server/backtest_engine/indicator_engine.py](server/backtest_engine/indicator_engine.py)
- Intended: explicit indicator formulas for DSL backtest.
- Actual: wide indicator coverage with deterministic formulas and warmup handling.
- Dynamic vs hardcoded: Dynamic formulas with parameter defaults.
- Dependencies: pandas, numpy.
- Failure points: unknown indicator names get skipped with warnings.

### 3.12 Backtest Submodule Placeholders
- Status: ❌ Broken / Not Implemented
- Files: [server/backtest_engine/engine.py](server/backtest_engine/engine.py), [server/backtest_engine/signal_engine.py](server/backtest_engine/signal_engine.py), [server/backtest_engine/portfolio.py](server/backtest_engine/portfolio.py), [server/backtest_engine/metrics.py](server/backtest_engine/metrics.py)
- Intended: modularized engine components.
- Actual: empty files; functionality centralized in dsl_engine.py.
- Dynamic vs hardcoded: N/A.
- Failure points: future imports from these modules would fail behaviorally.

### 3.13 Data Pipeline Orchestrator
- Status: ⚠️ Partially Working
- Files: [server/data_pipeline/pipeline.py](server/data_pipeline/pipeline.py)
- Intended: source fetch -> clean -> validate -> indicators -> upsert.
- Actual: implemented with cache logic, bulk path, metadata and macro support.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic (fixed CRYPTO_TICKERS set and cache thresholds).
- Dependencies: yfinance source, fred source, ta-based indicator processor.
- Failure points: coingecko source is empty; ta/fred dependencies absent from requirements file; cache reports record_count None in cached response.

### 3.14 yfinance Source
- Status: ✅ Fully Working
- Files: [server/data_pipeline/sources/yfinance_source.py](server/data_pipeline/sources/yfinance_source.py)
- Intended: canonical OHLCV and metadata ingest.
- Actual: robust for single and bulk fetch with rate limiting and asset class detection.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic (asset class symbol rules and ETF list).

### 3.15 FRED Source
- Status: ⚠️ Partially Working
- Files: [server/data_pipeline/sources/fred_source.py](server/data_pipeline/sources/fred_source.py)
- Intended: macro/economic data ingest.
- Actual: implemented; requires valid FRED_API_KEY.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic (series ID catalog hardcoded).

### 3.16 CoinGecko Source
- Status: ❌ Broken / Not Implemented
- Files: [server/data_pipeline/sources/coingecko_source.py](server/data_pipeline/sources/coingecko_source.py)
- Intended: crypto OHLCV source fallback.
- Actual: empty file.
- Dynamic vs hardcoded: N/A.
- Failure points: pipeline fallback path may fail or rely solely on yfinance crypto symbols.

### 3.17 Database Layer
- Status: ✅ Fully Working
- Files: [server/config/database.py](server/config/database.py)
- Intended: Mongo connection and index management.
- Actual: connection check + idempotent index setup across key collections.
- Dynamic vs hardcoded: Mixed.
- HARDCODED: This is not production logic (fixed index definitions and default db name).
- Failure points: DB unavailable or credentials/network failure.

### 3.18 Telegram Bot Utility
- Status: 🧪 Hardcoded / Mocked (not integrated with web app)
- Files: [server/telegram_bot.py](server/telegram_bot.py)
- Intended: simple ticker lookup bot.
- Actual: standalone bot using yfinance.
- HARDCODED: This is not production logic (token hardcoded in source).
- Failure points: severe security risk, token leak and abuse.

## Frontend Features

### 3.19 Routing and Layout Shell
- Status: ✅ Fully Working
- Files: [client/src/main.tsx](client/src/main.tsx), [client/src/components/layout/AppLayout.tsx](client/src/components/layout/AppLayout.tsx)
- Intended: route map and consistent app shell.
- Actual: works as expected with nested routes and sidebar.
- Dependencies: react-router-dom.

### 3.20 AI Agents Strategy Experience
- Status: ⚠️ Partially Working
- Files: [client/src/pages/AiAgentsPage.tsx](client/src/pages/AiAgentsPage.tsx)
- Intended: send prompt, run backend debate pipeline, show logs, navigate to results.
- Actual: tries backend /api/pipeline_full then silently falls back to hardcoded conversations and fallback backtest payload.
- Dynamic vs hardcoded: Mixed with major fallback.
- HARDCODED: This is not production logic (HARDCODED_CONVERSATIONS and fallback strategy data).
- Failure points: backend unavailable still appears successful due fallback, masking outages.

### 3.21 Strategy Data/Workflows
- Status: 🧪 Hardcoded / Mocked
- Files: [client/src/data/strategyData.ts](client/src/data/strategyData.ts)
- Intended: represent strategy questions/workflows and fallback data.
- Actual: contains major static datasets including detailed backtest metrics, quant tests, adversarial outputs.
- HARDCODED: This is not production logic.

### 3.22 Strategy Builder and State Store
- Status: ⚠️ Partially Working
- Files: [client/src/pages/StrategyBuilderPage.tsx](client/src/pages/StrategyBuilderPage.tsx), [client/src/store/strategyStore.ts](client/src/store/strategyStore.ts)
- Intended: edit and persist strategy workflows through backend APIs.
- Actual: save/get/delete routes exist, but update uses PUT endpoint not present in backend; response shape assumptions are mismatched in places.
- Dynamic vs hardcoded: Mixed.
- Failure points: update flow broken, load/save mapping inconsistencies.

### 3.23 Backtest Run and History Views
- Status: ⚠️ Partially Working
- Files: [client/src/pages/BacktestRunPage1.tsx](client/src/pages/BacktestRunPage1.tsx), [client/src/pages/BacktestRunPage2.tsx](client/src/pages/BacktestRunPage2.tsx), [client/src/pages/BacktestHistoryPage.tsx](client/src/pages/BacktestHistoryPage.tsx)
- Intended: visualize true backtest execution and history.
- Actual: strong visualization, but most data paths are fallback/static unless route state includes live backend payload.
- HARDCODED: This is not production logic (mock tearsheet/history and fallback metrics).

### 3.24 News Integration
- Status: ⚠️ Partially Working
- Files: [client/src/components/NewsFeed.tsx](client/src/components/NewsFeed.tsx), [client/src/pages/NewsPage.tsx](client/src/pages/NewsPage.tsx)
- Intended: show live market news per selected market.
- Actual: API call path exists; behavior depends on backend and yfinance news quality.
- Dynamic vs hardcoded: mostly dynamic with static sentiment labeling heuristic.

### 3.25 Login/Auth
- Status: 🧪 Hardcoded / Mocked
- Files: [client/src/pages/LoginPage.tsx](client/src/pages/LoginPage.tsx)
- Intended: authenticate users.
- Actual: simulated delay then unconditional navigation to dashboard.
- HARDCODED: This is not production logic.

### 3.26 Paper Trading
- Status: 🧪 Hardcoded / Mocked
- Files: [client/src/pages/PaperTradingPage.tsx](client/src/pages/PaperTradingPage.tsx)
- Intended: paper trading simulation.
- Actual: client-side defaults and generated/mock charting.
- HARDCODED: This is not production logic.

### 3.27 Stock Screener and Quant Coach
- Status: ⚠️ Partially Working
- Files: [client/src/pages/StockScreenerPage.tsx](client/src/pages/StockScreenerPage.tsx), [client/src/pages/QuantCoachPage.tsx](client/src/pages/QuantCoachPage.tsx)
- Intended: screening and coaching tools.
- Actual: mostly external widget/embed based; reliability depends on third-party embed availability.
- HARDCODED: This is not production logic for production-grade screening/coach.

### 3.28 Playground and Notebook Sandbox
- Status: 🧪 Hardcoded / Mocked
- Files: [client/src/pages/PlaygroundPage.tsx](client/src/pages/PlaygroundPage.tsx), [client/src/pages/StrategyNotebookSandbox.tsx](client/src/pages/StrategyNotebookSandbox.tsx), [client/src/data/sampleStrategies.ts](client/src/data/sampleStrategies.ts), [client/src/data/backtestRunData.ts](client/src/data/backtestRunData.ts)
- Intended: strategy experimentation and validation UX.
- Actual: relies heavily on static sample data and scripted animations.
- HARDCODED: This is not production logic.

---

# 4. HARDCODED LOGIC REPORT

This section explicitly flags non-production logic.

1. HARDCODED: This is not production logic
- [client/src/data/strategyData.ts](client/src/data/strategyData.ts)
- Static strategy catalog, workflow graphs, fallback backtests, fallback adversarial outputs.

2. HARDCODED: This is not production logic
- [client/src/pages/AiAgentsPage.tsx](client/src/pages/AiAgentsPage.tsx)
- HARDCODED_CONVERSATIONS and automatic fallback behavior when backend fails.

3. HARDCODED: This is not production logic
- [client/src/pages/LoginPage.tsx](client/src/pages/LoginPage.tsx)
- Simulated auth with setTimeout and unconditional success navigation.

4. HARDCODED: This is not production logic
- [client/src/pages/BacktestHistoryPage.tsx](client/src/pages/BacktestHistoryPage.tsx), [client/src/data/backtestRunData.ts](client/src/data/backtestRunData.ts)
- Static backtest history and generated chart data.

5. HARDCODED: This is not production logic
- [server/app.py](server/app.py)
- Multiple fixed default mappings and indicator parameter assumptions for NLP parsing and strategy defaults.

6. HARDCODED: This is not production logic
- [server/adversarial_agents.py](server/adversarial_agents.py)
- Fixed thresholds and heuristic modifications.

7. HARDCODED: This is not production logic
- [server/data_pipeline/pipeline.py](server/data_pipeline/pipeline.py), [server/data_pipeline/sources/fred_source.py](server/data_pipeline/sources/fred_source.py), [server/data_pipeline/sources/yfinance_source.py](server/data_pipeline/sources/yfinance_source.py)
- Fixed symbol sets/series IDs and source heuristics.

8. HARDCODED: This is not production logic (security)
- [server/telegram_bot.py](server/telegram_bot.py)
- Hardcoded Telegram bot token in source.

9. HARDCODED: This is not production logic
- [server/backtest_engine/dsl_engine.py](server/backtest_engine/dsl_engine.py)
- Fixed risk-free rate and trading-days constants.

---

# 5. BACKEND API MAP

Envelope pattern (most endpoints):
- success: boolean
- data: payload
- error: string or null
- meta: object

Non-envelope exceptions exist (notably /api/news and some trading endpoints returning jsonify directly).

## Health and System

1. GET /health
- File: [server/app.py](server/app.py)
- Purpose: service health/version/env.
- Works: yes.

2. GET /api/trading/health
- File: [server/app.py](server/app.py)
- Purpose: trading service health.
- Works: yes.

3. GET /api/trading/docs
- File: [server/app.py](server/app.py)
- Purpose: API docs payload.
- Works: yes.

## Data Endpoints

1. GET /api/data/health
2. GET /api/data/tickers
3. GET /api/data/ohlcv/<ticker>
4. GET /api/data/ohlcv/<ticker>/latest
5. POST /api/data/fetch
6. POST /api/data/fetch/bulk
7. GET /api/data/indicators/<ticker>
8. GET /api/data/meta/<ticker>
9. POST /api/data/macro/fetch
10. GET /api/data/macro/<series_id>
11. GET /api/data/runs
- Files: all implemented in [server/app.py](server/app.py)
- Works: mostly yes, subject to provider keys/data connectivity.

## News

1. GET /api/news/<symbol>
- File: [server/app.py](server/app.py)
- Response shape: { news: [], symbol, count, error? }
- Works: partial; failures return HTTP 200 with empty news and error string.

## Strategy and Debate

1. POST /api/strategy/parse
2. POST /api/strategy/execute
3. POST /api/pipeline_full
4. POST /api/trading/strategy
5. POST /api/trading/strategy/json
6. POST /api/trading/strategy/from_prompt
- File: [server/app.py](server/app.py)
- Works: partial to good, depending on model keys/dependencies.

## Strategy Persistence

1. POST /api/strategies
2. GET /api/strategies/history
3. GET /api/strategies/<strategy_id>
4. GET /api/strategies/ticker/<ticker>
5. GET /api/strategies
6. DELETE /api/strategies/<strategy_id>
- File: [server/app.py](server/app.py)
- Works: mostly yes.
- Gap: frontend store uses PUT /api/strategies/<id> but backend does not define this endpoint.

## Backtest Blueprint

1. POST /api/backtest/run
2. GET /api/backtest/<result_id>
3. GET /api/backtest/results
4. POST /api/backtest/indicators/preview
- File: [server/api/routes/backtest_routes.py](server/api/routes/backtest_routes.py)
- Registered in [server/app.py](server/app.py)
- Works: yes, queue-based background runner.

## Adversarial

1. POST /api/adversarial
- File: [server/app.py](server/app.py)
- Works: partial (metric mapping consistency concerns).

---

# 6. AI AGENT PIPELINE

Main components:
- Debate agents: [server/agents.py](server/agents.py)
- Prompt parser: [server/strategy_parser/strategy_parser.py](server/strategy_parser/strategy_parser.py)
- Consensus synthesis: ConsensusStrategyAgent in [server/agents.py](server/agents.py)

Flow:
1. Prompt intake and basic parameter extraction in app.py.
2. Optional Groq DSL parse in strategy_parser.
3. Build market context (price, trend, momentum, volatility, macro).
4. Run selected/default agent set:
   - Round 1 proposals.
   - Round 2 critiques.
5. Consensus synthesis to final strategy object.
6. For pipeline_full, normalize strategy output to executable DSL and backtest.

Agent inventory (16 + consensus):
- TrendFollowingAgent
- MomentumAgent
- MeanReversionAgent
- BreakoutAgent
- VolumeAnalysisAgent
- VolatilityAgent
- PatternRecognitionAgent
- StatisticalSignalAgent
- MarketRegimeAgent
- LiquidityAgent
- RiskManagementAgent
- PortfolioAgent
- SentimentAgent
- MacroAgent
- CryptoSpecialistAgent
- StrategySimplifierAgent
- ConsensusStrategyAgent

Model/key dependencies:
- GROQ_API_KEY for strategy parser in [server/strategy_parser/strategy_parser.py](server/strategy_parser/strategy_parser.py)
- GROQ_API_KEY1 and GROQ_API_KEY2 for debate agents in [server/agents.py](server/agents.py)

Important consistency risk:
- Parser and debate paths rely on different env var names and model wrappers.

---

# 7. BACKTEST ENGINE ANALYSIS

Primary engine:
- [server/backtest_engine/dsl_engine.py](server/backtest_engine/dsl_engine.py)

DSL expected fields:
- ticker
- timeframe
- indicators[]
- entry_conditions[]
- exit_conditions[]
- position_size
- optional risk/trade config (capital, commission, slippage, stop/take/trailing, date range)

Execution flow:
1. Load OHLCV from MongoDB (fallback yfinance if sparse).
2. Compute requested indicators via indicator_engine.
3. Evaluate entry/exit conditions.
4. Shift signals by 1 bar to avoid look-ahead.
5. Simulate bar-by-bar with stop/take/trailing and cost model.
6. Compute full metrics and aliases.
7. Run quant tests:
   - Monte Carlo bootstrap
   - Walk-forward windows
   - Kupiec VaR test
   - Regime decomposition
   - Overfitting score
   - Benchmark comparison
8. Return compacted equity curve and trades.

Strengths:
- Explicit formulas and deterministic simulation ordering.
- Good breadth of performance and robustness metrics.

Failure conditions:
- Missing ticker/conditions in DSL.
- Entry conditions never trigger (returns explicit error).
- Unsupported operators in condition normalization (for example adversarial "between" conditions are not handled by _eval_conditions).
- Data insufficiency (<50 bars for run).

Module design debt:
- engine.py/signal_engine.py/portfolio.py/metrics.py are empty placeholders while full logic lives in dsl_engine.py.

---

# 8. DATABASE STRUCTURE

Mongo connection and index setup:
- [server/config/database.py](server/config/database.py)

Collections observed/used:
1. ohlcv
- Purpose: historical bars per ticker/date.
- Key index: unique (ticker, date).

2. indicators
- Purpose: flattened indicator values by ticker/indicator/date.
- Key index: unique (ticker, indicator, date).

3. macro_data
- Purpose: FRED macro time series.
- Key index: unique (series_id, date).

4. ticker_metadata
- Purpose: static metadata from yfinance.
- Key index: unique (ticker).

5. pipeline_runs
- Purpose: run auditing and statuses.

6. strategies
- Purpose: saved workflows and pipeline-generated strategy artifacts.
- Key indexes: strategy_id unique, ticker-created_at.

7. backtest_results
- Purpose: queued/completed backtest outputs.
- Key indexes: strategy_id+epoch and result_id usage.

8. adversarial_results
- Purpose: stress test outputs and deltas.

Schema validation status:
- No Mongo schema validator or pydantic model enforcement found.
- Validation is ad-hoc in route handlers and pipeline validator.
- Recommendation: add explicit collection-level JSON schema validators.

---

# 9. HOW TO RUN THE PROJECT (CRITICAL)

## Verified Environment Snapshot (Current Machine)
- Python: 3.14.4
- Node: v25.9.0
- npm: 11.12.1

## Recommended Versions
- Python: 3.10-3.12 (safer library compatibility than 3.14 for some packages)
- Node: 20 LTS (most consistent for Vite ecosystem)
- MongoDB: local or Atlas

## Backend Setup

1. Create and activate venv
- cd server
- python3 -m venv .venv
- source .venv/bin/activate

2. Convert requirements file encoding (UTF-16 -> UTF-8)
- iconv -f UTF-16 -t UTF-8 requirements.txt > requirements.utf8.txt

3. Install dependencies
- pip install -r requirements.utf8.txt

4. Install missing packages not listed but imported in code
- pip install groq langchain-groq langchain-core scipy ta fredapi loguru pycoingecko python-telegram-bot requests

5. Create .env in server directory
- MONGO_URI=mongodb+srv://... or mongodb://localhost:27017
- MONGO_DB_NAME=backtest_platform
- GROQ_API_KEY=...
- GROQ_API_KEY1=...
- GROQ_API_KEY2=...
- FRED_API_KEY=... (optional but needed for macro routes)
- PORT=5000
- FLASK_DEBUG=1

6. Start backend
- python run.py

Expected local URL:
- http://localhost:5000

## Frontend Setup

1. Install dependencies
- cd client
- npm install

2. Start frontend (dev)
- npm run dev

3. Build frontend
- npm run build

Expected local URL:
- http://localhost:5173 (default)

Vite proxy behavior:
- /api requests route to backend at localhost:5000 via [client/vite.config.ts](client/vite.config.ts)

## Execution Verification Results (Current Audit Session)

1. Backend run attempt
- Command: python3 run.py in server
- Result: failed with ModuleNotFoundError: dotenv
- Meaning: backend dependencies not yet installed.

2. Backend syntax compilation check
- Command: python3 -m py_compile on key backend files
- Result: no syntax errors emitted.

3. Frontend build attempt
- Command: npm run build in client
- Result: failed with missing type definitions vite/client and node
- Meaning: node_modules not installed before build.

## Common Errors + Fixes

1. Error: ModuleNotFoundError: dotenv
- Fix: pip install python-dotenv (or install full requirements).

2. Error: Missing vite/client or node type definitions
- Fix: run npm install in client.

3. Error: MongoDB connection failed
- Fix: validate MONGO_URI/MONGO_DB_NAME, Atlas network access, credentials.

4. Error: Groq parser/debate failing
- Fix: ensure GROQ_API_KEY and/or GROQ_API_KEY1/2 set correctly.

5. Error: Macro fetch 422 / key not configured
- Fix: set FRED_API_KEY.

6. Error: API seemingly works but results are static in UI
- Cause: frontend fallback mode in AiAgentsPage and strategyData.
- Fix: enforce backend success and remove silent fallback for production.

## One-command Workflow (Practical)

Backend one-liner (after venv and requirements prep):
- cd server && source .venv/bin/activate && python run.py

Frontend one-liner:
- cd client && npm install && npm run dev

Parallel launch example from repo root (two terminals):
- Terminal A: cd server && source .venv/bin/activate && python run.py
- Terminal B: cd client && npm install && npm run dev

---

# 10. CURRENT SYSTEM STATUS

What is actually working now (code-level):
- Flask app structure, route implementations, and backtest blueprint registration.
- Backtest DSL engine with indicator/simulation/quant tests.
- Mongo index setup and serializer utilities.
- Frontend route/layout rendering and visual components.

What is fake/incomplete:
- Significant frontend core flows rely on fallback static data.
- Login/auth is mocked.
- CoinGecko source implementation is missing.
- Backtest submodules are empty placeholders.
- Strategy update API contract mismatch (frontend expects PUT not provided by backend).

What will break in production:
1. Secrets exposure risk via hardcoded Telegram token.
2. Missing dependencies from requirements create deployment failures.
3. Silent frontend fallback can hide backend outages and produce misleading outputs.
4. Inconsistent model env vars (GROQ_API_KEY vs GROQ_API_KEY1/2) complicate operational reliability.
5. Lack of schema validation can allow malformed strategy/backtest documents.

---

# 11. NEXT STEPS (PRIORITY FIXES)

Top 5 improvements to become production-ready:

1. Dependency and environment hardening
- Fix [server/requirements.txt](server/requirements.txt) encoding and completeness.
- Add a canonical requirements lock and .env.example.

2. Remove/contain hardcoded fallbacks in critical UX
- Gate fallback mode behind explicit development flag.
- In production, surface backend errors instead of substituting static outputs.

3. API contract normalization between frontend store and backend
- Implement PUT /api/strategies/<id> or update frontend to existing endpoints.
- Align response payload shapes for save/load/history.

4. Complete missing backend modules and source implementations
- Implement [server/data_pipeline/sources/coingecko_source.py](server/data_pipeline/sources/coingecko_source.py).
- Either implement or remove empty backtest_engine placeholders.

5. Security and data governance
- Remove hardcoded token from [server/telegram_bot.py](server/telegram_bot.py) and rotate it.
- Add Mongo schema validators and stronger request validation.

---

## Additional Execution Notes for Future Agents

During this audit, the following were explicitly verified:
- Route decorators and endpoint inventory in [server/app.py](server/app.py).
- Backtest blueprint registration near end of app factory.
- Frontend fallback and API call behavior in [client/src/pages/AiAgentsPage.tsx](client/src/pages/AiAgentsPage.tsx) and [client/src/store/strategyStore.ts](client/src/store/strategyStore.ts).
- Build/run failures due missing installed dependencies, not source syntax.

This file is intended to be the single source of project context for subsequent AI agents and maintainers.
## Recent Updates
- [Phase 3] Integrated Green API WhatsApp messaging for trade signals, backtest summaries, and adversarial risk alerts directly in `dsl_engine.py` and `app.py`.
