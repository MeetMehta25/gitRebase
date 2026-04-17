import { useState, useEffect, useRef } from "react";
import type { Agent, DebateMessage } from "../../types";
import { cn, getAgentColor } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  Loader2,
  Play,
  FileText,
  RefreshCw,
  StopCircle,
} from "lucide-react";

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Quant Analyst",
    role: "quant",
    votingWeight: 85,
    currentStance: "",
    isThinking: false,
    avatar: "Q",
  },
  {
    id: "2",
    name: "Risk Analyst",
    role: "risk",
    votingWeight: 90,
    currentStance: "",
    isThinking: false,
    avatar: "R",
  },
  {
    id: "3",
    name: "Macro Strategist",
    role: "macro",
    votingWeight: 70,
    currentStance: "",
    isThinking: false,
    avatar: "M",
  },
  {
    id: "4",
    name: "Liquidity Agent",
    role: "liquidity",
    votingWeight: 60,
    currentStance: "",
    isThinking: false,
    avatar: "L",
  },
  {
    id: "5",
    name: "Arbiter",
    role: "arbitrator",
    votingWeight: 100,
    currentStance: "",
    isThinking: false,
    avatar: "A",
  },
];

const script = [
  {
    agentId: "1",
    text: "Running quantitative analysis. RSI-based mean reversion shows a Sharpe of 1.52 in backtesting. Entry at RSI<30, exit at RSI>70. Statistically significant edge detected.",
  },
  {
    agentId: "3",
    text: "Macro conditions matter here. Current rate environment favors mean reversion strategies. However, if we enter a trending regime, this will underperform significantly.",
  },
  {
    agentId: "2",
    text: "Risk assessment: Max drawdown in simulation reached -18.4%. The strategy has elevated tail risk during flash crashes. Recommend position sizing limits.",
  },
  {
    agentId: "4",
    text: "Liquidity check: For mid-cap universe, slippage estimates are 0.03-0.08%. Execution feasible, but avoid micro-caps where impact would erode alpha.",
  },
  {
    agentId: "5",
    text: "Synthesizing views. Quant edge is statistically valid. Risk and Macro raise valid regime concerns. Recommendation: deploy with 50% capital allocation and regime filter.",
  },
  {
    agentId: "1",
    text: "Agreed. Adding a volatility regime filter (VIX > 30 = pause trading) would address the macro concern while preserving the core edge.",
  },
  {
    agentId: "2",
    text: "Acceptable. With regime filter and position limits, residual risk falls within institutional tolerance. Approving with conditions.",
  },
];

export function DebateTheater() {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "live" | "concluded">("idle");
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (status === "live" && scriptIndex < script.length) {
      timer = setTimeout(() => {
        const line = script[scriptIndex];
        const newMsg: DebateMessage = {
          id: Date.now().toString(),
          agentId: line.agentId,
          text: line.text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setScriptIndex((prev) => prev + 1);
      }, 2500);
    } else if (scriptIndex >= script.length && status === "live") {
      setStatus("concluded");
    }
    return () => clearTimeout(timer);
  }, [status, scriptIndex]);

  const handleStart = () => {
    setStatus("live");
    if (messages.length === 0) {
      setMessages([
        {
          id: "init",
          agentId: "5",
          text: "Council is in session. Topic: RSI Mean Reversion Strategy Evaluation. Quant Analyst, present your findings.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleStop = () => setStatus("concluded");

  const handleReset = () => {
    setMessages([]);
    setScriptIndex(0);
    setStatus("idle");
    setIsGeneratingReport(false);
  };

  const generateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => setIsGeneratingReport(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-3 relative">
      {/* Header & Agent Avatars */}
      <div className="bg-bg-card border border-white/6 rounded-lg p-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                status === "live"
                  ? "bg-accent-red animate-pulse"
                  : "bg-text-secondary/30",
              )}
            />
            Agent Debate Room
          </h2>
          <span className="text-[10px] font-mono text-text-secondary bg-bg-secondary px-2 py-0.5 rounded border border-white/6">
            Strategy Review
          </span>
        </div>

        <div className="flex justify-between items-center px-1">
          {mockAgents.map((agent) => {
            const isSpeaking =
              status === "live" &&
              messages.length > 0 &&
              messages[messages.length - 1].agentId === agent.id;
            return (
              <div
                key={agent.id}
                className="flex flex-col items-center gap-1.5 relative"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full border-2 flex items-center justify-center bg-bg-secondary transition-all duration-300 text-xs font-bold",
                    getAgentColor(agent.role),
                    isSpeaking
                      ? "scale-110 ring-2 ring-white/10"
                      : "opacity-60",
                  )}
                >
                  {agent.avatar}
                </div>
                <span className="text-[8px] text-text-secondary max-w-15 truncate text-center">
                  {agent.name}
                </span>
                {isSpeaking && (
                  <motion.div
                    layoutId="speaking-dot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-green"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-bg-secondary border border-white/6 rounded-lg overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {messages.length === 0 && status === "idle" && (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary/40 gap-2">
                <Gavel className="w-8 h-8" />
                <p className="text-xs">Ready to commence deliberation</p>
              </div>
            )}

            {messages.map((msg) => {
              const agent = mockAgents.find((a) => a.id === msg.agentId);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-2.5 max-w-[95%]",
                    agent?.role === "arbitrator" && "mx-auto max-w-full",
                  )}
                >
                  {agent?.role !== "arbitrator" && (
                    <div
                      className={cn(
                        "mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold border bg-bg-card",
                        getAgentColor(agent?.role || ""),
                      )}
                    >
                      {agent?.avatar}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-text-secondary mb-0.5 ml-0.5">
                      {agent?.name}
                    </span>
                    <div
                      className={cn(
                        "px-3 py-2 text-xs leading-relaxed rounded-lg",
                        agent?.role === "arbitrator"
                          ? "bg-accent-green/10 border border-accent-green/20 text-text-primary text-center"
                          : "bg-bg-card border border-white/6 text-text-primary/90 rounded-tl-none",
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div className="h-2" />
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-bg-card/90 backdrop-blur-sm border border-white/8 rounded-full p-1 flex gap-1.5 pointer-events-auto">
            {status === "idle" && (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-green text-bg-primary text-xs font-semibold hover:bg-accent-green/90 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" /> Commence
              </button>
            )}
            {status === "live" && (
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-red text-white text-xs font-semibold hover:bg-accent-red/90 transition-colors"
              >
                <StopCircle className="w-3 h-3" /> Conclude
              </button>
            )}
            {status === "concluded" && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-full bg-white/6 text-text-secondary hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verdict Panel */}
      <AnimatePresence>
        {status === "concluded" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-bg-card border border-white/6 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-accent-green to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-accent-green/20">
                  82%
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Verdict: Conditionally Approved
                  </h3>
                  <p className="text-[10px] text-text-secondary">
                    Consensus reached with risk conditions.
                  </p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20 font-medium">
                Ready for Execution
              </span>
            </div>

            <div className="bg-bg-secondary rounded-md p-2.5 mb-3 text-[11px] text-text-secondary border border-white/4">
              <span className="font-semibold text-text-primary">Summary:</span>{" "}
              Deploy RSI mean reversion with 50% capital allocation, VIX regime
              filter (pause when VIX &gt; 30), and institutional position sizing
              limits.
            </div>

            <button
              onClick={generateReport}
              disabled={isGeneratingReport}
              className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 bg-accent-green text-bg-primary hover:bg-accent-green/90 transition-colors disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" /> Generate Decision Report
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
