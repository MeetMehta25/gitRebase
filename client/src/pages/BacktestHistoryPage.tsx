import { useState } from "react";
import { DataTable } from "../components/ui/DataTable";
import { MetricCard } from "../components/ui/MetricCard";
import { GlassCard } from "../components/ui/GlassCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { X, ExternalLink, History } from "lucide-react";

const BACKTEST_HISTORY = [
  {
    id: "1",
    name: "Tech Momentum Crossover",
    date: "2023-11-01",
    cagr: "24.1%",
    sharpe: "1.84",
    drawdown: "-9.2%",
    winRate: "62.5%",
    status: "Completed",
  },
  {
    id: "2",
    name: "Mean Reversion Crypto",
    date: "2023-10-28",
    cagr: "45.2%",
    sharpe: "2.10",
    drawdown: "-22.4%",
    winRate: "54.0%",
    status: "Completed",
  },
  {
    id: "3",
    name: "NIFTY Volatility Short",
    date: "2023-10-15",
    cagr: "12.8%",
    sharpe: "1.20",
    drawdown: "-15.1%",
    winRate: "68.2%",
    status: "Completed",
  },
  {
    id: "4",
    name: "Dividend Aristocrat Acc.",
    date: "2023-09-02",
    cagr: "8.4%",
    sharpe: "0.95",
    drawdown: "-12.0%",
    winRate: "72.1%",
    status: "Completed",
  },
];

const mockTearsheetData = Array.from({ length: 120 }, (_, i) => ({
  date: `Day ${i}`,
  portfolio: 10000 * Math.exp(i * 0.002) + Math.random() * 500 - 250,
  benchmark: 10000 * Math.exp(i * 0.001) + Math.random() * 200 - 100,
}));

export function BacktestHistoryPage() {
  const [selectedRun, setSelectedRun] = useState<any>(null);

  const columns = [
    {
      header: "Strategy",
      accessor: "name",
      render: (row: any) => (
        <span className="font-medium text-text-primary group-hover:text-accent-blue transition-colors">
          {row.name}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      render: (row: any) => (
        <span className="font-mono text-[11px]">{row.date}</span>
      ),
    },
    {
      header: "CAGR",
      accessor: "cagr",
      render: (row: any) => (
        <span className="text-accent-green font-mono">{row.cagr}</span>
      ),
    },
    {
      header: "Sharpe",
      accessor: "sharpe",
      render: (row: any) => <span className="font-mono">{row.sharpe}</span>,
    },
    {
      header: "Max DD",
      accessor: "drawdown",
      render: (row: any) => (
        <span className="text-accent-red font-mono">{row.drawdown}</span>
      ),
    },
    {
      header: "Win Rate",
      accessor: "winRate",
      render: (row: any) => <span className="font-mono">{row.winRate}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row: any) => (
        <span className="text-[10px] px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20 font-medium">
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col relative max-w-6xl mx-auto">
      <div className="mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-accent-blue" />
        <h1 className="text-lg font-semibold text-text-primary">
          Backtest Ledger
        </h1>
        <span className="text-[10px] text-text-secondary ml-2">
          Historical simulation results and performance tearsheets
        </span>
      </div>

      <DataTable
        columns={columns}
        data={BACKTEST_HISTORY}
        onRowClick={(row) => setSelectedRun(row)}
      />

      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-bg-primary/85 backdrop-blur-sm"
            onClick={() => setSelectedRun(null)}
          />
          <GlassCard className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-bg-secondary border-white/8 rounded-xl p-0">
            <div className="flex items-center justify-between p-5 border-b border-white/6">
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  {selectedRun.name}
                </h2>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Run: {selectedRun.date} · Friction: 0.01% slippage
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/4 text-text-secondary text-[11px] hover:bg-white/8 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Open in Builder
                </button>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="p-1.5 rounded-md bg-white/4 text-text-secondary hover:text-accent-red transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                <MetricCard
                  title="Sharpe"
                  value={selectedRun.sharpe}
                  className="bg-bg-card"
                />
                <MetricCard
                  title="CAGR"
                  value={selectedRun.cagr}
                  className="bg-bg-card"
                />
                <MetricCard
                  title="Max DD"
                  value={selectedRun.drawdown}
                  className="bg-bg-card"
                />
                <MetricCard
                  title="Win Rate"
                  value={selectedRun.winRate}
                  className="bg-bg-card"
                />
                <MetricCard
                  title="Profit Factor"
                  value="1.82"
                  className="bg-bg-card"
                />
                <MetricCard
                  title="Volatility"
                  value="14.2%"
                  className="bg-bg-card"
                />
              </div>

              <div className="h-72 w-full rounded-lg bg-bg-primary border border-white/4 p-4 flex flex-col">
                <h3 className="text-[10px] uppercase tracking-widest text-text-secondary mb-3 font-semibold">
                  Equity Curve
                </h3>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockTearsheetData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.03)"
                        vertical={false}
                      />
                      <XAxis dataKey="date" hide />
                      <YAxis
                        domain={["auto", "auto"]}
                        stroke="rgba(255,255,255,0.1)"
                        fontSize={10}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#17181c",
                          borderColor: "rgba(255,255,255,0.06)",
                          borderRadius: "6px",
                          fontSize: "11px",
                        }}
                        itemStyle={{ color: "#f2f2f2" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="portfolio"
                        stroke="#00c896"
                        strokeWidth={1.5}
                        dot={false}
                        name="Strategy"
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke="#9da1a8"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Benchmark"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-bg-primary border border-white/4 p-4">
                  <h3 className="text-[10px] uppercase tracking-widest text-text-secondary mb-3 font-semibold">
                    Executable Logic
                  </h3>
                  <pre className="font-mono text-[11px] text-text-secondary bg-bg-secondary rounded-md p-3 border border-white/4 overflow-x-auto">
                    {`if (RSI(14, CLOSE) < 30) {
  EXEC(SIDE:BUY, QTY:10%BP, TYPE:MKT);
} else if (CROSS_UNDER(SMA50, SMA200)) {
  EXEC(SIDE:SELL, QTY:ALL, TYPE:LMT);
}`}
                  </pre>
                </div>
                <div className="rounded-lg bg-bg-primary border border-white/4 p-4">
                  <h3 className="text-[10px] uppercase tracking-widest text-text-secondary mb-3 font-semibold">
                    Trade Statistics
                  </h3>
                  <div className="space-y-2.5 text-[11px]">
                    {[
                      ["Total Trades", "142"],
                      ["Avg Winner", "+1.24%", "#00c896"],
                      ["Avg Loser", "-0.68%", "#ff5c5c"],
                      ["Max Consec. Loss", "4"],
                    ].map(([label, val, color]) => (
                      <div
                        key={label}
                        className="flex justify-between items-center py-1.5 border-b border-white/4"
                      >
                        <span className="text-text-secondary">{label}</span>
                        <span
                          className="font-mono"
                          style={{ color: color || "#f2f2f2" }}
                        >
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
