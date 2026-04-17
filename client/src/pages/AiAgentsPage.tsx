import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";

import {
  Send,
  Sparkles,
  Bot,
  FileText,
  Activity,
  TrendingUp,
  Rocket,
  Shield,
  MessageSquare,
  Target,
  Globe,
  Filter,
  BarChart3,
  Zap,
  CheckCircle2,
  Eye,
  Gavel,
  ArrowUp,
  X,
  Loader,
  AlertCircle,
  Mic,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { useStrategyStore } from "../store/strategyStore";
import {
  STRATEGY_QUESTIONS,
  FALLBACK_BACKTEST,
  getStrategyByPrompt,
} from "../data/strategyData";

// --- Types ---
type Message = {
  id: string;
  role: "user" | "agent" | "system";
  agentId?: string;
  content: string | React.ReactNode;
};

type DebateLog = {
  id: string;
  message: string;
  timestamp?: number;
};

interface AgentDef {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: any;
  color: string;
  textColor: string;
  borderColor: string;
}

// --- Agent Definitions (17 Agents) ---
const ALL_AGENTS: AgentDef[] = [
  {
    id: "TrendFollowingAgent",
    name: "Trend Agent",
    role: "Trend Follower",
    description: "Uses moving averages and trend indicators",
    icon: Activity,
    color: "bg-blue-500/10",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/20",
  },
  {
    id: "MomentumAgent",
    name: "Momentum Agent",
    role: "Momentum Analyst",
    description: "Uses RSI, ROC and momentum indicators",
    icon: Rocket,
    color: "bg-pink-500/10",
    textColor: "text-pink-400",
    borderColor: "border-pink-500/20",
  },
  {
    id: "MeanReversionAgent",
    name: "Mean Reversion",
    role: "Reversion Specialist",
    description: "Uses RSI extremes and Bollinger Bands",
    icon: Target,
    color: "bg-purple-500/10",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/20",
  },
  {
    id: "BreakoutAgent",
    name: "Breakout Agent",
    role: "Breakout Trader",
    description: "Detects resistance/support breakouts",
    icon: Zap,
    color: "bg-orange-500/10",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/20",
  },
  {
    id: "VolumeAnalysisAgent",
    name: "Volume Agent",
    role: "Volume Analyst",
    description: "Uses volume spikes and accumulation signals",
    icon: BarChart3,
    color: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/20",
  },
  {
    id: "VolatilityAgent",
    name: "Volatility Agent",
    role: "Volatility Specialist",
    description: "Uses ATR and volatility expansion/compression",
    icon: Activity,
    color: "bg-yellow-500/10",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/20",
  },
  {
    id: "PatternRecognitionAgent",
    name: "Pattern Agent",
    role: "Pattern Recognizer",
    description: "Uses chart patterns like triangles and double bottoms",
    icon: Eye,
    color: "bg-cyan-500/10",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/20",
  },
  {
    id: "StatisticalSignalAgent",
    name: "Stats Agent",
    role: "Statistician",
    description: "Uses statistical indicators like z-score deviations",
    icon: FileText,
    color: "bg-indigo-500/10",
    textColor: "text-indigo-400",
    borderColor: "border-indigo-500/20",
  },
  {
    id: "MarketRegimeAgent",
    name: "Regime Agent",
    role: "Market Regime Analyst",
    description: "Determines market trending, ranging, or volatile",
    icon: Globe,
    color: "bg-gray-500/10",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/20",
  },
  {
    id: "LiquidityAgent",
    name: "Liquidity Agent",
    role: "Liquidity Evaluator",
    description: "Ensures trades are executable based on liquidity",
    icon: Palette,
    color: "bg-teal-500/10",
    textColor: "text-teal-400",
    borderColor: "border-teal-500/20",
  },
  {
    id: "RiskManagementAgent",
    name: "Risk Agent",
    role: "Risk Manager",
    description: "Adds stop loss, take profit, and position sizing",
    icon: Shield,
    color: "bg-amber-500/10",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/20",
  },
  {
    id: "PortfolioAgent",
    name: "Portfolio Agent",
    role: "Portfolio Manager",
    description: "Ensures diversification principles",
    icon: Target,
    color: "bg-violet-500/10",
    textColor: "text-violet-400",
    borderColor: "border-violet-500/20",
  },
  {
    id: "SentimentAgent",
    name: "Sentiment Agent",
    role: "Sentiment Tracker",
    description: "Considers news and social sentiment",
    icon: MessageSquare,
    color: "bg-rose-500/10",
    textColor: "text-rose-400",
    borderColor: "border-rose-500/20",
  },
  {
    id: "MacroAgent",
    name: "Macro Agent",
    role: "Macro Economist",
    description: "Considers macro trends and market indexes",
    icon: Globe,
    color: "bg-lime-500/10",
    textColor: "text-lime-400",
    borderColor: "border-lime-500/20",
  },
  {
    id: "CryptoSpecialistAgent",
    name: "Crypto Agent",
    role: "Crypto Specialist",
    description: "Handles crypto-specific signals if asset is crypto",
    icon: Zap,
    color: "bg-slate-500/10",
    textColor: "text-slate-400",
    borderColor: "border-slate-500/20",
  },
  {
    id: "StrategySimplifierAgent",
    name: "Simplifier Agent",
    role: "Strategy Simplifier",
    description: "Reduces complexity and removes redundant rules",
    icon: Filter,
    color: "bg-fuchsia-500/10",
    textColor: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/20",
  },
  {
    id: "ConsensusStrategyAgent",
    name: "Consensus Agent",
    role: "Final Arbiter",
    description:
      "Collects ideas from all agents and produces final strategy JSON",
    icon: Gavel,
    color: "bg-white/10",
    textColor: "text-white",
    borderColor: "border-white/20",
  },
];

// Default selected agents
const DEFAULT_AGENTS = [
  "TrendFollowingAgent",
  "MomentumAgent",
  "RiskManagementAgent",
  "StrategySimplifierAgent",
];

// --- Hardcoded Conversation Data (8 scenarios) ---
const HARDCODED_CONVERSATIONS = {
  bull_momentum: [
    "Trend Agent: Looking at the chart, I see a clear uptrend with higher highs and higher lows. The 50-day moving average is acting as support. This aligns with a trend-following strategy.",
    "Momentum Agent: RSI is around 55-60, showing sustained but not extreme momentum. This is ideal - not overbought. The price has been accelerating over the last 3 weeks.",
    "Risk Agent: Before we commit, we need to define our downside protection. I recommend a stop loss at the 50-day MA breakage level, approximately 3% below current price. Take profit should be 2x the risk.",
    "Simplifier Agent: The consensus here is clear - momentum continues, trend is up. Our entry signal is price holding above 50-day MA with RSI 40-70. Exit on RSI above 80 or MA break. Simple and effective.",
  ],
  mean_reversion: [
    "Momentum Agent: The asset has moved significantly below the 2-standard deviation Bollinger Band. This often precedes a reversion move. Volume on the down move is decreasing.",
    "Trend Agent: The trend is down, but we're seeing signs of deceleration. Lower lows are becoming shallower. The daily chart suggests we might be forming a bottom.",
    "Mean Reversion Agent: RSI is at 25 - deeply oversold. Historical patterns show this level has reversed within 3-5 bars in 75% of cases. The setup is textbook mean reversion.",
    "Risk Agent: The challenge here is the ongoing downtrend. I'd suggest a tighter stop loss - only 1.5% below the oversold level. Size positions smaller due to higher uncertainty. Profit targets at the 20-day MA.",
    "Simplifier Agent: Clear signal: Buy oversold (RSI < 30), sell at mean (50 MA). This is our core mean reversion strategy. 2:1 reward-risk minimum required for each trade.",
  ],
  breakout_strategy: [
    "Pattern Recognition Agent: I'm observing a symmetrical triangle formation over the last 2 weeks. The price is consolidating between a clear resistance and support. Historically, these break 67% of the time in the direction of the prior trend.",
    "Volatility Agent: ATR has contracted to a 6-month low. Bollinger Bands are compressed. This is classic pre-breakout volatility squeeze. When it breaks, expect a sharp directional move.",
    "Breakout Agent: Buyers are accumulating at this level. I see it in the order book and volume profile. A break above the resistance level on volume would be a strong buy signal.",
    "Risk Agent: Breakout plays are higher risk - false breakouts happen. Entry must be on the breakout confirmed by volume. Stop loss just below the breakout level. This could be a clean 3:1 play.",
    "Simplifier Agent: When consolidation breaks on volume, we trade the direction. Stop loss is tight at the consolidation boundary. Profit at the next resistance level. Clean breakout strategy.",
  ],
  market_sentiment: [
    "Sentiment Agent: Market sentiment has shifted. Fear index dropped sharply in the last 48 hours. Social sentiment on the asset turned positive after CEO announcement. Institutional accumulation detected.",
    "Macro Agent: The broader market context matters - the sector is outperforming. Fund flows are moving into this category. Macro backdrop supports risk-on positioning.",
    "Volume Agent: Volume spiked 3x normal on the last move up. Accumulation is happening. The volume profile shows large buyers at this level.",
    "Risk Agent: Sentiment shifts are tradable but volatile. Position size should reflect this uncertainty. Use wider stops. Ensure this aligns with technicals - sentiment alone isn't enough.",
    "Simplifier Agent: Confluence: improved sentiment + volume support + macro tailwind = bullish bias. We follow technicals for entry, but sentiment confirms we're on the right side of the trade.",
  ],
  scalping_short_term: [
    "Volatility Agent: Intraday volatility is elevated but within normal ranges. VWAP bands are tight - perfect for scalping. The asset shows clean price action between 15-minute support and resistance.",
    "Momentum Agent: Stochastic is in the overbought zone at 82, but this is normal for strong rallies. MACD histograms are still expanding - momentum is still positive.",
    "Pattern Recognition Agent: I see higher lows forming on the 5-minute chart. This is textbook scalping territory. Quick reversals happen each time we hit the upper band.",
    "Risk Agent: With scalping, position size must be tight because pip targets are small. Stop loss at 0.8% maximum. Take profits every 15-20 pips. Multiple small wins compound quickly.",
    "Simplifier Agent: Entry on MA touch, exit on first target. Repeat 5-7 times per market session. Risk 0.2% per trade. Scalping rewards discipline and execution speed.",
  ],
  swing_trading: [
    "Trend Agent: On the daily timeframe, we're in a clear intermediate uptrend. The 200-day MA provides dynamic support. We should hold positions for 3-7 days to capture the bulk of the move.",
    "Volume Agent: Each swing high is being formed on declining volume, suggesting profit-taking. But the overall trend volume is strong - institutions are still accumulating.",
    "Statistics Agent: Fibonacci projection from the last low shows resistance at 105.5 and 112.3. Historical pullbacks in this trend average 8-12 bars before resuming.",
    "Risk Agent: For swing trades, stops go below the most recent swing low. We're risking 1.2% per trade. Position size allows for a 3-4% daily swing without stress.",
    "Simplifier Agent: Hold swings through the trend. Buy dips to MA, sell at resistance zones. Let winners run, cut losers quickly at swing low breaks.",
  ],
  range_bound_trading: [
    "Regime Agent: This market is ranging, not trending. We've been consolidating between 98 and 104 for 6 weeks with clear rejection of both boundaries.",
    "Volume Agent: Volume spikes at the range boundaries - exactly where we want to take profits. Volume at midrange (101) is minimal - no institutional interest there.",
    "Mean Reversion Agent: RSI bounces reliably between 30 and 70 here. Stochastic is also perfectly suited - oversold at 98, overbought at 104. Textbook range trading.",
    "Risk Agent: In ranges, we short near top and buy near bottom. Stop loss is 150 pips above the top and below the bottom. We expect 200-250 pip moves repeatedly.",
    "Simplifier Agent: Buy at 98.5, sell at 103.5. Repeat until the range breaks. Risk-reward is 1:3 minimum. Stay patient with confirmed range breaks on volume.",
  ],
  crypto_volatility: [
    "Crypto Specialist Agent: Bitcoin is showing extreme volatility - 8% daily swings. This is typical for crypto but presents both risk and opportunity for larger position sizing.",
    "Volatility Agent: ATR on daily is at 2000 points - well above average. Bollinger Bands are miles apart. We should expect quick reversals at band extremes.",
    "Sentiment Agent: Social media sentiment has turned bearish suddenly. This often precedes capitulation - a perfect entry signal in crypto cycles. Liquidations are happening.",
    "Risk Agent: Crypto requires tighter risk management due to flash crashes. Stop loss at 2% maximum. Use limit orders, avoid market orders at volatile times. Position size accordingly.",
    "Simplifier Agent: Crypto strategy: scalp the volatility. Buy support on volume dips, sell on any bounce. 24/7 market means we need alerts and tight monitoring.",
  ],
  portfolio_based_strategy: [
    "Portfolio Agent: We're building a diversified 3-leg strategy across correlated assets. This reduces single-stock risk while maintaining upside participation.",
    "Correlation Agent: Tech stock correlations are at 0.85 currently - consider alternatives or hedge with sector inverse correlation assets.",
    "Risk Agent: Portfolio-wide exposure limits us to 2% risk per position. VaR at 95% confidence is well within tolerance. However, tail risks deserve attention.",
    "Liquidity Agent: All positions in this portfolio have excellent liquidity with tight spreads. We can scale in and out without market impact.",
    "Simplifier Agent: Diversified 3-stock portfolio with balanced entries and exits. 20% allocation each stock, rebalance monthly. This approach provides steady returns with lower drawdowns.",
  ],
};

// --- Sub-Components ---

const AgentAvatar = ({
  agent,
  size = "md",
  isSpeaking = false,
}: {
  agent: AgentDef;
  size?: "sm" | "md" | "lg";
  isSpeaking?: boolean;
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 p-1.5",
    md: "w-12 h-12 p-2.5",
    lg: "w-16 h-16 p-3",
  };

  const Icon = agent.icon;

  return (
    <motion.div
      animate={
        isSpeaking
          ? {
              boxShadow: [
                `0 0 0 0px ${agent.textColor.replace("text-", "rgba(").replace("400", "0.4)")}`,
                `0 0 0 10px rgba(0,0,0,0)`,
              ],
              scale: [1, 1.05, 1],
              borderColor: [
                "rgba(255,255,255,0.1)",
                "rgba(255,255,255,0.3)",
                "rgba(255,255,255,0.1)",
              ],
            }
          : {}
      }
      transition={isSpeaking ? { duration: 1.5, repeat: Infinity } : {}}
      className={cn(
        "rounded-full border flex items-center justify-center transition-all duration-300 relative",
        agent.color,
        agent.borderColor,
        sizeClasses[size],
        isSpeaking
          ? "z-10 bg-bg-card/90"
          : "bg-linear-to-br from-white/5 to-transparent backdrop-blur-md",
      )}
    >
      <Icon className={cn("w-full h-full opacity-80", agent.textColor)} />
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-bg-card"
        />
      )}
    </motion.div>
  );
};

// --- Conversation Message Type ---
type ConversationMessage = {
  id: string;
  agentId?: string;
  agentName: string;
  message: string;
  timestamp: number;
  type: "agent" | "system";
};

// --- Rotating Agents Loading Animation ---
const RotatingAgentsLoader = ({ agents }: { agents: AgentDef[] }) => {
  const visibleAgents = agents.slice(0, 6); // Show max 6 agents in rotation

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center w-full h-full gap-8"
    >
      {/* Rotating Circle of Agents */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Background Glow */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl"
        />

        {/* Central Circle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-blue-500/20"
        />

        {/* Fast Rotating Circle */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-purple-500/20"
        />

        {/* Agent Icons Rotating */}
        {visibleAgents.map((agent, idx) => {
          const angle = (idx / visibleAgents.length) * Math.PI * 2;
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={agent.id}
              animate={{
                rotate: 360,
                x: [x, x, x],
                y: [y, y, y],
              }}
              transition={{
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                default: { duration: 0 },
              }}
              className="absolute w-16 h-16"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <AgentAvatar agent={agent} size="lg" />
            </motion.div>
          );
        })}

        {/* Center Logos */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute z-10 w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-2">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-semibold text-white"
        >
          Building Consensus
        </motion.div>
        <p className="text-sm text-white/50">
          {visibleAgents.length} AI agents debating strategy...
        </p>
      </div>

      {/* Animated Dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-blue-500"
          />
        ))}
      </div>
    </motion.div>
  );
};

// --- Chat Message Component ---
const ChatMessage = ({
  msg,
  index,
  isLast,
}: {
  msg: ConversationMessage;
  index: number;
  isLast: boolean;
}) => {
  const agent = msg.agentId
    ? ALL_AGENTS.find((a) => a.id === msg.agentId)
    : null;
  const isAlternateLeft = index % 2 === 0; // Alternate left/right

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        delay: index * 0.15,
      }}
      className={cn(
        "flex gap-4 mb-8 w-full items-start",
        isAlternateLeft ? "justify-start" : "justify-end",
      )}
    >
      {isAlternateLeft && agent && (
        <div className="shrink-0 pt-1">
          <AgentAvatar agent={agent} size="lg" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-3 max-w-xl",
          isAlternateLeft ? "items-start" : "items-end",
        )}
      >
        {agent && (
          <motion.div
            initial={{ opacity: 0, x: isAlternateLeft ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 + 0.1 }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm",
              agent.color,
              agent.textColor,
              agent.borderColor,
              "border",
            )}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {agent.name}
            <span className="text-xs opacity-70 ml-1">({agent.role})</span>
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.15 + 0.05 }}
          className={cn(
            "px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-lg relative backdrop-blur-sm",
            agent
              ? `${agent.color} ${agent.textColor} ${agent.borderColor} border-2`
              : "bg-white/10 text-white border-2 border-white/20",
          )}
        >
          <p className="text-base leading-relaxed">{msg.message}</p>

          {isLast && msg.type === "agent" && (
            <motion.span
              animate={{ opacity: [0.4, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="inline-block ml-2 text-lg"
            >
              ▌
            </motion.span>
          )}
        </motion.div>
      </div>

      {!isAlternateLeft && agent && (
        <div className="shrink-0 pt-1">
          <AgentAvatar agent={agent} size="lg" />
        </div>
      )}
    </motion.div>
  );
};

// --- Conversation Container ---
const ConversationContainer = ({
  messages,
  isLoading,
  containerRef,
}: {
  messages: ConversationMessage[];
  isLoading: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, containerRef]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-3">
        <div className="flex flex-col justify-end min-h-full px-4 py-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center text-white/40">
                <div className="mb-3 text-3xl">💭</div>
                <p className="text-sm font-medium">
                  Waiting for agent responses...
                </p>
                <p className="text-xs mt-2">
                  Agents are building consensus on your strategy
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  index={idx}
                  isLast={isLoading && idx === messages.length - 1}
                />
              ))}
            </>
          )}

          {isLoading && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-1 items-center justify-start ml-20 mt-4"
            >
              <span className="text-xs text-white/40 mr-2">
                Waiting for next agent...
              </span>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-blue-400/60"
                />
              ))}
            </motion.div>
          )}

          <div ref={containerRef} />
        </div>
      </div>
    </div>
  );
};

const extractAgentFromLog = (logMessage: string): AgentDef | null => {
  const patterns = [
    /^([^\s:]+(?:\s+[^\s:]+)?):\s+/, // Agent Name: or Agent Full Name:
    /^[💭🔍✨]\s+([^\s:]+(?:\s+[^\s:]+)?):/, // Emoji prefix (for backward compat)
    /^[✓✗→]\s+([\w\s]+?)\s+(proposal|critique|generated)/i,
    /\[([\w\s]+?)\]/,
    /^([\w\s]+?)\s+(?:proposes|suggests|recommends|critiques)/i,
  ];

  for (const pattern of patterns) {
    const match = logMessage.match(pattern);
    if (match && match[1]) {
      const extractedName = match[1].trim();

      let agent = ALL_AGENTS.find(
        (a) => a.name.toLowerCase() === extractedName.toLowerCase(),
      );
      if (agent) return agent;

      agent = ALL_AGENTS.find((a) =>
        extractedName
          .toLowerCase()
          .includes(a.name.toLowerCase().split(" ")[0]),
      );
      if (agent) return agent;

      agent = ALL_AGENTS.find((a) =>
        a.id
          .toLowerCase()
          .includes(extractedName.toLowerCase().replace(/\s+/g, "")),
      );
      if (agent) return agent;
    }
  }

  return null;
};

const cleanMessage = (text: string): string => {
  return text
    .replace(/^[^\s:]+(?:\s+[^\s:]+)?:\s+/, "") // Remove "Agent Name: " prefix (no emojis)
    .replace(/^[💭🔍✨]\s+/, "") // Remove emoji prefixes (for backward compat)
    .replace(/^[✓✗→]\s+/, "") // Remove status symbols
    .replace(/\s+(proposal|critique)\s+(generated|provided)/gi, "") // Remove type indicators
    .replace(/^\[.+?\]\s+/, "") // Remove brackets
    .trim();
};

const ConversationLog = ({
  logs,
  isLoading,
  containerRef,
}: {
  logs: DebateLog[];
  isLoading: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const conversationMessages: ConversationMessage[] = logs.map((log) => {
    const agent = extractAgentFromLog(log.message);
    const cleanedMessage = cleanMessage(log.message);

    return {
      id: log.id,
      agentId: agent?.id,
      agentName: agent?.name || "Unknown Agent",
      message: cleanedMessage || log.message,
      timestamp: log.timestamp || Date.now(),
      type: "agent",
    };
  });

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages, containerRef]);

  return (
    <ConversationContainer
      messages={conversationMessages}
      isLoading={isLoading}
      containerRef={containerRef}
    />
  );
};

const AgentSelectionCard = ({
  agent,
  isSelected,
  onClick,
}: {
  agent: AgentDef;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl border p-5 flex flex-col items-center text-center transition-all duration-300 relative overflow-hidden min-h-40 bg-bg-card/70 backdrop-blur-md",
        isSelected
          ? `border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-bg-card/95 ring-2 ring-blue-500/20`
          : "border-white/6 hover:border-white/12 hover:bg-bg-card",
      )}
    >
      {/* Glow effect when selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            layoutId={`glow-${agent.id}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-purple-500/10 pointer-events-none rounded-xl"
          />
        )}
      </AnimatePresence>

      <div className="mb-3 mt-1 shrink-0 relative z-10">
        <AgentAvatar agent={agent} size="md" />
      </div>

      <h3 className="font-semibold text-sm text-white/90 leading-tight mb-1.5 relative z-10">
        {agent.name}
      </h3>
      <p className="text-xs text-white/40 leading-relaxed line-clamp-2 w-full relative z-10">
        {agent.description}
      </p>

      <motion.div
        animate={
          isSelected ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }
        }
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute top-3 right-3 w-5 h-5 rounded-full border border-blue-500 bg-blue-500 flex items-center justify-center"
      >
        <CheckCircle2 className="w-3 h-3 text-white" />
      </motion.div>
    </motion.div>
  );
};

export function AiAgentsPage() {
  const navigate = useNavigate();
  const { addPoints } = useProfile();

  const [viewMode, setViewMode] = useState<
    "intro" | "summoning" | "selection" | "debate"
  >("intro");
  const [inputValue, setInputValue] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] =
    useState<string[]>(DEFAULT_AGENTS);
  const [revealedAgentIndex, setRevealedAgentIndex] = useState(-1);
  const [summoningComplete, setSummoningComplete] = useState(false);

  const [messages] = useState<Message[]>([]);
  const [debateLogs, setDebateLogs] = useState<DebateLog[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Select hardcoded conversation based on user goal keywords
  const selectHardcodedConversation = (goal: string): string[] => {
    const lowerGoal = goal.toLowerCase();

    // Try to match to specific conversation types
    if (
      lowerGoal.includes("scalp") ||
      lowerGoal.includes("day trade") ||
      lowerGoal.includes("short-term") ||
      lowerGoal.includes("quick")
    ) {
      return HARDCODED_CONVERSATIONS["scalping_short_term"];
    } else if (
      lowerGoal.includes("swing") ||
      lowerGoal.includes("3-7 day") ||
      lowerGoal.includes("hold")
    ) {
      return HARDCODED_CONVERSATIONS["swing_trading"];
    } else if (
      lowerGoal.includes("range") ||
      lowerGoal.includes("consolidat") ||
      lowerGoal.includes("bound")
    ) {
      return HARDCODED_CONVERSATIONS["range_bound_trading"];
    } else if (
      lowerGoal.includes("crypto") ||
      lowerGoal.includes("bitcoin") ||
      lowerGoal.includes("ethereum")
    ) {
      return HARDCODED_CONVERSATIONS["crypto_volatility"];
    } else if (
      lowerGoal.includes("portfolio") ||
      lowerGoal.includes("diversif") ||
      lowerGoal.includes("multi-leg")
    ) {
      return HARDCODED_CONVERSATIONS["portfolio_based_strategy"];
    } else if (
      lowerGoal.includes("bull") ||
      lowerGoal.includes("momentum") ||
      lowerGoal.includes("trend up") ||
      lowerGoal.includes("bullish")
    ) {
      return HARDCODED_CONVERSATIONS["bull_momentum"];
    } else if (
      lowerGoal.includes("revers") ||
      lowerGoal.includes("oversold") ||
      lowerGoal.includes("mean") ||
      lowerGoal.includes("bottom")
    ) {
      return HARDCODED_CONVERSATIONS["mean_reversion"];
    } else if (
      lowerGoal.includes("break") ||
      lowerGoal.includes("pattern") ||
      lowerGoal.includes("resistance") ||
      lowerGoal.includes("support")
    ) {
      return HARDCODED_CONVERSATIONS["breakout_strategy"];
    } else if (
      lowerGoal.includes("sentiment") ||
      lowerGoal.includes("news") ||
      lowerGoal.includes("flow") ||
      lowerGoal.includes("macro")
    ) {
      return HARDCODED_CONVERSATIONS["market_sentiment"];
    }

    // Default to bull momentum
    return HARDCODED_CONVERSATIONS["bull_momentum"];
  };

  // Handle initial prompt submission - start summoning animation
  const handleIntroSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      // 1) Validate the prompt immediately via the backend
      const resp = await fetch("/api/validate_prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputValue.trim() }),
      });

      if (!resp.ok) {
        if (resp.status === 400) {
          const errData = await resp.json().catch(() => ({}));
          setError(
            errData.error || "Please provide a valid trading strategy request.",
          );
        } else {
          setError("Failed to validate prompt. Please try again.");
        }
        setIsLoading(false);
        return; // Abort and do not proceed to selection/summoning
      }
    } catch (err) {
      console.error("Validation error:", err);
      // Optional: block if there's a network error, or let it proceed
      // We block and show network error here:
      setError("Network error while validating prompt.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    setUserGoal(inputValue);
    setViewMode("summoning");
    setRevealedAgentIndex(-1);
    setSummoningComplete(false);

    // Start the dramatic reveal animation
    let index = 0;
    const revealInterval = setInterval(() => {
      setRevealedAgentIndex(index);
      index++;

      if (index >= ALL_AGENTS.length) {
        clearInterval(revealInterval);

        // After all agents revealed, show completion and transition
        setTimeout(() => {
          setSummoningComplete(true);
          // Pre-select 4 random agents
          const shuffled = [...ALL_AGENTS].sort(() => Math.random() - 0.5);
          const randomFour = shuffled.slice(0, 4).map((a) => a.id);
          setSelectedAgentIds(randomFour);

          // Transition to selection after a dramatic pause
          setTimeout(() => {
            setViewMode("selection");
          }, 2500);
        }, 800);
      }
    }, 180); // 180ms per agent for dramatic effect
  };

  const toggleAgent = (id: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Stream debate logs progressively with agent highlighting
  const streamDebateLogs = async (logsArray: string[]) => {
    if (!logsArray || logsArray.length === 0) return;

    const delays = [1500]; // First log after 1500ms
    for (let i = 1; i < logsArray.length; i++) {
      // Random delay between 2500-4500ms for subsequent logs (more delay!)
      delays.push(2500 + Math.random() * 2000);
    }

    for (let i = 0; i < logsArray.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, delays[i]));

      // Extract agent info for highlighting
      const agent = extractAgentFromLog(logsArray[i]);

      // Set agent as currently speaking
      if (agent) {
        setActiveSpeakerId(agent.id);
      }

      setDebateLogs((prev) => [
        ...prev,
        {
          id: `log-${i}`,
          message: logsArray[i],
          timestamp: Date.now(),
        },
      ]);

      // Keep agent highlighted for longer after message
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Clear active speaker after debate finishes
    setActiveSpeakerId(null);
  };

  // Call backend API and navigate to results
  const startDebate = async () => {
    if (selectedAgentIds.length === 0) return;

    setViewMode("debate");
    setIsLoading(true);
    setError(null);
    setDebateLogs([]);

    const activeAgents = ALL_AGENTS.filter((a) =>
      selectedAgentIds.includes(a.id),
    );
    let debateConversation: string[] = [];
    let strategyData: any = null;

    try {
      // FIRST: Try to call backend API
      setError(null);
      console.log("Starting backend API call...");

      try {
        const response = await fetch(
          "http://localhost:5000/api/pipeline_full",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              prompt: userGoal,
              selected_agents: activeAgents.map(a => a.id) 
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log("Backend API successful!");
            console.log("🔥 RAW API RESPONSE:", data);
            console.log("🔥 debate_log:", data?.data?.debate_log);
            // Use backend debate logs if available
            debateConversation = data.data.debate_log || [];
            strategyData = data.data;
          } else {
            console.log("Backend returned no data, using fallback");
            throw new Error("❌ Backend failed — fallback disabled");
          }
        } else {
          if (response.status === 400) {
            const errData = await response.json().catch(() => ({}));
            setError(errData.error || "Please provide a valid trading strategy request.");
            setIsLoading(false);
            setViewMode("selection");
            return;
          }
          console.log("Backend API failed, using fallback");
          debateConversation = selectHardcodedConversation(userGoal);
        }
      } catch (apiErr) {
        console.log("Backend API error, using fallback:", apiErr);
        debateConversation = selectHardcodedConversation(userGoal);
      }

      // If no conversation was set, use hardcoded one
      if (!debateConversation || debateConversation.length === 0) {
        debateConversation = selectHardcodedConversation(userGoal);
      }

      // Stream the conversation (from backend or hardcoded) with realistic timing
      streamDebateLogs(debateConversation);

      // Calculate and wait for logs to finish streaming (with increased delays)
      // First message: 1500ms, subsequent: 2500-4500ms, plus 500ms highlight each
      const avgDelay =
        1500 + (debateConversation.length - 1) * (3500 + 500) + 2000; // Extra 2s buffer

      await new Promise((resolve) => setTimeout(resolve, avgDelay));

      setIsLoading(false);
      setIsTyping(false);
      setActiveSpeakerId(null);

      // If backend didn't provide strategy data, create one
      if (!strategyData) {
        const matchedStrategy = getStrategyByPrompt(userGoal);
        const strategyId = matchedStrategy?.id || 1;

        strategyData = {
          ...FALLBACK_BACKTEST[strategyId],
          strategy_id: `debate-${Date.now()}`,
          ticker: matchedStrategy?.ticker || "RELIANCE.NS",
          goal: matchedStrategy?.goal || "momentum",
          risk_level: matchedStrategy?.risk_level || "moderate",
          prompt: userGoal,
          strategy_from_debate: {
            strategy_name: matchedStrategy?.short_name || "Generated Strategy",
            indicators:
              FALLBACK_BACKTEST[strategyId]?.summary?.indicators_used || [],
            entry_conditions: [{ indicator: "RSI", operator: "<", value: 30 }],
            exit_conditions: [{ indicator: "RSI", operator: ">", value: 70 }],
          },
          debate_agents_used: activeAgents.map((a) => a.name),
          debate_log: debateConversation,
        };
      }

      // Store in Zustand
      useStrategyStore.getState().setCurrentStrategy(strategyData);

      addPoints(50, "Strategy Analysis Complete! Excellent start!");

      // Add completion animation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to strategy results page
      navigate("/strategy-results", {
        state: {
          strategy: strategyData,
          strategyId: strategyData.strategy_id,
          agents: activeAgents.map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
          })),
        },
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Debate error:", errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      setIsTyping(false);

      setDebateLogs((prev) => [
        ...prev,
        {
          id: `log-error`,
          message: `Error: ${errorMessage}`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // --- Render: Intro Screen ---
  if (viewMode === "intro") {
    return (
      <div className="flex flex-col h-full w-full relative z-10 overflow-hidden bg-[#050505]">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              initial={{
                x: Math.random() * 1400,
                y: Math.random() * 900,
                opacity: 0,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Background glow */}
        <motion.div
          className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col items-center pt-16 px-4 w-full max-w-5xl mx-auto relative z-10"
          >
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="relative mb-12"
            >
              <div className="relative w-20 h-20 bg-linear-to-br from-purple-500/30 to-blue-500/20 shadow-[0_0_40px_rgba(168,85,247,0.25)] border border-purple-500/20 rounded-full flex items-center justify-center">
                <Bot className="w-10 h-10 text-purple-400" />
              </div>
              {/* Glow rings */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-500/40"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-500/20"
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 flex items-center gap-2 justify-center"
            >
              <Sparkles className="w-8 h-8 text-purple-400" />
              What strategy shall we build?
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-white/60 text-center mb-12 max-w-2xl text-lg"
            >
              Describe your trading goal and I'll summon the perfect agents for
              your strategy debate
            </motion.p>

            {/* Input Area */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="w-full max-w-2xl mb-8"
            >
              <form
                onSubmit={handleIntroSubmit}
                className="relative flex items-center bg-[#1E1E1E] border border-white/10 hover:border-white/20 rounded-2xl p-3 focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all"
              >
                <div className="pl-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. RSI mean reversion, buy < 30, sell > 70..."
                  className="flex-1 bg-transparent border-none px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-0 text-base"
                />
                <button
                  type="button"
                  className="p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-xl transition-colors"
                  title="Voice Input"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-xl bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:hover:bg-purple-500 disabled:cursor-not-allowed shrink-0 mr-1 shadow-lg"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </motion.button>
              </form>
              
              {/* Display Validation Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg text-red-400 text-sm flex items-center gap-3 w-full backdrop-blur-sm self-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    type="button"
                    className="text-red-400/60 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Quick Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-3 w-full mb-8"
            >
              {[
                {
                  icon: TrendingUp,
                  label: "Momentum Strategy",
                  prompt:
                    "Create a momentum swing trading strategy for RELIANCE.NS using RSI and MACD.",
                },
                {
                  icon: Activity,
                  label: "Trend Follower",
                  prompt:
                    "Generate a low-risk trend-following strategy for INFY.NS using moving averages.",
                },
                {
                  icon: Zap,
                  label: "Breakout",
                  prompt:
                    "Build a volatility breakout strategy for TCS.NS using Bollinger Bands and ATR.",
                },
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      borderColor: "rgba(168, 85, 247, 0.5)",
                    }}
                    onClick={() => setInputValue(item.prompt)}
                    className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/80 text-sm hover:bg-white/10 flex items-center gap-2 transition-all"
                  >
                    <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <IconComponent className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                    {item.label}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Recommended Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="w-full max-w-4xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-white/40 text-sm font-medium">
                  Suggested Strategies
                </span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {STRATEGY_QUESTIONS.slice(0, 4).map((sq, idx) => (
                  <motion.button
                    key={sq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + idx * 0.1 }}
                    whileHover={{
                      scale: 1.02,
                      borderColor: "rgba(168, 85, 247, 0.3)",
                    }}
                    onClick={() => setInputValue(sq.prompt)}
                    className="text-left p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-all flex justify-between items-start gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {sq.ticker}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {sq.risk_level}
                        </span>
                      </div>
                      <span className="leading-relaxed line-clamp-2">
                        {sq.prompt}
                      </span>
                    </div>
                    <ArrowUp className="w-4 h-4 text-white/20 group-hover:text-purple-400 shrink-0 mt-0.5 rotate-45" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // --- Render: Summoning Animation Screen ---
  if (viewMode === "summoning") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
        {/* Background pulse */}
        <motion.div
          className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8 relative z-10"
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            animate={{
              textShadow: [
                "0 0 10px rgba(168,85,247,0)",
                "0 0 20px rgba(168,85,247,0.5)",
                "0 0 10px rgba(168,85,247,0)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Summoning the Council
          </motion.h2>
          <p className="text-white/60 text-sm max-w-md">
            "{userGoal.length > 60 ? userGoal.slice(0, 60) + "..." : userGoal}"
          </p>
        </motion.div>

        {/* Agent Grid - Dramatic Reveal */}
        <div className="grid grid-cols-6 md:grid-cols-9 gap-4 md:gap-5 max-w-5xl w-full px-4 mb-8 relative z-10">
          {ALL_AGENTS.map((agent, index) => {
            const isRevealed = index <= revealedAgentIndex;
            const isSelected =
              summoningComplete && selectedAgentIds.includes(agent.id);

            return (
              <motion.div
                key={agent.id}
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{
                  scale: isRevealed ? 1 : 0,
                  opacity: isRevealed ? 1 : 0,
                  rotate: isRevealed ? 0 : -180,
                }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
                className={cn(
                  "flex flex-col items-center transition-all duration-300",
                )}
              >
                <div
                  className={cn(
                    "relative rounded-full p-1 transition-all duration-500",
                    isSelected
                      ? "ring-4 ring-purple-500 ring-offset-2 ring-offset-[#050505] shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                      : isRevealed && "shadow-lg",
                  )}
                >
                  <div
                    className={cn(
                      "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all backdrop-blur-sm",
                      agent.color,
                      agent.borderColor,
                      isRevealed && !isSelected && "opacity-60",
                      isSelected && "ring-1 ring-purple-400/50",
                    )}
                  >
                    <agent.icon
                      className={cn("w-7 h-7 md:w-8 md:h-8", agent.textColor)}
                    />
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring" }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] md:text-xs font-semibold mt-2 text-center leading-tight transition-colors",
                    isSelected ? "text-purple-400 font-bold" : "text-white/50",
                  )}
                >
                  {agent.name.split(" ")[0]}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <motion.div className="w-72 h-2 bg-white/10 rounded-full overflow-hidden mb-6 relative z-10">
          <motion.div
            className="h-full bg-linear-to-r from-purple-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, ((revealedAgentIndex + 1) / ALL_AGENTS.length) * 100)}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          {summoningComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center relative z-10"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6 }}
                className="mb-2"
              >
                <span className="text-3xl">✨</span>
              </motion.div>
              <p className="text-xl font-bold text-white mb-2">
                Council Assembled
              </p>
              <p className="text-white/60 text-sm">
                {selectedAgentIds.length} agents selected for your mission
              </p>
            </motion.div>
          ) : (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/60 text-sm relative z-10"
            >
              Scanning {revealedAgentIndex + 1} of {ALL_AGENTS.length} agents...
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- Render: Agent Selection Screen ---
  if (viewMode === "selection") {
    return (
      <div className="h-full flex flex-col relative z-10 overflow-hidden">
        {/* Selection Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-12 max-w-7xl mx-auto w-full animate-in fade-in duration-500 relative z-10 scrollbar-hide flex flex-col items-center">
          {/* Selection Header Title with animated entrance */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 w-full"
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              Select Your Council
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
              Choose agents to debate your trading strategy. The selected
              council will analyze your approach from multiple perspectives.
            </p>
          </motion.div>

          {/* Agent grid area with staggered entrance */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full max-w-7xl mx-auto mb-10"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.2,
                },
              },
            }}
          >
            {ALL_AGENTS.map((agent) => (
              <motion.div
                key={agent.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.85, y: 10 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { duration: 0.4, ease: "easeOut" },
                  },
                }}
              >
                <AgentSelectionCard
                  agent={agent}
                  isSelected={selectedAgentIds.includes(agent.id)}
                  onClick={() => toggleAgent(agent.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Non-sticky bottom controls with animated entrance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex justify-center z-20 w-full mt-4"
          >
            <motion.div
              whileHover={{
                boxShadow: "0 8px 32px rgba(37, 99, 235, 0.2)",
              }}
              className="flex gap-4 md:gap-6 items-center px-5 md:px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                />
                <span className="text-sm text-white/80 font-medium tracking-wide">
                  {selectedAgentIds.length} Agent
                  {selectedAgentIds.length !== 1 ? "s" : ""} Ready
                </span>
              </div>
              <div className="w-px h-6 bg-white/15" />
              <motion.button
                onClick={startDebate}
                disabled={selectedAgentIds.length === 0 || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    Run <ArrowUp className="w-4 h-4 text-white/80" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- Render: Active Debate Room ---
  const activeAgents = ALL_AGENTS.filter((a) =>
    selectedAgentIds.includes(a.id),
  );

  return (
    <div className="h-full flex flex-col relative max-w-5xl mx-auto w-full overflow-hidden z-10">
      {/* 1. The Stage (Top Bar) - Hide once debate starts */}
      {debateLogs.length === 0 && (
        <div className="flex-none pt-6 pb-4 px-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setViewMode("selection")}
              disabled={isLoading}
              className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Change Team
            </button>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/60">
                {activeAgents.length} Agents Active
              </span>
              {isLoading && (
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400 flex items-center gap-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  Processing
                </span>
              )}
            </div>
          </div>

          {/* The Seating Area */}
          <div className="flex justify-center items-end gap-4 md:gap-6 min-h-25 pb-2 overflow-x-auto scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {activeAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col items-center gap-2 relative min-w-15"
                >
                  <AgentAvatar
                    agent={agent}
                    size="lg"
                    isSpeaking={activeSpeakerId === agent.id}
                  />
                  <div className="text-center h-8 flex flex-col justify-start">
                    <span className="text-[10px] font-medium text-white/60 block truncate w-16">
                      {agent.name}
                    </span>
                    {activeSpeakerId === agent.id && (
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5"
                      >
                        Speaking
                      </motion.span>
                    )}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 2. Error Message (if any) */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 text-red-400 text-sm flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-400/60 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* 3. Main Chat Feed - Show Debate Logs */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 flex flex-col items-center justify-center scrollbar-hide">
        {debateLogs.length === 0 && isLoading ? (
          <RotatingAgentsLoader agents={activeAgents} />
        ) : debateLogs.length > 0 ? (
          <ConversationLog
            logs={debateLogs}
            isLoading={isLoading}
            containerRef={logsContainerRef}
          />
        ) : null}
      </div>

      {/* 4. Input Area (Disabled during debate) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#050505] via-[#050505]/90 to-transparent pointer-events-none flex justify-center">
        <div className="max-w-3xl w-full pointer-events-auto">
          <div className="relative flex items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl">
            <input
              type="text"
              disabled
              placeholder="Strategy generation in progress..."
              className="flex-1 bg-transparent border-none px-5 py-4 text-white/30 focus:outline-none focus:ring-0 text-lg cursor-not-allowed"
            />
            <button
              disabled
              className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-white/20 transition-all cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
