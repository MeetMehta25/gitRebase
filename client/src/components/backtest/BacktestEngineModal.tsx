import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  Database,
  Cpu,
  Radio,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { BacktestResults } from "./BacktestResults";
import type { Node, Edge } from "reactflow";

// ─── Types ───────────────────────────────────────────────────────────────────
type Stage = "running" | "completing" | "results";

interface LogEntry {
  text: string;
  severity: "INFO" | "EXEC" | "TRADE" | "WARN" | "DATA";
  timestamp: string;
}

interface BacktestEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  strategyName?: string;
}

// ─── Mock Data Generators ────────────────────────────────────────────────────
const LOG_MESSAGES: Omit<LogEntry, "timestamp">[] = [
  { text: "Initializing backtest engine v4.2.1...", severity: "INFO" },
  { text: "Loading NSE universe (1,750+ symbols)...", severity: "DATA" },
  {
    text: "Downloading price history (2014-01-02 → 2024-12-31)...",
    severity: "DATA",
  },
  { text: "Parsing 48.2M OHLCV data points...", severity: "DATA" },
  { text: "Building order book simulation model...", severity: "INFO" },
  { text: "Computing SMA(50) across universe...", severity: "EXEC" },
  { text: "Computing RSI(14) indicators...", severity: "EXEC" },
  { text: "Computing MACD(12,26,9) signals...", severity: "EXEC" },
  { text: "Signal detected: RSI(28.4) < 30 threshold", severity: "TRADE" },
  { text: "Executing BUY 100 RELIANCE.NS @ INR 2742.38", severity: "TRADE" },
  { text: "Portfolio value updated: $102,438.00", severity: "INFO" },
  { text: "Signal detected: MACD bullish crossover", severity: "TRADE" },
  { text: "Executing BUY 50 TCS.NS @ INR 3846.22", severity: "TRADE" },
  {
    text: "⚠ High volatility regime detected (India VIX > 18)",
    severity: "WARN",
  },
  {
    text: "Activating trailing stop: RELIANCE.NS @ INR 2688.50",
    severity: "EXEC",
  },
  { text: "Signal detected: RSI(72.1) > 70 threshold", severity: "TRADE" },
  {
    text: "Executing SELL 100 RELIANCE.NS @ INR 3128.44 (+14.1%)",
    severity: "TRADE",
  },
  { text: "Rebalancing portfolio weights...", severity: "EXEC" },
  { text: "Computing Sharpe ratio: 1.85", severity: "INFO" },
  { text: "Processing drawdown analysis...", severity: "EXEC" },
  { text: "Signal detected: momentum breakout INFY.NS", severity: "TRADE" },
  { text: "Executing BUY 75 INFY.NS @ INR 1624.18", severity: "TRADE" },
  { text: "Portfolio value updated: $148,922.00", severity: "INFO" },
  { text: "⚠ Correlation spike detected across tech sector", severity: "WARN" },
  { text: "Executing SELL 50 NVDA @ $248.90 (+33.6%)", severity: "TRADE" },
  { text: "Running Monte Carlo simulation (1,000 paths)...", severity: "EXEC" },
  { text: "Computing Value at Risk (95th percentile)...", severity: "EXEC" },
  { text: "Final portfolio value: $224,580.00", severity: "INFO" },
  { text: "Generating performance attribution report...", severity: "INFO" },
  { text: "Backtest complete. Compiling results...", severity: "INFO" },
];

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

// ─── Computation Log (inline) ────────────────────────────────────────────────
function ComputationLog({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const severityColor: Record<string, string> = {
    INFO: "text-accent-blue",
    EXEC: "text-[#a78bfa]",
    TRADE: "text-accent-green",
    WARN: "text-[#f5a623]",
    DATA: "text-text-secondary",
  };

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto font-mono text-[11px] leading-relaxed p-4 space-y-1"
    >
      {logs.map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className="flex gap-2"
        >
          <span className="text-text-muted shrink-0">{log.timestamp}</span>
          <span className={cn("shrink-0 w-13", severityColor[log.severity])}>
            [{log.severity}]
          </span>
          <span className="text-text-primary/80">{log.text}</span>
        </motion.div>
      ))}
      <div className="inline-block w-2 h-4 bg-accent-blue animate-pulse ml-1" />
    </div>
  );
}

// ─── Node Execution Visualizer ───────────────────────────────────────────────
function NodeExecutionVisualizer({
  nodes,
  activeNodeIndex,
}: {
  nodes: Node[];
  activeNodeIndex: number;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2 self-start">
        Strategy Execution Flow
      </h3>
      {nodes.map((node, i) => {
        const isActive = i === activeNodeIndex;
        const isDone = i < activeNodeIndex;
        const typeColors: Record<
          string,
          { border: string; text: string; glow: string }
        > = {
          trigger: {
            border: "border-emerald-500/40",
            text: "text-emerald-400",
            glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
          },
          condition: {
            border: "border-amber-500/40",
            text: "text-amber-400",
            glow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
          },
          action: {
            border: "border-blue-500/40",
            text: "text-blue-400",
            glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
          },
        };
        const colors = typeColors[node.data?.type] || typeColors.trigger;

        return (
          <div
            key={node.id}
            className="flex flex-col items-center gap-3 w-full"
          >
            <motion.div
              animate={
                isActive
                  ? {
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0px rgba(74,158,255,0)",
                        "0 0 25px rgba(74,158,255,0.4)",
                        "0 0 0px rgba(74,158,255,0)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 1.5, repeat: Infinity }}
              className={cn(
                "w-full px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300",
                isActive
                  ? cn(colors.border, colors.glow, "bg-white/10")
                  : isDone
                    ? "border-white/10 bg-white/5 opacity-50"
                    : "border-white/5 bg-white/2 opacity-30",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isActive
                      ? "bg-accent-green animate-pulse"
                      : isDone
                        ? "bg-accent-green"
                        : "bg-white/20",
                  )}
                />
                <div>
                  <div
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      isActive ? colors.text : "text-white/40",
                    )}
                  >
                    {node.data?.type}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-white" : "text-white/50",
                    )}
                  >
                    {node.data?.label}
                  </div>
                </div>
                {isDone && (
                  <CheckCircle2 className="w-4 h-4 text-accent-green ml-auto" />
                )}
                {isActive && (
                  <Radio className="w-4 h-4 text-accent-blue ml-auto animate-pulse" />
                )}
              </div>
            </motion.div>
            {i < nodes.length - 1 && (
              <div
                className={cn(
                  "w-px h-6 transition-all duration-300",
                  isDone
                    ? "bg-accent-green/50"
                    : isActive
                      ? "bg-accent-blue/30 animate-pulse"
                      : "bg-white/5",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Animated Chart ──────────────────────────────────────────────────────────
function ExecutionChart({ progress }: { progress: number }) {
  const visibleCount = Math.floor((progress / 100) * FULL_EQUITY_DATA.length);
  const visibleData = useMemo(
    () => FULL_EQUITY_DATA.slice(0, Math.max(visibleCount, 2)),
    [visibleCount],
  );

  const trades = useMemo(() => {
    const t: { year: string; type: "buy" | "sell"; price: number }[] = [];
    for (
      let i = 0;
      i < visibleCount;
      i += 15 + Math.floor(Math.random() * 10)
    ) {
      if (i < FULL_EQUITY_DATA.length) {
        t.push({
          year: FULL_EQUITY_DATA[i].year,
          type: Math.random() > 0.5 ? "buy" : "sell",
          price: FULL_EQUITY_DATA[i].equity,
        });
      }
    }
    return t;
  }, [visibleCount]);

  return (
    <div className="h-full w-full relative">
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={visibleData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00c896" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00c896" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a9eff" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#4a9eff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.03)"
          />
          <XAxis
            dataKey="year"
            stroke="rgba(255,255,255,0.15)"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.15)"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `INR ${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#17181c",
              borderColor: "rgba(255,255,255,0.06)",
              borderRadius: "8px",
              fontSize: "11px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            itemStyle={{ color: "#f2f2f2" }}
            formatter={(value: any) => [
              `INR ${Number(value).toLocaleString()}`,
              "",
            ]}
          />
          <Area
            type="monotone"
            dataKey="benchmark"
            stroke="#4a9eff"
            strokeWidth={1}
            fill="url(#benchGrad)"
            name="NIFTY 50"
            strokeDasharray="4 4"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#00c896"
            strokeWidth={2}
            fill="url(#equityGrad)"
            name="Strategy"
            isAnimationActive={false}
          />
          {trades.map((t, i) => (
            <ReferenceLine
              key={i}
              x={t.year}
              stroke={t.type === "buy" ? "#00c896" : "#ff5c5c"}
              strokeDasharray="2 2"
              strokeOpacity={0.4}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Trade markers overlay */}
      <div className="absolute top-4 right-4 flex gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 bg-accent-green rounded" />
          <span className="text-text-secondary">Strategy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-0.5 bg-accent-blue rounded opacity-50"
            style={{ borderTop: "1px dashed #4a9eff" }}
          />
          <span className="text-text-secondary">NIFTY 50</span>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Stats Strip ────────────────────────────────────────────────────
function ProgressStrip({
  progress,
  tradeCount,
  dataPoints,
}: {
  progress: number;
  tradeCount: number;
  dataPoints: string;
}) {
  const yearsProcessed = Math.floor((progress / 100) * 10);
  const currentYear = 2014 + yearsProcessed;

  return (
    <div className="flex items-center gap-6 px-6 py-4 border-t border-white/6 bg-[#0a0a0b]">
      {/* Progress bar */}
      <div className="flex-1">
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-text-secondary uppercase tracking-widest font-medium">
            Backtest Progress
          </span>
          <span className="font-mono text-text-primary">
            {Math.min(progress, 100)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-accent-blue to-accent-green"
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="h-8 w-px bg-white/6" />

      {/* Stats */}
      {[
        {
          label: "Years",
          value: `${yearsProcessed} / 10`,
          sublabel: `${currentYear}`,
          icon: Clock,
        },
        {
          label: "Trades",
          value: tradeCount.toString(),
          sublabel: "simulated",
          icon: ArrowUpRight,
        },
        {
          label: "Data Points",
          value: dataPoints,
          sublabel: "processed",
          icon: Database,
        },
        { label: "Speed", value: "48.2k", sublabel: "bars/sec", icon: Zap },
      ].map((stat) => (
        <div key={stat.label} className="flex items-center gap-2.5">
          <stat.icon className="w-3.5 h-3.5 text-accent-blue/60" />
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

// ─── Main Modal ──────────────────────────────────────────────────────────────
export function BacktestEngineModal({
  isOpen,
  onClose,
  nodes,
  edges: _edges,
  strategyName = "Momentum Reversion Alpha",
}: BacktestEngineModalProps) {
  const [stage, setStage] = useState<Stage>("running");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStage("running");
      setProgress(0);
      setLogs([]);
      setActiveNodeIndex(0);
      setTradeCount(0);
    }
  }, [isOpen]);

  // Progress simulation
  useEffect(() => {
    if (!isOpen || stage !== "running") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage("completing");
          return 100;
        }
        return prev + 0.8 + Math.random() * 0.6;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen, stage]);

  // Log emission
  useEffect(() => {
    if (!isOpen || stage !== "running") return;
    const logIndex = Math.floor((progress / 100) * LOG_MESSAGES.length);
    const currentLogs = LOG_MESSAGES.slice(0, logIndex).map((msg, i) => ({
      ...msg,
      timestamp: `${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
    }));
    setLogs(currentLogs);
    setTradeCount(
      currentLogs.filter((l) => l.severity === "TRADE").length * 12 +
        Math.floor(progress * 1.4),
    );
  }, [progress, isOpen, stage]);

  // Node cycling
  useEffect(() => {
    if (!isOpen || stage !== "running") return;
    const idx = Math.floor((progress / 100) * nodes.length) % nodes.length;
    setActiveNodeIndex(idx);
  }, [progress, isOpen, stage, nodes.length]);

  // Completion transition
  useEffect(() => {
    if (stage === "completing") {
      const timer = setTimeout(() => setStage("results"), 2500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const dataPointsStr = useMemo(() => {
    const pts = (progress / 100) * 48.2;
    return `${pts.toFixed(1)}M`;
  }, [progress]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-[#050505]/95 backdrop-blur-xl flex flex-col"
      >
        {/* ─── Stage: Results ─── */}
        {stage === "results" && (
          <BacktestResults onClose={onClose} strategyName={strategyName} />
        )}

        {/* ─── Stage: Completing ─── */}
        {stage === "completing" && (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
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
                10 years of data analyzed • {tradeCount} trades simulated
              </p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "200px" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-0.5 bg-linear-to-r from-transparent via-accent-green to-transparent mx-auto mt-6"
              />
            </motion.div>
          </div>
        )}

        {/* ─── Stage: Running ─── */}
        {stage === "running" && (
          <>
            {/* Top Bar */}
            <div className="h-14 border-b border-white/6 bg-[#0a0a0b] flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent-blue" />
                  <span className="text-sm font-semibold text-white">
                    {strategyName}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/6" />
                <span className="text-xs text-text-secondary font-mono">
                  NSE Universe
                </span>
                <div className="h-4 w-px bg-white/6" />
                <span className="text-xs text-text-secondary font-mono">
                  2014-01-02 → 2024-12-31
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <span className="text-xs font-semibold text-accent-green uppercase tracking-widest">
                    Running
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main 3-Panel Layout */}
            <div className="flex-1 flex min-h-0">
              {/* Left: Strategy Flow */}
              <div className="w-64 border-r border-white/6 bg-[#0d0d0e] overflow-y-auto shrink-0">
                <NodeExecutionVisualizer
                  nodes={nodes}
                  activeNodeIndex={activeNodeIndex}
                />
              </div>

              {/* Center: Chart */}
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
                      +{((progress / 100) * 124.5).toFixed(1)}%
                    </span>
                    <span className="text-text-secondary">vs</span>
                    <span className="text-accent-blue">
                      NIFTY +{((progress / 100) * 68.2).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-2">
                  <ExecutionChart progress={progress} />
                </div>
              </div>

              {/* Right: Log */}
              <div className="w-96 border-l border-white/6 bg-[#0a0a0b] flex flex-col shrink-0">
                <div className="p-3 border-b border-white/6 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-accent-purple" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    Computation Log
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  <ComputationLog logs={logs} />
                </div>
              </div>
            </div>

            {/* Bottom Progress Strip */}
            <ProgressStrip
              progress={Math.min(progress, 100)}
              tradeCount={tradeCount}
              dataPoints={dataPointsStr}
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
