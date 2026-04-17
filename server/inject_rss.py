import re

with open('server/app.py', 'r', encoding='utf-8') as f:
    app_code = f.read()

# Add import at the top
if 'from rss_feed import get_indian_news' not in app_code:
    app_code = app_code.replace('import yfinance as yf', 'import yfinance as yf\nfrom rss_feed import get_indian_news')

# Modify the _fetch_news_for_symbol function
old_fetch_code = """
def _fetch_news_for_symbol(symbol: str, limit: int = 12):
    ticker = yf.Ticker(symbol)
    raw_news = ticker.news if hasattr(ticker, "news") else []
    formatted = []

    if not isinstance(raw_news, list):
        return formatted

    for idx, item in enumerate(raw_news[:30]):
        normalized = _normalize_news_item(item, idx)
        if not normalized:
            continue
        if not normalized["link"]:
            continue

        formatted.append(normalized)
        if len(formatted) >= limit:
            break

    return formatted
"""

new_fetch_code = """
def _fetch_news_for_symbol(symbol: str, limit: int = 12):
    formatted = []
    
    # Intercept Indian indices/tickers
    if symbol.startswith('^BSESN') or symbol.startswith('^NSEI') or symbol.endswith('.NS') or symbol.endswith('.BO'):
        try:
            return get_indian_news()
        except:
            pass

    # Fallback to standard yahoo finance fetch logic
    ticker = yf.Ticker(symbol)
    raw_news = ticker.news if hasattr(ticker, "news") else []

    if not isinstance(raw_news, list):
        return formatted

    for idx, item in enumerate(raw_news[:30]):
        normalized = _normalize_news_item(item, idx)
        if not normalized:
            continue
        if not normalized["link"]:
            continue

        formatted.append(normalized)
        if len(formatted) >= limit:
            break

    return formatted
"""

app_code = app_code.replace(old_fetch_code.strip(), new_fetch_code.strip())

with open('server/app.py', 'w', encoding='utf-8') as f:
    f.write(app_code)

print("Injected RSS logic into app.py")
