import { motion } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Shield,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Brain,
  Gauge,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const equityData = Array.from({ length: 120 }, (_, i) => {
  const base = 100000;
  const trend = i * 1050;
  const noise =
    Math.sin(i * 0.3) * 8000 +
    Math.cos(i * 0.7) * 5000 +
    (Math.random() - 0.5) * 4000;
  return {
    month: `${2014 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`,
    equity: Math.round(base + trend + noise),
  };
});

const drawdownData = equityData.map((d, i) => {
  const peak = Math.max(...equityData.slice(0, i + 1).map((e) => e.equity));
  return { month: d.month, drawdown: -((peak - d.equity) / peak) * 100 };
});

const tradeDistribution = Array.from({ length: 20 }, (_, i) => {
  const range = (i - 10) * 200;
  return {
    range: `${range >= 0 ? "+" : ""}${range}`,
    count: Math.max(
      2,
      Math.floor(30 * Math.exp(-((i - 11) ** 2) / 18) + Math.random() * 5),
    ),
    positive: range >= 0,
  };
});

const MONTHLY_RETURNS: number[][] = Array.from({ length: 10 }, () =>
  Array.from(
    { length: 12 },
    () => Math.round((Math.random() - 0.35) * 12 * 10) / 10,
  ),
);
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TRADE_LOG = [
  {
    date: "2024-03-15 14:30",
    ticker: "RELIANCE.NS",
    signal: "BUY",
    entry: "INR 2724.40",
    exit: "INR 2869.22",
    pnl: "+INR 14,482",
    pnlPositive: true,
    duration: "12d",
  },
  {
    date: "2024-03-12 09:45",
    ticker: "TCS.NS",
    signal: "BUY",
    entry: "INR 3818.36",
    exit: "INR 3924.10",
    pnlPositive: true,
    pnl: "+INR 10,574",
    duration: "8d",
  },
  {
    date: "2024-02-28 11:15",
    ticker: "INFY.NS",
    signal: "SELL",
    entry: "INR 1655.20",
    exit: "INR 1602.88",
    pnl: "-INR 3,924",
    pnlPositive: false,
    duration: "5d",
  },
  {
    date: "2024-02-15 10:00",
    ticker: "HDFCBANK.NS",
    signal: "BUY",
    entry: "INR 1542.56",
    exit: "INR 1605.80",
    pnl: "+INR 6,324",
    pnlPositive: true,
    duration: "14d",
  },
  {
    date: "2024-01-22 13:30",
    ticker: "ICICIBANK.NS",
    signal: "SELL",
    entry: "INR 1098.44",
    exit: "INR 1045.20",
    pnl: "-INR 5,324",
    pnlPositive: false,
    duration: "3d",
  },
  {
    date: "2024-01-08 09:30",
    ticker: "LT.NS",
    signal: "BUY",
    entry: "INR 3485.50",
    exit: "INR 3622.18",
    pnl: "+INR 13,668",
    pnlPositive: true,
    duration: "18d",
  },
  {
    date: "2023-12-18 14:00",
    ticker: "SBIN.NS",
    signal: "BUY",
    entry: "INR 748.22",
    exit: "INR 782.90",
    pnl: "+INR 3,468",
    pnlPositive: true,
    duration: "11d",
  },
  {
    date: "2023-12-05 10:15",
    ticker: "AXISBANK.NS",
    signal: "BUY",
    entry: "INR 1124.80",
    exit: "INR 1182.56",
    pnl: "+INR 5,776",
    pnlPositive: true,
    duration: "9d",
  },
];

const FACTOR_METRICS = [
  { label: "Alpha (ann.)", value: "8.42%", color: "text-accent-green" },
  { label: "Beta", value: "0.72", color: "text-text-primary" },
  { label: "Sharpe Ratio", value: "1.85", color: "text-accent-green" },
  { label: "Sortino Ratio", value: "2.41", color: "text-accent-green" },
  { label: "Information Ratio", value: "1.12", color: "text-accent-blue" },
  { label: "Value at Risk (95%)", value: "-2.4%", color: "text-accent-red" },
  { label: "Calmar Ratio", value: "1.98", color: "text-accent-green" },
  { label: "Omega Ratio", value: "1.62", color: "text-accent-blue" },
];

const FEATURE_IMPORTANCE = [
  { feature: "RSI Signal", importance: 0.34, color: "#00c896" },
  { feature: "Momentum Score", importance: 0.28, color: "#4a9eff" },
  { feature: "Volatility Regime", importance: 0.21, color: "#a78bfa" },
  { feature: "Trend Strength", importance: 0.12, color: "#f5a623" },
  { feature: "Volume Profile", importance: 0.05, color: "#ff5c5c" },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────
function GlowMetric({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend?: "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border backdrop-blur-md flex flex-col gap-2",
        "bg-bg-secondary/80 border-white/6",
        trend === "up" && "shadow-[0_0_20px_rgba(0,200,150,0.06)]",
        trend === "down" && "shadow-[0_0_20px_rgba(255,92,92,0.06)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {label}
        </span>
        <div className="text-text-muted">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <span
          className={cn(
            "text-xl font-bold font-mono tracking-tight",
            trend === "up"
              ? "text-accent-green"
              : trend === "down"
                ? "text-accent-red"
                : "text-text-primary",
          )}
        >
          {value}
        </span>
        {trend && (
          <div
            className={cn(
              "p-1 rounded-md",
              trend === "up" ? "bg-accent-green/10" : "bg-accent-red/10",
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-accent-green" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-accent-red" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HeatmapCell({ value }: { value: number }) {
  const intensity = Math.min(Math.abs(value) / 8, 1);
  const bg =
    value >= 0
      ? `rgba(0, 200, 150, ${intensity * 0.5})`
      : `rgba(255, 92, 92, ${intensity * 0.5})`;

  return (
    <div
      className="flex items-center justify-center rounded text-[9px] font-mono font-medium h-7"
      style={{ backgroundColor: bg, color: value >= 0 ? "#00c896" : "#ff5c5c" }}
    >
      {value > 0 ? "+" : ""}
      {value}
    </div>
  );
}

// ─── Main Results Component ──────────────────────────────────────────────────
export function BacktestResults({
  onClose,
  strategyName,
  backtestData,
  strategyId,
  onViewModified,
}: {
  onClose: () => void;
  strategyName: string;
  backtestData?: any;
  strategyId?: number;
  onViewModified?: () => void;
}) {
  void strategyId;
  // Extract metrics from real data if available
  const m = backtestData?.metrics;
  const sharpe = m?.risk_adjusted?.sharpe_ratio ?? m?.sharpe_ratio ?? 1.85;
  const cagr = m?.returns?.cagr_pct ?? 24.5;
  const maxDD = m?.drawdown?.max_drawdown_pct ?? m?.max_drawdown_pct ?? 12.4;
  const winRate = m?.trade_stats?.win_rate_pct ?? m?.win_rate_pct ?? 68.2;
  const sortino = m?.risk_adjusted?.sortino_ratio ?? 2.41;
  const vol = m?.returns?.annualised_volatility_pct ?? 14.2;
  const totalTrades = m?.trade_stats?.total_trades ?? 342;
  const _totalReturn =
    m?.returns?.total_return_pct ?? m?.total_return_pct ?? 124.5;
  void _totalReturn;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col h-full bg-[#0a0a0b] overflow-hidden"
    >
      {/* Top Bar */}
      <div className="h-12 border-b border-white/6 bg-[#0a0a0b] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-sm font-semibold text-white">
              {strategyName}
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted bg-bg-secondary px-2 py-0.5 rounded border border-white/4">
            BACKTEST RESULTS
          </span>
          <span className="text-[10px] font-mono text-text-muted">
            {backtestData?.summary?.date_range
              ? `${backtestData.summary.date_range.start} → ${backtestData.summary.date_range.end}`
              : "2014-01 → 2024-12 • 10Y"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onViewModified && (
            <button
              onClick={onViewModified}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 transition-colors text-xs font-semibold text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              <Layers className="w-3.5 h-3.5" />
              View Modified Strategy
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metrics Strip */}
        <div className="grid grid-cols-7 gap-3">
          <GlowMetric
            label="Sharpe Ratio"
            value={sharpe.toFixed(2)}
            trend={sharpe > 1 ? "up" : "down"}
            icon={<Gauge className="w-3.5 h-3.5" />}
          />
          <GlowMetric
            label="CAGR"
            value={`+${cagr.toFixed(1)}%`}
            trend="up"
            icon={<TrendingUp className="w-3.5 h-3.5" />}
          />
          <GlowMetric
            label="Max Drawdown"
            value={`-${maxDD.toFixed(1)}%`}
            trend="down"
            icon={<TrendingDown className="w-3.5 h-3.5" />}
          />
          <GlowMetric
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            trend={winRate > 50 ? "up" : "down"}
            icon={<Target className="w-3.5 h-3.5" />}
          />
          <GlowMetric
            label="Sortino"
            value={sortino.toFixed(2)}
            trend={sortino > 1.5 ? "up" : "down"}
            icon={<Shield className="w-3.5 h-3.5" />}
          />
          <GlowMetric
            label="Volatility"
            value={`${vol.toFixed(1)}%`}
            icon={<Activity className="w-3.5 h-3.5" />}
          />
          <GlowMetric
            label="Total Trades"
            value={String(totalTrades)}
            icon={<BarChart3 className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Row 1: Equity + Drawdown */}
        <div className="grid grid-cols-3 gap-4">
          {/* Equity Curve */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-2 bg-bg-secondary/60 border border-white/6 rounded-xl p-4"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-accent-green" /> Portfolio
              Equity Curve
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#00c896"
                        stopOpacity={0.25}
                      />
                      <stop offset="100%" stopColor="#00c896" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                  />
                  <XAxis dataKey="month" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#17181c",
                      borderColor: "rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value) => [
                      `$${Number(value ?? 0).toLocaleString()}`,
                      "Portfolio",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#00c896"
                    strokeWidth={2}
                    fill="url(#eqGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Drawdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-bg-secondary/60 border border-white/6 rounded-xl p-4"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-accent-red" /> Drawdown
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownData}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5c5c" stopOpacity={0} />
                      <stop
                        offset="100%"
                        stopColor="#ff5c5c"
                        stopOpacity={0.25}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                  />
                  <XAxis dataKey="month" hide />
                  <YAxis hide domain={["auto", 0]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#17181c",
                      borderColor: "rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(2)}%`,
                      "Drawdown",
                    ]}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#ff5c5c"
                    strokeWidth={1.5}
                    fill="url(#ddGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Trade Distribution + Monthly Returns Heatmap */}
        <div className="grid grid-cols-2 gap-4">
          {/* Trade Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-bg-secondary/60 border border-white/6 rounded-xl p-4"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-accent-blue" /> P&L
              Distribution
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeDistribution}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                  />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: "#6b7280", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#17181c",
                      borderColor: "rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {tradeDistribution.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.positive ? "#00c896" : "#ff5c5c"}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Monthly Returns Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-bg-secondary/60 border border-white/6 rounded-xl p-4"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-accent-purple" /> Monthly
              Returns Heatmap
            </h3>
            <div className="overflow-auto">
              <table className="w-full text-center">
                <thead>
                  <tr>
                    <th className="text-[9px] text-text-muted font-medium py-1 px-1 text-left">
                      Year
                    </th>
                    {MONTHS_SHORT.map((m) => (
                      <th
                        key={m}
                        className="text-[9px] text-text-muted font-medium py-1 px-0.5"
                      >
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONTHLY_RETURNS.map((row, yi) => (
                    <tr key={yi}>
                      <td className="text-[10px] font-mono text-text-secondary py-0.5 px-1 text-left">
                        {2014 + yi}
                      </td>
                      {row.map((val, mi) => (
                        <td key={mi} className="py-0.5 px-0.5">
                          <HeatmapCell value={val} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Row 3: Trade Log + Factor Breakdown + Feature Attribution */}
        <div className="grid grid-cols-3 gap-4">
          {/* Trade Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="col-span-1 bg-bg-secondary/60 border border-white/6 rounded-xl p-4"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-accent-amber" /> Recent Trades
            </h3>
            <div className="overflow-y-auto max-h-64 space-y-1.5">
              {TRADE_LOG.map((t, i) => (
                <div
                  key={i}
                  className="bg-bg-primary border border-white/4 rounded-lg p-2.5 flex items-center justify-between text-[10px]"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">
                        {t.ticker}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold",
                          t.signal === "BUY"
                            ? "bg-accent-green/10 text-accent-green"
                            : "bg-accent-red/10 text-accent-red",
                        )}
                      >
                        {t.signal}
                      </span>
                    </div>
                    <span className="text-text-muted font-mono">{t.date}</span>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "font-mono font-semibold",
                        t.pnlPositive ? "text-accent-green" : "text-accent-red",
                      )}
                    >
                      {t.pnl}
                    </div>
                    <div className="text-text-muted">{t.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Factor Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-bg-secondary/60 border border-white/6 rounded-xl p-4"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-accent-green" /> Strategy Factor
              Breakdown
            </h3>
            <div className="space-y-2.5">
              {FACTOR_METRICS.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between bg-bg-primary border border-white/4 rounded-lg px-3 py-2.5"
                >
                  <span className="text-[11px] text-text-secondary">{f.label}</span>
                  <span
                    className={cn("text-sm font-mono font-semibold", f.color)}
                  >
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Feature Attribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-bg-secondary/60 border border-white/6 rounded-xl p-4"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-accent-purple" /> AI Feature
              Attribution
            </h3>
            <p className="text-[10px] text-text-muted mb-4">
              SHAP-based importance scores
            </p>
            <div className="space-y-3">
              {FEATURE_IMPORTANCE.map((f) => (
                <div key={f.feature} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">{f.feature}</span>
                    <span className="font-mono text-text-primary font-medium">
                      {(f.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${f.importance * 100}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: f.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
