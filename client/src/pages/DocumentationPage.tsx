import { useState } from "react";
import { 
  BookOpen, 
  Lightbulb, 
  TrendingUp, 
  Activity, 
  Bot, 
  ShieldAlert, 
  Target, 
  BarChart2, 
  Percent, 
  DollarSign, 
  Globe, 
  Zap,
  Bitcoin,
  Layers,
  Search,
  BookMarked
} from "lucide-react";
import { cn } from "../lib/utils";

// --- Data ---
const VOCABULARY = [
  { term: "Backtesting", desc: "The process of testing a trading strategy purely on historical data. By analyzing how a strategy would have performed in the past, traders can assess its viability before risking real capital.", icon: BookOpen },
  { term: "Sharpe Ratio", desc: "A key metric for risk-adjusted return. Formula: (Return of Portfolio - Risk-Free Rate) / Standard Deviation. A Sharpe ratio > 1 is good, > 2 is exceptional. It tells you if your returns are due to smart decisions or simply taking reckless risk.", icon: Target },
  { term: "Max Drawdown", desc: "The maximum observed loss from a peak to a trough before a new peak is attained. If your account goes from $10,000 to $8,000, your Max Drawdown is 20%. This is the ultimate test of emotional pain tolerance.", icon: ShieldAlert },
  { term: "Win Rate", desc: "The percentage of total trades that close at a profit. A high win rate (e.g., 90%) does not guarantee profitability if your losing trades are drastically larger than your winning trades.", icon: Percent },
  { term: "Profit Factor", desc: "The ratio of gross profits to gross losses (Gross Profit / Gross Loss). A profit factor of 1.5 implies that for every $1 you lose, you make $1.50. You want this value to be greater than 1.0.", icon: TrendingUp },
  { term: "Alpha", desc: "The excess return of a strategy relative to the broader market index (like the S&P 500). If the market goes up 10% but your strategy goes up 15%, you have generated 5% Alpha.", icon: DollarSign },
  { term: "Beta", desc: "A measure of volatility compared to the market. A Beta of 1 means your asset moves exactly with the market. A Beta of 2 means it is twice as volatile, reacting aggressively to market sentiment shifts.", icon: BarChart2 },
  { term: "Slippage", desc: "The difference between the expected price of a trade and the price at which the trade is actually executed. Usually occurs during high volatility or in thinly traded low-liquidity assets.", icon: Activity },
  { term: "Overfitting", desc: "Also known as curve-fitting. This happens when a strategy is too closely tailored to past data patterns, capturing noise rather than genuine signals. Overfit models typically fail in live trading.", icon: Layers }
];

const SIMPLE_STRATEGIES = [
  {
    title: "Moving Average Crossover (Trend Following)",
    desc: "A foundational trend-following strategy. It triggers a 'Buy' when a short-term moving average (e.g., 50-day) crosses above a long-term moving average (e.g., 200-day), known as a Golden Cross. It triggers a 'Sell' when the opposite occurs (Death Cross). This works beautifully in strong directional trends but generates false signals (whipsaws) in completely flat, choppy markets.",
    icon: TrendingUp,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  },
  {
    title: "RSI Mean Reversion (Contrarian)",
    desc: "Operates on the philosophy that 'what goes up too fast must come down, and vice versa.' By using the Relative Strength Index (RSI), an oscillator bounded between 0 and 100, the system triggers 'Buys' when the underlying asset is completely oversold (RSI < 30) and triggers 'Sells' when the asset is overbought (RSI > 70). Perfect for ranging, bound markets.",
    icon: Activity,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  },
  {
    title: "Bollinger Band Breakout (Volatility Expansion)",
    desc: "Capitalizes on sudden, violent expansions in market volatility. Bollinger Bands consist of a Simple Moving Average flanked by bands set 2 standard deviations away. When price breaks out forcefully above the Upper Band, it often signals the start of a new, aggressive upward trend based on heavy volume. Entering right on the breakout catches massive momentum.",
    icon: Lightbulb,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  }
];

const AGENTS = [
  { name: "Trend Agent", desc: "Identifies primary market direction (uptrend, downtrend, sideways) using strict moving average alignment (SMA, EMA) and ADX. It vetoes trades that stubbornly fight the dominant macro trend.", icon: TrendingUp },
  { name: "Momentum Agent", desc: "Measures the sheer velocity of price movements using RSI, ROC, and MACD histograms. It determines if a stock is accelerating or internally losing gas before a reversal.", icon: Zap },
  { name: "Mean Reversion", desc: "Specifically hunts for mathematical anomalies where price has deviated too far from historical averages, calculating optimal rubber-band snapback zones.", icon: Activity },
  { name: "Breakout Agent", desc: "Fires when prices forcefully break pre-established Support/Resistance lines or pivot highs, validating the move against historical breakout success rates.", icon: Target },
  { name: "Volume Agent", desc: "Checks institutional backing. Price moves without volume are ignored, but significant spikes in On-Balance-Volume (OBV) greenlight moves as heavily institutionally supported.", icon: BarChart2 },
  { name: "Volatility Agent", desc: "Constantly scans the underlying chop. It widens Stop Losses during chaotic, high-ATR conditions to prevent random stop-outs, and tightens them when the market is calm.", icon: Activity },
  { name: "Pattern Agent", desc: "Visual-geometric scanner. Uses complex vector math to identify classic chart psychology like Head & Shoulders, Bull Flags, Wedges, and Double Bottoms.", icon: Layers },
  { name: "Stats Agent", desc: "The pure mathematician. Projects Gaussian curves, tests P-values, checks standard deviations, and calculates statistical edge decay.", icon: Percent },
  { name: "Regime Agent", desc: "Categorizes the market environment. Ensures trend-following rules aren't deployed during sideways consolidation regimes by analyzing VIX and broad indices.", icon: Target },
  { name: "Liquidity Agent", desc: "Essential for live execution. Ensures the asset has enough deep order-book liquidity and narrow bid/ask spreads to survive large position sizing without massive slippage.", icon: DollarSign },
  { name: "Risk Agent", desc: "The defensive bodyguard. It mandates strict 2% max-position sizing logic, calculates strict Risk:Reward ratios (> 1:2), and guarantees disastrous tail-risk is neutralized.", icon: ShieldAlert },
  { name: "Portfolio Agent", desc: "Analyzes cross-correlation data. Ensures the strategy won't incidentally end up trading 10 highly correlated tech stocks at the exact same directional exposure.", icon: BookMarked },
  { name: "Sentiment Agent", desc: "Hooks into news feeds and social chatter, scraping headlines for NLP semantic analysis to gauge fear and greed amongst retail and institutional traders.", icon: BookOpen },
  { name: "Macro Agent", desc: "Reads the room carefully. Incorporates heavy-hitting economic data like CPI inflation readings, GDP numbers, Treasury yields, and central bank interest rate timelines.", icon: Globe },
  { name: "Crypto Agent", desc: "Configured strictly for digital assets. Handles 24/7 weekend operations, on-chain metric analysis, and accounts for crypto-native extreme high-beta volatility.", icon: Bitcoin },
  { name: "Simplifier Agent", desc: "The translator. Takes thousands of points of complex multi-agent calculus and distills it into simple, human-readable plain-English trade rules.", icon: Search },
  { name: "Consensus Agent", desc: "The central intelligence. Collects weighted votes from all 16 sub-agents, resolves internal conflicts, scores the overall confidence, and pulls the final trigger.", icon: Bot }
];

export function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<"basics" | "terms" | "strategies" | "agents">("basics");

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-3">Documentation Repository</h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Master the core concepts of systematic trading, understand risk management, and learn how to leverage QuantSphere's intelligent agent swarm.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-[#141415] p-2 rounded-xl border border-white/5 w-fit">
          {[
            { id: "basics", label: "Basics of Backtesting" },
            { id: "terms", label: "Key Glossary" },
            { id: "strategies", label: "Simple Strategies" },
            { id: "agents", label: "AI Agent Swarm" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-[#141415] border border-white/10 rounded-2xl p-6 md:p-8">
          
          {/* BASICS */}
          {activeTab === "basics" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#a855f7]" /> What is Backtesting?
              </h2>
              <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
                <p>
                  Backtesting is the backbone of quantitative trading. It is the process of testing a trading hypothesis 
                  or strategy using historical market data. Rather than risking real capital on an untested idea, you ask a computer:
                </p>
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl text-white italic pl-6 border-l-4 border-l-[#a855f7]">
                  "If I had bought under these exact conditions, and sold under those exact conditions over the last 2 years, how much money would I have made or lost?"
                </div>
                <h3 className="text-xl font-bold text-gray-200 mt-6">Why is it important?</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><span className="text-[#a855f7] font-semibold">Proof of Concept:</span> Eliminates guesswork and validates concepts purely mathematically.</li>
                  <li><span className="text-[#a855f7] font-semibold">Risk Assessment:</span> Shows exactly how bad your strategy's worst periods (drawdowns) can get.</li>
                  <li><span className="text-[#a855f7] font-semibold">Psychological Confidence:</span> It's easier to execute a trade during a market panic when you know your strategy is mathematically robust over the long term.</li>
                </ul>
                <h3 className="text-xl font-bold text-gray-200 mt-6">The Golden Rules</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Beware of Overfitting:</strong> A strategy tweaked too perfectly to fit history might perform terribly in the live, unseen future. By constantly adding rules just to make past data look better (curve-fitting), you capture "noise" rather than repeatable advantages.</li>
                  <li><strong>Transaction Costs Matter:</strong> Always account for broker commissions and slippage (the difference between expected price and filled price). A strategy making $0.05 profit per trade looks fantastic on paper, but fails the moment real-world exchange fees kick in.</li>
                  <li><strong>Past Performance is not a Guarantee:</strong> Historical success is the best predictor we have, but it is not infallible. Systemic economic shifts (like sudden interest rate hikes or a pandemic) can drastically alter how markets behave, rendering old paradigms obsolete.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TERMS */}
          {activeTab === "terms" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-[#a855f7]" /> Glossary of Terms
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VOCABULARY.map((item, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/5 p-5 rounded-xl hover:border-[#a855f7]/30 transition-colors group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-[#a855f7]/10 text-[#a855f7] rounded-lg group-hover:scale-110 transition-transform">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-200">{item.term}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STRATEGIES */}
          {activeTab === "strategies" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                <Lightbulb className="w-6 h-6 text-[#a855f7]" /> Simple Starting Strategies
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {SIMPLE_STRATEGIES.map((strat, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/5 p-6 rounded-2xl hover:bg-[#1e1e20] transition-colors flex flex-col md:flex-row gap-6 items-start">
                    <div className={cn("p-4 rounded-xl border shrink-0", strat.color)}>
                      <strat.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{strat.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{strat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AGENTS */}
          {activeTab === "agents" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Bot className="w-6 h-6 text-[#a855f7]" /> Technical Agent Swarm
                </h2>
                <div className="px-3 py-1 bg-[#a855f7]/10 text-[#a855f7] rounded-full text-xs font-bold border border-[#a855f7]/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse"></span>
                  {AGENTS.length} Active Modules
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                QuantSphere doesn't rely on a single algorithm. We utilize a swarm consensus model. 
                Each agent has a specific personality and expertise, looking at the same stock from completely different angles before they vote on the final strategy.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {AGENTS.map((agent, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/5 p-5 rounded-xl hover:border-[#a855f7]/50 transition-all hover:-translate-y-1 group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-[#a855f7]/10 text-[#a855f7] rounded-lg">
                        <agent.icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-md font-bold text-white">{agent.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{agent.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}