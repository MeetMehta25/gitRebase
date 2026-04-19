import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Loader2, TrendingUp, AlertCircle, TrendingDown, Minus } from "lucide-react";
import { type Market } from "../data/markets";
import { motion, AnimatePresence } from "motion/react";

const getSentiment = (title: string) => {
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  if (hash % 3 === 0) return { label: "Bullish", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: TrendingUp };
  if (hash % 3 === 1) return { label: "Bearish", color: "text-rose-400 bg-rose-400/10 border-rose-400/20", icon: TrendingDown };
  return { label: "Neutral", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Minus };
};

interface NewsFeedProps {
  market: Market | null;
}

interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  type: string;
}

export function NewsFeed({ market }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!market) {
      setNews([]);
      setError(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchNews(isBackgroundRefresh = false) {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(
          `/api/news/${encodeURIComponent(market!.symbol)}`,
          { signal: controller.signal },
        );
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          const backendMessage =
            typeof data?.error === "string" && data.error.trim().length > 0
              ? data.error
              : typeof data?.message === "string" && data.message.trim().length > 0
                ? data.message
                : null;
          throw new Error(
            backendMessage ?? `Failed to fetch news (${response.status})`,
          );
        }

        if (data?.success === false && typeof data?.error === "string") {
          throw new Error(data.error);
        }

        const parsedNews = Array.isArray(data?.news)
          ? data.news
          : Array.isArray(data?.data?.news)
            ? data.data.news
            : [];

        const backendPayloadError =
          typeof data?.error === "string" && data.error.trim().length > 0
            ? data.error
            : null;
        if (backendPayloadError && parsedNews.length === 0) {
          throw new Error(backendPayloadError);
        }

        if (isMounted) {
          setNews(parsedNews);
          setError(null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        if (isMounted) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : "Live news is temporarily unavailable. Retrying automatically...",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchNews();
    // Reduced polling frequency from 45s to 5 minutes to avoid API rate limits 
    // and since news doesn't update every 45 secs anyway
    const intervalId = window.setInterval(() => {
      fetchNews(true);
    }, 300000);

    return () => {
      isMounted = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [market]);

  if (!market) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-950 rounded-2xl border border-zinc-800">
        <TrendingUp className="w-16 h-16 text-zinc-600 mb-4" />
        <h3 className="text-xl font-medium text-zinc-200">Select a Market</h3>
        <p className="text-zinc-400 mt-2">
          Click on any highlighted hub on the map to view real-time financial
          news.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {market.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              
              <span className="text-sm text-zinc-500">{market.country}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-zinc-400"
            >
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Fetching latest updates...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-rose-400"
            >
              <AlertCircle className="w-8 h-8 mb-4" />
              <p>{error}</p>
            </motion.div>
          ) : news.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-zinc-500"
            >
              <p>No recent news found for this market.</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {news.map((item, index) => {
                const sentiment = getSentiment(item.title);
                const SentimentIcon = sentiment.icon;
                return (
                  <motion.a
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.uuid}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-zinc-100 font-medium leading-snug group-hover:text-zinc-300 transition-colors">
                        {item.title}
                      </h4>
                      <ExternalLink className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-400">
                          {item.publisher}
                        </span>
                        <span>•</span>
                        <span>
                          {item.providerPublishTime > 0
                            ? formatDistanceToNow(
                                new Date(item.providerPublishTime * 1000),
                                {
                                  addSuffix: true,
                                },
                              )
                            : "recently"}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sentiment.color}`}>
                        <SentimentIcon className="w-3.5 h-3.5" />
                        {sentiment.label}
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
