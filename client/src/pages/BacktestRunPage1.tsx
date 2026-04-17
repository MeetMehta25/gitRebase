import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useStrategyStore } from "../store/strategyStore";
import {
  FALLBACK_BACKTEST,
  getStrategyByPrompt,
  getBacktestWorkflowNodes,
  type BacktestExecNode,
} from "../data/strategyData";
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Bot,
  Circle,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BacktestResults } from "../components/backtest/BacktestResults";

// ─── Types ───────────────────────────────────────────────────────────────────
type Stage = "running" | "completing" | "results";

function generateEquityData(count: number) {
  const data = [];
  let equity = 100000;
  let benchmark = 100000;
  for (let i = 0; i < count; i++) {
    const year = 2014 + (i / count) * 10;
    const noise = (Math.random() - 0.45) * 1200;
    const trend = i * 14;
    equity = Math.max(equity + noise + trend * 0.15, equity * 0.97);
    benchmark += (Math.random() - 0.47) * 800 + 80;
    data.push({
      year: year.toFixed(1),
      equity: Math.round(equity),
      benchmark: Math.round(benchmark),
    });
  }
  return data;
}

const FULL_EQUITY_DATA = generateEquityData(200);

// ─── Execution Chart ─────────────────────────────────────────────────────────
function ExecutionChart({ progress }: { progress: number }) {
  const visibleCount = Math.max(
    5,
    Math.floor((progress / 100) * FULL_EQUITY_DATA.length),
  );
  const data = FULL_EQUITY_DATA.slice(0, visibleCount);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00c896" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#00c896" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="benchGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#4a9eff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="year" hide />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#17181c",
            borderColor: "rgba(255,255,255,0.06)",
            borderRadius: "8px",
            fontSize: "11px",
          }}
        />
        <Area
          type="monotone"
          dataKey="benchmark"
          stroke="#4a9eff"
          strokeWidth={1.5}
          fill="url(#benchGradient)"
          strokeDasharray="4 4"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="#00c896"
          strokeWidth={2}
          fill="url(#equityGradient)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Strategy Workflow Execution Visualizer ──────────────────────────────────
function WorkflowExecutionVisualizer({
  nodes,
  activeNodeIndex,
}: {
  nodes: BacktestExecNode[];
  activeNodeIndex: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active node
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(
        `[data-node-idx="${activeNodeIndex}"]`,
      );
      activeEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeNodeIndex]);

  const typeColors: Record<
    string,
    { border: string; text: string; bg: string; glow: string }
  > = {
    trigger: {
      border: "border-emerald-500/40",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    },
    condition: {
      border: "border-amber-500/40",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    },
    action: {
      border: "border-blue-500/40",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    },
    data: {
      border: "border-purple-500/40",
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    },
    signal: {
      border: "border-cyan-500/40",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.4)]",
    },
  };

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-2 p-4 overflow-y-auto h-full"
    >
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 flex items-center gap-2">
        <Activity className="w-3 h-3" /> Execution Flow
      </h3>
      {nodes.map((node, i) => {
        const isActive = i === activeNodeIndex;
        const isDone = i < activeNodeIndex;
        const colors = typeColors[node.type] || typeColors.action;

        return (
          <div
            key={node.id}
            data-node-idx={i}
            className="flex flex-col items-center gap-1 w-full"
          >
            <motion.div
              animate={
                isActive
                  ? {
                      scale: [1, 1.03, 1],
                      boxShadow: [
                        "0 0 0px rgba(74,158,255,0)",
                        "0 0 18px rgba(74,158,255,0.35)",
                        "0 0 0px rgba(74,158,255,0)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 3, repeat: Infinity }}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border backdrop-blur-md transition-all duration-300",
                isActive
                  ? cn(colors.border, colors.glow, "bg-white/10")
                  : isDone
                    ? "border-white/10 bg-white/5 opacity-60"
                    : "border-white/5 bg-white/2 opacity-25",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-all",
                    isActive
                      ? "bg-accent-green animate-pulse"
                      : isDone
                        ? "bg-accent-green"
                        : "bg-white/20",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-[8px] font-bold uppercase tracking-widest mb-0.5",
                      isActive ? colors.text : "text-white/40",
                    )}
                  >
                    {node.type}
                  </div>
                  <div
                    className={cn(
                      "text-xs font-medium truncate",
                      isActive ? "text-white" : "text-white/50",
                    )}
                  >
                    {node.label}
                  </div>
                  {node.sublabel && (
                    <div
                      className={cn(
                        "text-[10px] mt-0.5 truncate",
                        isActive ? "text-white/50" : "text-white/25",
                      )}
                    >
                      {node.sublabel}
                    </div>
                  )}
                </div>
                {isDone && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                  </motion.div>
                )}
              </div>
              {/* Progress bar inside active node */}
              {isActive && (
                <motion.div
                  className="mt-2 h-0.5 rounded-full bg-linear-to-r from-accent-green to-transparent"
                  animate={{ width: ["0%", "100%"] }}
                  transition={{
                    duration: 100 / nodes.length / 10,
                    ease: "linear",
                  }}
                />
              )}
            </motion.div>

            {/* Connector line */}
            {i < nodes.length - 1 && (
              <div
                className={cn(
                  "w-0.5 h-2 transition-colors duration-300",
                  isDone ? "bg-accent-green/40" : "bg-white/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Progress Strip ──────────────────────────────────────────────────────────
function ProgressStrip({
  progress,
  tradeCount,
  dataPoints,
}: {
  progress: number;
  tradeCount: number;
  dataPoints: string;
}) {
  const stats = [
    {
      label: "Progress",
      value: `${Math.min(progress, 100).toFixed(1)}%`,
      sublabel: "",
    },
    { label: "Data Points", value: dataPoints, sublabel: "processed" },
    { label: "Trades", value: String(tradeCount), sublabel: "executed" },
    {
      label: "Status",
      value: progress >= 100 ? "Complete" : "Running",
      sublabel: "",
    },
  ];

  return (
    <div className="h-12 bg-[#0d0d0e] border-t border-white/6 flex items-center px-6 gap-8 shrink-0">
      {/* Progress bar */}
      <div className="flex-1 max-w-xs">
        <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-accent-blue to-accent-green"
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-2">
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">
              {stat.label}
            </div>
            <div className="text-sm font-mono text-text-primary font-medium">
              {stat.value}
              <span className="text-[10px] text-text-muted ml-1">
                {stat.sublabel}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stress Test Modal ────────────────────────────────────────────────────────
function StressTestModal({ onComplete }: { onComplete: () => void }) {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const agents = [
    {
      id: "crisis_injection_agent",
      name: "Crisis Injection Agent",
      modifiedOutput: {
        indicators: ["RSI", "EMA", "MACD"],
        entry_conditions: [{ indicator: "RSI", operator: "<", value: 30 }],
        exit_conditions: [{ indicator: "RSI", operator: ">", value: 70 }],
        stop_loss_pct: 0.08,
        position_size: 0.1,
      },
    },
    {
      id: "liquidity_shock_agent",
      name: "Liquidity Shock Agent",
      modifiedOutput: {
        indicators: ["RSI", "EMA", "MACD", "VOLUME"],
        entry_conditions: [
          { indicator: "RSI", operator: "between", value: [20, 80] },
        ],
        exit_conditions: [
          { indicator: "VOLUME", operator: "<", value: "SMA_20" },
        ],
        stop_loss_pct: 0.05,
        position_size: 0.05,
      },
    },
    {
      id: "crowding_risk_agent",
      name: "Crowding Risk Agent",
      modifiedOutput: {
        indicators: ["RSI", "EMA", "MACD", "MFI"],
        entry_conditions: [{ indicator: "MFI", operator: ">", value: 20 }],
        exit_conditions: [{ indicator: "RSI", operator: ">", value: 70 }],
        stop_loss_pct: 0.05,
        position_size: 0.1,
      },
    },
    {
      id: "adversarial_agent",
      name: "Adversarial Agent",
      modifiedOutput: {
        indicators: ["RSI", "EMA", "MACD", "BOLLINGER_BAND"],
        entry_conditions: [
          { indicator: "BOLLINGER_BAND", operator: "squeeze" },
        ],
        exit_conditions: [
          { indicator: "RSI", operator: ">", value: 70 },
          { indicator: "VOLUME", operator: "<", value: "SMA_20" },
        ],
        stop_loss_pct: 0.05,
        position_size: 0.1,
      },
    },
  ];

  useEffect(() => {
    if (currentAgentIndex < agents.length) {
      const timer = setTimeout(() => {
        setCurrentAgentIndex((prev) => prev + 1);
      }, 4000); // Increased from 2.5s to 4s to feel more like real processing
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentAgentIndex, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="bg-[#0f1013] border border-white/10 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          Running Adversarial Stress-Test Agents
        </h2>
        <p className="text-sm text-white/50 mb-6">
          Subjecting strategy to extreme market conditions and structural
          anomalies.
        </p>

        <div className="space-y-4">
          {agents.map((agent, i) => {
            const isDone = i < currentAgentIndex;
            const isActive = i === currentAgentIndex;

            return (
              <div key={agent.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full shrink-0"
                    />
                  ) : (
                    <Circle className="w-5 h-5 text-white/10 shrink-0" />
                  )}
                  <div
                    className={cn(
                      "text-sm transition-colors duration-500",
                      isDone
                        ? "text-white/80"
                        : isActive
                          ? "text-white font-medium"
                          : "text-white/30",
                    )}
                  >
                    {agent.name}
                  </div>
                </div>

                <AnimatePresence>
                  {(isDone || isActive) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="overflow-hidden pl-8"
                    >
                      <pre className="text-[11px] text-accent-green/90 bg-black/50 p-4 rounded-lg border border-white/5 font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(agent.modifiedOutput, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export function BacktestRunPage1() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStrategy } = useStrategyStore();

  // Read strategy data from location state, store, or fallback
  const strategyData = location.state?.strategy || currentStrategy;
  const strategyId =
    location.state?.strategyId ||
    getStrategyByPrompt(strategyData?.ticker || strategyData?.prompt || "")
      ?.id ||
    1;
  const backtestResult =
    location.state?.backtestResult ||
    strategyData?.backtest_result ||
    strategyData?.metrics
      ? strategyData
      : FALLBACK_BACKTEST[strategyId];
  const strategyName =
    strategyData?.ticker && strategyData?.goal
      ? `${strategyData.ticker} ${strategyData.goal.charAt(0).toUpperCase() + strategyData.goal.slice(1)}`
      : "Momentum Reversion Alpha";

  // Get strategy-specific workflow nodes
  const workflowNodes = useMemo(
    () => getBacktestWorkflowNodes(strategyId),
    [strategyId],
  );

  const [stage, setStage] = useState<Stage>("running");
  const [progress, setProgress] = useState(0);
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [showStressTestModal, setShowStressTestModal] = useState(false);

  // Progress simulation
  useEffect(() => {
    if (stage !== "running") return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage("completing");
          return 100;
        }
        return prev + 0.4 + Math.random() * 0.3;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [stage]);

  // Trade count from strategy fallback data
  useEffect(() => {
    if (stage !== "running") return;
    const fb = FALLBACK_BACKTEST[strategyId];
    const totalTrades = fb?.metrics?.trade_stats?.total_trades || 47;
    setTradeCount(Math.floor((progress / 100) * totalTrades));
  }, [progress, stage, strategyId]);

  // Node cycling — step through each node proportionally to progress
  useEffect(() => {
    if (stage !== "running") return;
    const idx = Math.min(
      Math.floor((progress / 100) * workflowNodes.length),
      workflowNodes.length - 1,
    );
    setActiveNodeIndex(idx);
  }, [progress, stage, workflowNodes.length]);

  // Completion transition
  useEffect(() => {
    if (stage === "completing") {
      const timer = setTimeout(() => setStage("results"), 2500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const dataPointsStr = useMemo(() => {
    const fb = FALLBACK_BACKTEST[strategyId];
    const bars = fb?.summary?.bars_tested || 501;
    const pts = (progress / 100) * (bars / 100);
    return `${pts.toFixed(1)}M`;
  }, [progress, strategyId]);

  const handleClose = () => navigate("/strategy");

  return (
    <div className="h-full w-full flex flex-col -m-4 bg-[#0a0a0b]">
      <AnimatePresence mode="wait">
        {/* ─── Stage: Results ─── */}
        {stage === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 min-h-0"
          >
            <BacktestResults
              onClose={handleClose}
              strategyName={strategyName}
              backtestData={backtestResult}
              strategyId={strategyId}
              onViewModified={() => setShowStressTestModal(true)}
            />
          </motion.div>
        )}

        {/* ─── Stage: Completing ─── */}
        {stage === "completing" && (
          <motion.div
            key="completing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-accent-green/30 flex items-center justify-center shadow-[0_0_60px_rgba(0,200,150,0.15)]"
              >
                <CheckCircle2 className="w-12 h-12 text-accent-green" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Backtest Completed
              </h2>
              <p className="text-text-secondary text-sm">
                {FALLBACK_BACKTEST[strategyId]?.summary?.bars_tested || 501}{" "}
                bars analyzed • {tradeCount} trades simulated
              </p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "200px" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-0.5 bg-linear-to-r from-transparent via-accent-green to-transparent mx-auto mt-6"
              />
            </div>
          </motion.div>
        )}

        {/* ─── Stage: Running ─── */}
        {stage === "running" && (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Top Bar */}
            <div className="h-14 border-b border-white/6 bg-[#0a0a0b] flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-5">
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent-blue" />
                  <span className="text-sm font-semibold text-white">
                    {strategyName}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/6" />
                <span className="text-xs text-text-secondary font-mono">
                  {FALLBACK_BACKTEST[strategyId]?.ticker || "RELIANCE.NS"} •{" "}
                  {FALLBACK_BACKTEST[
                    strategyId
                  ]?.summary?.indicators_used?.join(", ") || ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-xs font-semibold text-accent-green uppercase tracking-widest">
                  Running
                </span>
              </div>
            </div>

            {/* Main 2-Panel Layout (no logs) */}
            <div className="flex-1 flex min-h-0">
              {/* Left: Strategy Workflow Execution */}
              <div className="w-72 border-r border-white/6 bg-[#0d0d0e] shrink-0 flex flex-col overflow-hidden">
                <WorkflowExecutionVisualizer
                  nodes={workflowNodes}
                  activeNodeIndex={activeNodeIndex}
                />
              </div>

              {/* Center: Chart (takes full width, no logs on right) */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-3 border-b border-white/6 flex items-center justify-between bg-[#0a0a0b]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-green" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                      Portfolio Equity Curve
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-accent-green">
                      +
                      {(
                        (progress / 100) *
                        (FALLBACK_BACKTEST[strategyId]?.metrics?.returns
                          ?.total_return_pct || 24.5)
                      ).toFixed(1)}
                      %
                    </span>
                    <span className="text-text-secondary">vs</span>
                    <span className="text-accent-blue">
                      Bench +
                      {(
                        (progress / 100) *
                        (FALLBACK_BACKTEST[strategyId]?.benchmark
                          ?.total_return_pct || 12.3)
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-2">
                  <ExecutionChart progress={progress} />
                </div>
              </div>
            </div>

            {/* Bottom Progress Strip */}
            <ProgressStrip
              progress={Math.min(progress, 100)}
              tradeCount={tradeCount}
              dataPoints={dataPointsStr}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStressTestModal && (
          <StressTestModal
            onComplete={() => {
              navigate("/strategy-builder", {
                state: { strategyId, workflowType: "adversarial" },
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
