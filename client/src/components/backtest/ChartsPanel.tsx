import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { KPI_DATA } from "../../data/backtestRunData";
import * as D from "../../data/backtestRunData";

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#17181c",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#e2e2e2",
  },
};

function KPICards() {
  const kpis = [
    { label: "CAGR", value: KPI_DATA.cagr, color: "#22c55e" },
    { label: "Sharpe Ratio", value: KPI_DATA.sharpe, color: "#3b82f6" },
    { label: "Sortino Ratio", value: KPI_DATA.sortino, color: "#8b5cf6" },
    { label: "Max Drawdown", value: KPI_DATA.maxDrawdown, color: "#ef4444" },
    { label: "Profit Factor", value: KPI_DATA.profitFactor, color: "#14b8a6" },
  ];
  return (
    <div className="grid grid-cols-5 gap-2 mb-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.08 }}
          className="p-3 rounded-lg border border-white/6 bg-white/2"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-mono mb-1">
            {kpi.label}
          </div>
          <div
            className="text-lg font-bold font-mono"
            style={{ color: kpi.color }}
          >
            {kpi.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-lg border border-white/6 bg-white/2 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-white/6 flex items-center gap-2">
        <TrendingUp className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary font-mono">
          {title}
        </span>
      </div>
      <div className="p-2" style={{ height: 220 }}>
        {children}
      </div>
    </motion.div>
  );
}

function WalkForwardCharts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChartCard title="Train vs Test Equity" delay={0.3}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={D.walkForwardEquity}>
            <defs>
              <linearGradient id="trainG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="testG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="month" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Area
              type="monotone"
              dataKey="train"
              stroke="#3b82f6"
              strokeWidth={1.5}
              fill="url(#trainG)"
              name="Train"
            />
            <Area
              type="monotone"
              dataKey="test"
              stroke="#22c55e"
              strokeWidth={1.5}
              fill="url(#testG)"
              name="Test"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Rolling Sharpe Ratio" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={D.rollingSharpe}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="month" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Line
              type="monotone"
              dataKey="sharpe"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Performance per Window" delay={0.5}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={D.windowPerformance}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="window" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis hide />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="ret" name="Return %" radius={[4, 4, 0, 0]}>
              {D.windowPerformance.map((e, i) => (
                <Cell key={i} fill={e.ret >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function MonteCarloCharts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChartCard title="Final Equity Distribution" delay={0.3}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={D.monteCarloHistogram}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="bin"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              interval={4}
            />
            <YAxis hide />
            <Tooltip {...chartTooltipStyle} />
            <Bar
              dataKey="freq"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              name="Frequency"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Sharpe Ratio Distribution" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={D.sharpeDistMC}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="bin"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              interval={3}
            />
            <YAxis hide />
            <Tooltip {...chartTooltipStyle} />
            <Bar
              dataKey="freq"
              fill="#a78bfa"
              radius={[3, 3, 0, 0]}
              name="Frequency"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Simulated Equity Paths" delay={0.5}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="day" type="number" domain={[0, 49]} hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            {D.mcPaths.map((path, i) => (
              <Line
                key={i}
                data={path}
                type="monotone"
                dataKey="equity"
                stroke={`hsl(${200 + i * 20}, 70%, 60%)`}
                strokeWidth={1}
                dot={false}
                strokeOpacity={0.6}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function KupiecCharts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChartCard title="VaR Exceedance Plot" delay={0.3}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="day"
              type="number"
              tick={{ fill: "#6b7280", fontSize: 9 }}
            />
            <YAxis
              dataKey="loss"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              domain={[-5, 0]}
            />
            <Tooltip {...chartTooltipStyle} />
            <Scatter
              data={D.varExceedance.filter((d) => !d.exceeded)}
              fill="#3b82f6"
              name="Within VaR"
            />
            <Scatter
              data={D.varExceedance.filter((d) => d.exceeded)}
              fill="#ef4444"
              name="Exceedance"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Loss Distribution" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={D.lossDistribution}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="bin"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              interval={4}
            />
            <YAxis hide />
            <Tooltip {...chartTooltipStyle} />
            <Bar
              dataKey="freq"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
              name="Frequency"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Confidence Intervals" delay={0.5}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={D.confidenceIntervals}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="day" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Line
              type="monotone"
              dataKey="var95"
              stroke="#ef4444"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
              name="VaR 95%"
            />
            <Line
              type="monotone"
              dataKey="var99"
              stroke="#f97316"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
              name="VaR 99%"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Actual P&L"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function RegimeCharts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChartCard title="Equity Curve by Regime" delay={0.3}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={D.regimeEquity}>
            <defs>
              <linearGradient id="regimeG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="day" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#regimeG)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Performance per Regime" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={D.regimePerformance}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="regime" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis hide />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="ret" name="Return %" radius={[4, 4, 0, 0]}>
              {D.regimePerformance.map((e, i) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Regime Frequency" delay={0.5}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={D.regimeFrequency}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={35}
              strokeWidth={0}
            >
              {D.regimeFrequency.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 10, color: "#9da1a8" }} />
            <Tooltip {...chartTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function OverfittingCharts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChartCard title="Parameter Heatmap (Sharpe)" delay={0.3}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="x"
              type="number"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              name="Param A"
            />
            <YAxis
              dataKey="y"
              type="number"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              name="Param B"
            />
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value) => Number(value ?? 0).toFixed(2)}
            />
            <Scatter data={D.paramHeatmap} fill="#a78bfa">
              {D.paramHeatmap.map((e, i) => (
                <Cell
                  key={i}
                  fill={`hsl(${Math.min(e.sharpe * 60, 140)}, 70%, ${40 + e.sharpe * 15}%)`}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Sharpe vs Parameter Sensitivity" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={D.sharpeSensitivity}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="param" tick={{ fill: "#6b7280", fontSize: 9 }} />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Line
              type="monotone"
              dataKey="insample"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
              name="In-Sample"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="sharpe"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Out-of-Sample"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ParallelCharts() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <ChartCard
        title="Synthetic Equity Curves — 12 Parallel Universes"
        delay={0.3}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="day" type="number" domain={[0, 59]} hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            {D.parallelPaths.map((path, i) => (
              <Line
                key={i}
                data={path}
                type="monotone"
                dataKey="equity"
                stroke={`hsl(${i * 30}, 65%, 58%)`}
                strokeWidth={1.5}
                dot={false}
                strokeOpacity={0.7}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function SharpeCharts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChartCard title="Sharpe Ratio Histogram" delay={0.3}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={D.sharpeHistogramData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="bin"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              interval={4}
            />
            <YAxis hide />
            <Tooltip {...chartTooltipStyle} />
            <Bar
              dataKey="freq"
              fill="#8b5cf6"
              radius={[3, 3, 0, 0]}
              name="Frequency"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Confidence Band" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={D.sharpeConfBand}>
            <defs>
              <linearGradient id="confG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="sample" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="transparent"
              fill="url(#confG)"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="transparent"
              fill="transparent"
            />
            <Line
              type="monotone"
              dataKey="sharpe"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function LongevityCharts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChartCard title="Alpha Decay Curve" delay={0.3}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={D.alphaDecay}>
            <defs>
              <linearGradient id="alphaG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 9 }} />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Area
              type="monotone"
              dataKey="alpha"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#alphaG)"
              name="Alpha %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Strategy Half-Life Projection" delay={0.4}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={D.halfLifeProjection}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 9 }} />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#ef4444"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
              name="Projected"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Actual"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="halfLine"
              stroke="#6b7280"
              strokeWidth={1}
              dot={false}
              strokeDasharray="8 4"
              name="Half-Life"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

const SUITE_CHARTS: Record<string, () => JSX.Element> = {
  "walk-forward": WalkForwardCharts,
  "monte-carlo": MonteCarloCharts,
  kupiec: KupiecCharts,
  regime: RegimeCharts,
  overfitting: OverfittingCharts,
  parallel: ParallelCharts,
  sharpe: SharpeCharts,
  longevity: LongevityCharts,
};

export function ChartsPanel({ suiteId }: { suiteId: string }) {
  const Charts = SUITE_CHARTS[suiteId] || WalkForwardCharts;
  return (
    <div
      className="h-full flex flex-col bg-[#0c0d10] overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="p-3">
        <KPICards />
        <Charts />
      </div>
    </div>
  );
}
