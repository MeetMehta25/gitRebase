import feedparser
import time
from datetime import datetime
from email.utils import parsedate_to_datetime

def get_news_for_symbol(symbol: str):
    """
    Fetches recent news articles explicitly mentioning the stock ticker 
    using the Google News RSS feed, mitigating rate limits from AlphaVantage/Yahoo
    and assuring highly fresh/relevant content.
    """
    # Clean the ticker symbol. E.g. RELIANCE.NS -> RELIANCE
    clean_symbol = symbol.split('.')[0]
    if clean_symbol.startswith('^'):
        clean_symbol = clean_symbol[1:]
        
    # Appended +when:2d to force newer results, ensuring news is not days old.
    url = f"https://news.google.com/rss/search?q={clean_symbol}+stock+when:2d&hl=en-IN&gl=IN&ceid=IN:en"
    
    news_items = []
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries[:15]:
            # Figure out publisher properly. Usually format is "TITLE - PUBLISHER"
            title_parts = entry.title.rsplit(" - ", 1)
            if len(title_parts) == 2:
                title = title_parts[0].strip()
                publisher = title_parts[1].strip()
            else:
                title = entry.title
                publisher = entry.get("source", {}).get("title", "Google News")

            # Parse publisher time safely
            pub_time = int(time.time())
            if hasattr(entry, 'published'):
                try:
                    dt = parsedate_to_datetime(entry.published)
                    pub_time = int(dt.timestamp())
                except:
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        pub_time = int(time.mktime(entry.published_parsed))

            news_items.append({
                "uuid": entry.get('id', entry.get('link', str(time.time()))),
                "title": title,
                "publisher": publisher,
                "link": entry.get('link', ''),
                "providerPublishTime": pub_time,
                "type": "STORY"
            })
            
    except Exception as e:
        print(f"Error fetching Google News feed for {symbol}: {e}")
        
    # Sort by recent publish time descending
    news_items.sort(key=lambda x: x['providerPublishTime'], reverse=True)
    return news_items
