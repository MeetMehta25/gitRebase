import { AlertTriangle, Zap, Droplets, TrendingDown } from "lucide-react";

const STRESS_TESTS = [
  {
    name: "Flash Crash",
    icon: Zap,
    drawdown: "-28.4%",
    recovery: "45 days",
    risk: "High",
    riskColor: "text-accent-red",
    description: "Simulating a 10% intraday market drop",
  },
  {
    name: "Liquidity Stress",
    icon: Droplets,
    drawdown: "-12.1%",
    recovery: "18 days",
    risk: "Medium",
    riskColor: "text-accent-amber",
    description: "Market-wide liquidity withdrawal scenario",
  },
  {
    name: "Slippage Spike",
    icon: TrendingDown,
    drawdown: "-8.7%",
    recovery: "12 days",
    risk: "Low",
    riskColor: "text-accent-green",
    description: "Slippage increases to 0.5% per trade",
  },
];

export function AdversarialTestPanel() {
  return (
    <div className="bg-bg-card border border-white/6 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-3.5 w-3.5 text-accent-red" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          Adversarial Stress Tests
        </h3>
      </div>

      <div className="space-y-2">
        {STRESS_TESTS.map((test) => {
          const Icon = test.icon;
          return (
            <div
              key={test.name}
              className="bg-bg-secondary border border-white/4 rounded-md p-3 hover:border-white/8 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-text-secondary" />
                  <span className="text-xs font-semibold text-text-primary">
                    {test.name}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold ${test.riskColor}`}>
                  {test.risk} Risk
                </span>
              </div>
              <p className="text-[10px] text-text-secondary mb-2">
                {test.description}
              </p>
              <div className="flex gap-4 text-[10px]">
                <div>
                  <span className="text-text-secondary">Drawdown: </span>
                  <span className="font-mono text-accent-red">
                    {test.drawdown}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Recovery: </span>
                  <span className="font-mono text-text-primary">
                    {test.recovery}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== Monte Carlo Panel ==========
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const mcData = Array.from({ length: 50 }, (_, i) => {
  const base = 10000 * Math.exp(i * 0.003);
  return {
    step: i,
    p5: base * 0.85 + Math.random() * 200,
    p25: base * 0.93 + Math.random() * 300,
    median: base + Math.random() * 400,
    p75: base * 1.07 + Math.random() * 300,
    p95: base * 1.18 + Math.random() * 200,
  };
});

export function MonteCarloPanel() {
  return (
    <div className="bg-bg-card border border-white/6 rounded-lg p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">
        Monte Carlo Simulation (1000 paths)
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mcData}>
            <defs>
              <linearGradient id="mcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4a9eff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="step" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#17181c",
                borderColor: "rgba(255,255,255,0.06)",
                borderRadius: "6px",
                fontSize: "11px",
              }}
              itemStyle={{ color: "#f2f2f2" }}
            />
            <Area
              type="monotone"
              dataKey="p95"
              stroke="transparent"
              fill="#4a9eff"
              fillOpacity={0.05}
              name="95th %"
            />
            <Area
              type="monotone"
              dataKey="p75"
              stroke="transparent"
              fill="#4a9eff"
              fillOpacity={0.08}
              name="75th %"
            />
            <Area
              type="monotone"
              dataKey="median"
              stroke="#4a9eff"
              strokeWidth={1.5}
              fill="url(#mcFill)"
              name="Median"
            />
            <Area
              type="monotone"
              dataKey="p25"
              stroke="transparent"
              fill="#4a9eff"
              fillOpacity={0.08}
              name="25th %"
            />
            <Area
              type="monotone"
              dataKey="p5"
              stroke="transparent"
              fill="#4a9eff"
              fillOpacity={0.05}
              name="5th %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-text-secondary font-mono">
        <span>P5: -12.4%</span>
        <span>Median: +18.2%</span>
        <span>P95: +42.1%</span>
      </div>
    </div>
  );
}

// ========== Market Regime Panel ==========
const REGIMES = [
  {
    name: "Bull Market",
    sharpe: "2.14",
    drawdown: "-6.2%",
    ret: "+32.4%",
    color: "#00c896",
  },
  {
    name: "Bear Market",
    sharpe: "0.42",
    drawdown: "-22.1%",
    ret: "-8.4%",
    color: "#ff5c5c",
  },
  {
    name: "Sideways",
    sharpe: "1.15",
    drawdown: "-11.4%",
    ret: "+12.2%",
    color: "#f5a623",
  },
  {
    name: "High Volatility",
    sharpe: "0.68",
    drawdown: "-18.7%",
    ret: "+5.1%",
    color: "#a78bfa",
  },
];

export function MarketRegimePanel() {
  return (
    <div className="bg-bg-card border border-white/6 rounded-lg p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">
        Market Regime Analysis
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {REGIMES.map((r) => (
          <div
            key={r.name}
            className="bg-bg-secondary border border-white/4 rounded-md p-2.5"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              <span className="text-[10px] font-semibold text-text-primary">
                {r.name}
              </span>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">Sharpe</span>
                <span className="font-mono text-text-primary">{r.sharpe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Max DD</span>
                <span className="font-mono text-accent-red">{r.drawdown}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Return</span>
                <span
                  className="font-mono"
                  style={{
                    color: r.ret.startsWith("-") ? "#ff5c5c" : "#00c896",
                  }}
                >
                  {r.ret}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== Overfitting Detector ==========
export function OverfittingDetector() {
  const trainSharpe = 1.8;
  const testSharpe = 0.6;
  const ratio = testSharpe / trainSharpe;
  const risk = ratio < 0.4 ? "High" : ratio < 0.7 ? "Moderate" : "Low";
  const riskColor =
    risk === "High" ? "#ff5c5c" : risk === "Moderate" ? "#f5a623" : "#00c896";

  return (
    <div className="bg-bg-card border border-white/6 rounded-lg p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">
        Overfitting Detection
      </h3>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-bold" style={{ color: riskColor }}>
          ⚠ {risk} Risk
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between bg-bg-secondary border border-white/4 rounded-md p-2.5 text-[11px]">
          <span className="text-text-secondary">Train Sharpe</span>
          <span className="font-mono text-text-primary">{trainSharpe}</span>
        </div>
        <div className="flex justify-between bg-bg-secondary border border-white/4 rounded-md p-2.5 text-[11px]">
          <span className="text-text-secondary">Test Sharpe</span>
          <span className="font-mono text-accent-red">{testSharpe}</span>
        </div>
        <div className="flex justify-between bg-bg-secondary border border-white/4 rounded-md p-2.5 text-[11px]">
          <span className="text-text-secondary">Cross Validation</span>
          <span className="font-mono text-accent-amber">0.58</span>
        </div>

        {/* Visual bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[9px] text-text-secondary mb-1">
            <span>Test / Train Ratio</span>
            <span className="font-mono">{(ratio * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${ratio * 100}%`, backgroundColor: riskColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Portfolio Construction Panel ==========
const ALLOCATIONS = [
  { asset: "RELIANCE.NS", weight: 25, color: "#4a9eff" },
  { asset: "TCS.NS", weight: 20, color: "#00c896" },
  { asset: "INFY.NS", weight: 18, color: "#a78bfa" },
  { asset: "HDFCBANK.NS", weight: 15, color: "#f5a623" },
  { asset: "ICICIBANK.NS", weight: 12, color: "#ff5c5c" },
  { asset: "Cash", weight: 10, color: "#9da1a8" },
];

export function PortfolioConstructionPanel() {
  return (
    <div className="bg-bg-card border border-white/6 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          Portfolio Construction
        </h3>
        <div className="flex gap-1">
          <span className="text-[9px] px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20 font-medium cursor-pointer">
            Risk Parity
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-bg-secondary text-text-secondary border border-white/6 cursor-pointer">
            Max Sharpe
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-bg-secondary text-text-secondary border border-white/6 cursor-pointer">
            Equal
          </span>
        </div>
      </div>

      {/* Allocation Bars */}
      <div className="space-y-1.5 mb-3">
        {ALLOCATIONS.map((a) => (
          <div key={a.asset} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-text-primary w-12">
              {a.asset}
            </span>
            <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${a.weight}%`, backgroundColor: a.color }}
              />
            </div>
            <span className="text-[10px] font-mono text-text-secondary w-8 text-right">
              {a.weight}%
            </span>
          </div>
        ))}
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex justify-between bg-bg-secondary border border-white/4 rounded-md p-2">
          <span className="text-text-secondary">VaR (95%)</span>
          <span className="font-mono text-accent-red">-2.4%</span>
        </div>
        <div className="flex justify-between bg-bg-secondary border border-white/4 rounded-md p-2">
          <span className="text-text-secondary">CVaR</span>
          <span className="font-mono text-accent-red">-3.8%</span>
        </div>
        <div className="flex justify-between bg-bg-secondary border border-white/4 rounded-md p-2">
          <span className="text-text-secondary">Volatility</span>
          <span className="font-mono text-text-primary">14.2%</span>
        </div>
        <div className="flex justify-between bg-bg-secondary border border-white/4 rounded-md p-2">
          <span className="text-text-secondary">Max DD</span>
          <span className="font-mono text-accent-red">-9.2%</span>
        </div>
      </div>
    </div>
  );
}
