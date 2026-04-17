import { useEffect, useRef, useState } from "react";
import { Filter, Search, Activity, Globe, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { NewsFeed } from "../components/NewsFeed";

// --- TradingView Widget Components ---

const TickerTape = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || container.current.querySelector("script")) return;
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "NSE:NIFTY", title: "NIFTY 50" },
        { proName: "NSE:BANKNIFTY", title: "NIFTY BANK" },
        { proName: "BSE:RELIANCE", title: "Reliance" },
        { proName: "NSE:TCS", title: "TCS" },
        { proName: "NSE:INFY", title: "Infosys" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container w-full" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

const AdvancedChart = ({ symbol = "BSE:RELIANCE" }: { symbol?: string }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || container.current.querySelector("script")) return;
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol || "BSE:RELIANCE",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "in",
      enable_publishing: false,
      allow_symbol_change: true,
      backgroundColor: "rgba(0, 0, 0, 0)", // Transparent to show our glassy background
      gridColor: "rgba(255, 255, 255, 0.06)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id:
        container.current?.id ||
        `tv_${Math.random().toString(36).substring(7)}`,
    });
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container w-full h-full" ref={container}>
      <div className="tradingview-widget-container__widget w-full h-full"></div>
    </div>
  );
};

const MarketOverview = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || container.current.querySelector("script")) return;
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "12M",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      tabs: [
        {
          title: "Indices",
          symbols: [
            { s: "NSE:NIFTY", d: "NIFTY 50" },
            { s: "NSE:BANKNIFTY", d: "NIFTY BANK" },
            { s: "BSE:SENSEX", d: "SENSEX" },
            { s: "NSE:NIFTYIT", d: "NIFTY IT" },
            { s: "NSE:CNXPHARMA", d: "NIFTY PHARMA" },
          ],
          originalTitle: "Indices",
        },
        {
          title: "Large Caps",
          symbols: [
            { s: "BSE:RELIANCE", d: "Reliance" },
            { s: "NSE:TCS", d: "TCS" },
            { s: "NSE:HDFCBANK", d: "HDFC Bank" },
            { s: "NSE:ICICIBANK", d: "ICICI Bank" },
            { s: "NSE:INFY", d: "Infosys" },
          ],
          originalTitle: "Large Caps",
        },
      ],
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container w-full h-full" ref={container}>
      <div className="tradingview-widget-container__widget w-full h-full"></div>
    </div>
  );
};

// --- Custom Screener Data ---

const MOCK_SCREENER_DATA = [
  {
    id: "1",
    ticker: "RELIANCE",
    name: "Reliance Industries",
    price: "INR 2,948.20",
    change: "+1.8%",
    volume: "12.2M",
    rsi: "62.4",
    marketCap: "INR 19.9T",
  },
  {
    id: "2",
    ticker: "TCS",
    name: "Tata Consultancy Services",
    price: "INR 4,082.50",
    change: "+0.9%",
    volume: "3.1M",
    rsi: "58.1",
    marketCap: "INR 14.8T",
  },
  {
    id: "3",
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    price: "INR 1,612.90",
    change: "-0.6%",
    volume: "18.4M",
    rsi: "47.5",
    marketCap: "INR 12.3T",
  },
  {
    id: "4",
    ticker: "INFY",
    name: "Infosys",
    price: "INR 1,674.22",
    change: "-1.4%",
    volume: "9.9M",
    rsi: "41.2",
    marketCap: "INR 6.9T",
  },
  {
    id: "5",
    ticker: "ICICIBANK",
    name: "ICICI Bank",
    price: "INR 1,128.10",
    change: "+1.7%",
    volume: "14.5M",
    rsi: "64.9",
    marketCap: "INR 7.8T",
  },
  {
    id: "6",
    ticker: "LT",
    name: "Larsen & Toubro",
    price: "INR 3,742.50",
    change: "+2.2%",
    volume: "2.2M",
    rsi: "69.2",
    marketCap: "INR 5.1T",
  },
  {
    id: "7",
    ticker: "SBIN",
    name: "State Bank of India",
    price: "INR 822.40",
    change: "+1.5%",
    volume: "21.0M",
    rsi: "66.4",
    marketCap: "INR 7.3T",
  },
];

export function StockScreenerPage() {
  const [activeSymbol, setActiveSymbol] = useState("BSE:RELIANCE");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col h-full w-full relative z-10 p-2 sm:p-4 gap-4"
    >
      {/* Top Ticker Tape */}
      <div className="w-full h-10 bg-white/2 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md shrink-0 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <TickerTape />
      </div>

      {/* Main Terminal Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left Column: Chart & Screener */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Advanced Chart */}
          <div className="flex-3 bg-white/3 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl relative group min-h-100">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <AdvancedChart key={activeSymbol} symbol={activeSymbol} />
          </div>

          {/* Custom Screener Table */}
          <div className="flex-2 bg-white/3 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col min-h-75">
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-medium text-white tracking-wide">
                  Proprietary Screener
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
                  <Search className="h-3.5 w-3.5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search tickers..."
                    className="bg-transparent border-0 text-xs text-white placeholder:text-white/30 focus:outline-none w-32 sm:w-40"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white text-xs font-medium rounded-full hover:bg-white/10 transition-colors">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold border-b border-white/5">
                      Asset
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold border-b border-white/5 text-right">
                      Price
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold border-b border-white/5 text-right">
                      Change
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold border-b border-white/5 text-right">
                      RSI (14)
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold border-b border-white/5 text-right hidden sm:table-cell">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold border-b border-white/5 text-right hidden md:table-cell">
                      Mkt Cap
                    </th>
                    <th className="px-4 py-3 border-b border-white/5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_SCREENER_DATA.map((row) => {
                    const isPositive = row.change.startsWith("+");
                    const rsi = parseFloat(row.rsi);
                    const rsiColor =
                      rsi > 70
                        ? "text-red-400"
                        : rsi < 30
                          ? "text-emerald-400"
                          : "text-white/60";

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-white/2 transition-colors cursor-pointer group",
                          activeSymbol === `BSE:${row.ticker}` ||
                            activeSymbol === `NSE:${row.ticker}`
                            ? "bg-white/5"
                            : "",
                        )}
                        onClick={() => setActiveSymbol(`BSE:${row.ticker}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                              {row.ticker}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {row.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-white/80">
                          {row.price}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center justify-end font-mono text-xs font-medium px-2 py-1 rounded-md",
                              isPositive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400",
                            )}
                          >
                            {row.change}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-mono text-sm",
                            rsiColor,
                          )}
                        >
                          {row.rsi}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white/50 hidden sm:table-cell">
                          {row.volume}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white/50 hidden md:table-cell">
                          {row.marketCap}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 inline-block transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Market Overview & News */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          {/* Market Overview */}
          <div className="flex-2 bg-white/3 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl min-h-75">
            <MarketOverview />
          </div>

          {/* News Timeline */}
          <div className="flex-3 bg-white/3 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col min-h-100">
            <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/1 shrink-0">
              <div className="p-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <Globe className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-sm font-medium text-white tracking-wide">
                Live Feed
              </h2>
            </div>
            <div className="flex-1 relative overflow-auto">
              <NewsFeed
                market={{
                  id: "in",
                  name: "Indian Market",
                  symbol: "^NSEI",
                  coordinates: [0, 0],
                  country: "India",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
