import feedparser
from datetime import datetime
import time

def get_indian_news():
    feeds = [
        "https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms", 
        "https://www.moneycontrol.com/rss/MCtopnews.xml",
        "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms"
    ]
    
    news_items = []
    
    for url in feeds:
        try:
            feed = feedparser.parse(url)
            publisher = "Economic Times" if "economictimes" in url else "MoneyControl" if "moneycontrol" in url else "Times of India"
            
            for entry in feed.entries[:10]:
                # Try to parse published date
                pub_time = int(time.time())
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    pub_time = int(time.mktime(entry.published_parsed))
                
                news_items.append({
                    "uuid": entry.get('id', entry.get('link', str(time.time()))),
                    "title": entry.get('title', ''),
                    "publisher": publisher,
                    "link": entry.get('link', ''),
                    "providerPublishTime": pub_time,
                    "type": "STORY"
                })
        except Exception as e:
            print(f"Error fetching feed {url}: {e}")
            
    # Sort by time descending
    news_items.sort(key=lambda x: x['providerPublishTime'], reverse=True)
    return news_items[:15]
