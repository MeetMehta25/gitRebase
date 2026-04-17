import re

app_path = '../server/app.py'
with open(app_path, 'r', encoding='utf-8') as f:
    code = f.read()

new_endpoint = '''
    # ── Live Quotes (with rudimentary caching) ─────────────────────────────────
    QUOTE_CACHE = {}
    CACHE_DURATION = 300 # 5 minutes

    @app.post("/api/data/quotes")
    def fetch_quotes():
        """
        POST /api/data/quotes
        Body: { "tickers": ["RELIANCE.NS", "TCS.NS"] }
        Returns delayed quote data.
        """
        body = request.get_json(silent=True) or {}
        tickers = body.get("tickers", [])
        if not tickers:
            return _resp(error="No tickers provided", status=400)
            
        import time
        now = time.time()
        results = {}
        to_fetch = []
        
        for tkr in tickers:
            t = tkr.upper()
            if t in QUOTE_CACHE and (now - QUOTE_CACHE[t]["time"]) < CACHE_DURATION:
                results[t] = QUOTE_CACHE[t]["data"]
            else:
                to_fetch.append(t)
                
        if to_fetch:
            try:
                # Use history instead of deep download to avoid noise if single ticker,
                temp_df = yf.download(to_fetch, period="5d", progress=False)
                if not temp_df.empty and 'Close' in temp_df.columns:
                    closes = temp_df['Close']
                    if len(to_fetch) == 1:
                        # Single ticker case
                        t = to_fetch[0]
                        valid_closes = closes.dropna()
                        if not valid_closes.empty:
                            last_close = _safe_float(valid_closes.iloc[-1])
                            prev_close = _safe_float(valid_closes.iloc[-2]) if len(valid_closes) > 1 else last_close
                            change = ((last_close - prev_close)/prev_close * 100) if prev_close else 0.0
                            
                            data = {"price": last_close, "change": change}
                            QUOTE_CACHE[t] = {"time": now, "data": data}
                            results[t] = data
                    else:
                        for t in to_fetch:
                            try:
                                if t in closes.columns:
                                    col = closes[t]
                                    valid_closes = col.dropna()
                                    if not valid_closes.empty:
                                        last_close = _safe_float(valid_closes.iloc[-1])
                                        prev_close = _safe_float(valid_closes.iloc[-2]) if len(valid_closes) > 1 else last_close
                                        change = ((last_close - prev_close)/prev_close * 100) if prev_close else 0.0
                                        
                                        data = {"price": last_close, "change": change}
                                        QUOTE_CACHE[t] = {"time": now, "data": data}
                                        results[t] = data
                            except Exception as e:
                                logger.error(f"Error extracting quote for {t}: {str(e)}")
            except Exception as e:
                logger.error(f"Quote fetch failed: {str(e)}")
                
        return _resp(data=results)
'''

if 'def fetch_quotes():' not in code:
    code = code.replace('def fetch_ticker():', new_endpoint + '\n\n    def fetch_ticker():')
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Patch applied to app.py")
else:
    print("Already patched app.py")
