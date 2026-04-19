// Dynamic realistic quant backtest data generator for Indian Markets (NSE)
export let KPI_DATA: any = {};
export let PROGRESS_STEPS: any[] = [];
export let walkForwardEquity: any[] = [];
export let rollingSharpe: any[] = [];
export let windowPerformance: any[] = [];
export let monteCarloHistogram: any[] = [];
export let sharpeDistMC: any[] = [];
export let mcPaths: any[] = [];
export let varExceedance: any[] = [];
export let lossDistribution: any[] = [];
export let confidenceIntervals: any[] = [];
export let regimeEquity: any[] = [];
export let regimePerformance: any[] = [];
export let regimeFrequency: any[] = [];
export let paramHeatmap: any[] = [];
export let sharpeSensitivity: any[] = [];
export let parallelPaths: any[] = [];
export let sharpeHistogramData: any[] = [];
export let sharpeConfBand: any[] = [];
export let alphaDecay: any[] = [];
export let halfLifeProjection: any[] = [];
export let AI_ANALYSIS: any = {};

export function regenerateBacktestData() {

  const baseCapital = 1000000; // ₹10 Lakhs
  const volatility = 0.8 + Math.random() * 0.4;
  
  KPI_DATA = {
    cagr: (20 + Math.random() * 10).toFixed(1) + "%",
    sharpe: (1.4 + Math.random() * 0.8).toFixed(2),
    sortino: (2.0 + Math.random() * 1.0).toFixed(2),
    maxDrawdown: "-" + (10 + Math.random() * 8).toFixed(1) + "%",
    profitFactor: (1.8 + Math.random() * 0.6).toFixed(2),
  };

  PROGRESS_STEPS = [
    { label: "Initializing", thinking: "Setting up execution environment. Loading configuration parameters: lookback=252, rebalance_frequency=monthly. Allocating memory for 15,200 NSE price observations." },
    { label: "Loading historical market data", thinking: "Fetching OHLCV data from 2018 to 2024. Total bars: 1,512 daily candles per instrument. Adjusting for splits and dividends. Data quality check: 99.8% fill rate." },
    { label: "Computing indicators", thinking: "Strategy uses MACD crossovers to detect momentum shifts. Also computing RSI(14) and ATR(14) for position sizing." },
    { label: "Running simulation engine", thinking: "Executing vectorized backtest across 1,512 bars. Fill model: next-bar-open with 5bps slippage (Indian Equities). Processing 420 signal events." },
    { label: "Executing validation suite", thinking: "⚠ Warning: 3 periods show correlation > 0.85 with NIFTY 50. Bootstrap resampling with 10,000 iterations. P-value: 0.018." },
    { label: "Calculating metrics", thinking: "Computing risk-adjusted returns. Win rate: 62.4%, avg win/loss ratio: 1.85. Tail risk: CVaR(95%)=-2.8%." },
    { label: "Generating report", thinking: "Compiling performance attribution. Sector exposure analysis complete. Generating visualizations. Report finalized." },
  ];

  walkForwardEquity = Array.from({ length: 60 }, (_, i) => ({
    month: `M${i + 1}`,
    train: baseCapital + i * 18000 + Math.sin(i * 0.3) * 50000 * volatility + (Math.random() - 0.3) * 30000,
    test: baseCapital + i * 14000 + Math.cos(i * 0.25) * 40000 * volatility + (Math.random() - 0.35) * 25000,
  }));

  rollingSharpe = Array.from({ length: 48 }, (_, i) => ({
    month: `M${i + 1}`,
    sharpe: 1.2 + Math.sin(i * 0.15) * 0.6 * volatility + (Math.random() - 0.5) * 0.3,
  }));

  windowPerformance = [
    { window: "W1", ret: 14.2 + Math.random() * 2 }, { window: "W2", ret: 8.7 + Math.random() * 2 }, 
    { window: "W3", ret: 22.1 + Math.random() * 2 }, { window: "W4", ret: -3.4 - Math.random() * 2 }, 
    { window: "W5", ret: 17.8 + Math.random() * 2 }, { window: "W6", ret: 11.5 + Math.random() * 2 },
    { window: "W7", ret: 6.9 + Math.random() * 2 }, { window: "W8", ret: 19.3 + Math.random() * 2 },
  ];

  monteCarloHistogram = Array.from({ length: 30 }, (_, i) => {
    const x = baseCapital * 0.8 + i * (baseCapital * 0.08); // ₹8L to ₹32L
    const mu = baseCapital * 1.8, sigma = baseCapital * 0.35;
    return { bin: `₹${(x / 100000).toFixed(1)}L`, rawBin: x, freq: Math.round(800 * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)) + Math.floor(Math.random() * 20) };
  });

  sharpeDistMC = Array.from({ length: 25 }, (_, i) => {
    const x = 0.2 + i * 0.12;
    return { bin: x.toFixed(2), freq: Math.round(600 * Math.exp(-0.5 * ((x - 1.4) / 0.45) ** 2)) + Math.floor(Math.random() * 15) };
  });

  mcPaths = Array.from({ length: 8 }, (_, pathIdx) =>
    Array.from({ length: 50 }, (_, i) => ({
      day: i,
      equity: baseCapital + i * (12000 + pathIdx * 3000) + Math.sin(i * 0.2 + pathIdx) * 80000 * volatility + (Math.random() - 0.4) * 50000,
    }))
  );

  varExceedance = Array.from({ length: 100 }, (_, i) => {
    const loss = -0.5 + Math.random() * -4.5;
    const var95 = -2.8;
    return { day: i + 1, loss: parseFloat(loss.toFixed(2)), var95, exceeded: loss < var95 };
  });

  lossDistribution = Array.from({ length: 30 }, (_, i) => {
    const x = -5 + i * 0.35;
    return { bin: x.toFixed(1), freq: Math.round(500 * Math.exp(-0.5 * ((x + 0.8) / 1.2) ** 2)) + Math.floor(Math.random() * 10) };
  });

  confidenceIntervals = Array.from({ length: 40 }, (_, i) => ({
    day: i + 1,
    var95: -2.8 - Math.sin(i * 0.1) * 0.4,
    var99: -3.6 - Math.sin(i * 0.1) * 0.5,
    actual: -1.2 + Math.sin(i * 0.15) * 2.5 * volatility + (Math.random() - 0.5) * 1.5,
  }));

  regimeEquity = Array.from({ length: 80 }, (_, i) => {
    const regime = i < 20 ? "bull" : i < 40 ? "bear" : i < 60 ? "sideways" : "bull";
    const base = regime === "bull" ? 22000 : regime === "bear" ? -15000 : 4000;
    return {
      day: i + 1, equity: baseCapital + i * 15000 + base * (i / 20) + (Math.random() - 0.4) * 30000,
      regime,
    };
  });

  regimePerformance = [
    { regime: "Bull", ret: 28.4 + Math.random() * 5, color: "#22c55e" },
    { regime: "Bear", ret: -8.2 - Math.random() * 3, color: "#ef4444" },
    { regime: "Sideways", ret: 5.1 + Math.random() * 2, color: "#eab308" },
  ];

  regimeFrequency = [
    { name: "Bull", value: 42, fill: "#22c55e" },
    { name: "Bear", value: 28, fill: "#ef4444" },
    { name: "Sideways", value: 30, fill: "#eab308" },
  ];

  paramHeatmap = Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => ({
      x: col, y: row,
      sharpe: 0.3 + Math.exp(-0.1 * ((row - 3) ** 2 + (col - 4) ** 2)) * 1.8 + (Math.random() - 0.5) * 0.3,
    }))
  ).flat();

  sharpeSensitivity = Array.from({ length: 20 }, (_, i) => ({
    param: i + 5,
    sharpe: 0.8 + Math.exp(-0.05 * (i - 10) ** 2) * 1.2 + (Math.random() - 0.5) * 0.15,
    insample: 1.0 + Math.exp(-0.04 * (i - 10) ** 2) * 1.5,
  }));

  parallelPaths = Array.from({ length: 12 }, (_, pathIdx) =>
    Array.from({ length: 60 }, (_, i) => ({
      day: i,
      equity: baseCapital + i * (8000 + (pathIdx - 6) * 2000) + Math.sin(i * 0.1 + pathIdx * 0.5) * 60000 * volatility + (Math.random() - 0.45) * 40000,
    }))
  );

  sharpeHistogramData = Array.from({ length: 30 }, (_, i) => {
    const x = -0.5 + i * 0.12;
    return { bin: x.toFixed(2), freq: Math.round(500 * Math.exp(-0.5 * ((x - 1.4) / 0.5) ** 2)) + Math.floor(Math.random() * 10) };
  });

  sharpeConfBand = Array.from({ length: 50 }, (_, i) => ({
    sample: i + 1,
    sharpe: parseFloat(KPI_DATA.sharpe) + Math.sin(i * 0.08) * 0.3 + (Math.random() - 0.5) * 0.15,
    upper: parseFloat(KPI_DATA.sharpe) + 0.5 + Math.sin(i * 0.08) * 0.2,
    lower: parseFloat(KPI_DATA.sharpe) - 0.5 + Math.sin(i * 0.08) * 0.2,
  }));

  alphaDecay = Array.from({ length: 36 }, (_, i) => ({
    month: i + 1,
    alpha: 2.8 * Math.exp(-0.06 * i) + (Math.random() - 0.5) * 0.2,
  }));

  halfLifeProjection = Array.from({ length: 48 }, (_, i) => ({
    month: i + 1,
    projected: parseFloat(KPI_DATA.sharpe) * Math.exp(-0.04 * i),
    actual: i < 24 ? parseFloat(KPI_DATA.sharpe) * Math.exp(-0.04 * i) + (Math.random() - 0.5) * 0.15 : undefined,
    halfLine: parseFloat(KPI_DATA.sharpe) / 2,
  }));

  AI_ANALYSIS = {
    "walk-forward": {
      summary: "Walk-forward analysis across 8 windows shows consistent out-of-sample performance in Indian Equities. The strategy maintained positive returns in 7 of 8 test windows.",
      risk: ["Max drawdown occurred during market volatility. Sharpe ratio is robust.", "Regime dependency detected: degrades ~35% during high-VIX environments."],
      robustness: ["7/8 windows profitable — 87.5% consistency rate.", "Walk-forward efficiency ratio: 0.82, low overfitting risk."],
      warnings: ["Consider adding VIX-based position scaling for NSE."],
      verdict: "Strategy demonstrates moderate statistical edge. Recommended for live deployment.",
      verdictType: "positive",
    },
    "monte-carlo": {
      summary: `Monte Carlo simulation with 1,000 paths shows 89.2% probability of positive terminal wealth. Median final equity: ₹${(baseCapital * 1.78 / 100000).toFixed(1)}L.`,
      risk: [`5th percentile outcome: ₹${(baseCapital * 1.12 / 100000).toFixed(1)}L`, "Sharpe distribution median is consistent.", "Tail risk: 2.3% probability of >20% drawdown"],
      robustness: ["Probability of profit: 89.2% across 1,000 simulated paths", "Path dispersion is moderate."],
      warnings: ["10.8% of paths end in loss — strategy is not risk-free", "Fat-tailed distribution detected."],
      verdict: "Monte Carlo results support strategy viability in the Indian market with 89.2% win probability.",
      verdictType: "positive",
    },
    "kupiec": {
      summary: "VaR model validation using Kupiec POF test. Model is accurate.",
      risk: ["VaR exceedance rate: 4.8% vs 5.0% expected", "Max single-day loss is within bounds."],
      robustness: ["Christoffersen independence test p-value: 0.312", "VaR model stability: calibration holds."],
      warnings: ["3 consecutive exceedances detected — consider GARCH."],
      verdict: "Risk model passes both Kupiec and Christoffersen tests.",
      verdictType: "positive",
    },
    "regime": {
      summary: "Performance segmented across Bull, Bear, and Sideways NSE market regimes.",
      risk: ["Bull regime: strong momentum capture", "Bear regime: drawdown contained.", "Regime transition risk: 12 false signals."],
      robustness: ["Strategy outperforms NIFTY benchmark in all 3 regimes.", "Accurate regime tracking."],
      warnings: ["Strategy performance is heavily better in bull vs bear.", "Recommend regime-aware position sizing."],
      verdict: "Strategy shows clear regime dependency with strong bull-market alpha.",
      verdictType: "neutral",
    },
    "overfitting": {
      summary: "Overfitting analysis using parameter sensitivity, data snooping tests. Score: 0.23 (low risk).",
      risk: ["Parameter sensitivity: Sharpe varies ±0.3", "In-sample vs OOS Sharpe ratio is balanced."],
      robustness: ["White's Reality Check survives data snooping bias", "Parameter stability across sub-periods."],
      warnings: ["Mild IS-to-OOS degradation.", "Strategy uses 4 parameters — borderline for 1,512 daily bars."],
      verdict: "Low overfitting risk in NSE data limits.",
      verdictType: "positive",
    },
    "parallel": {
      summary: "12 synthetic alternative histories generated using block bootstrap. Consistent returns.",
      risk: ["Median terminal equity is stable.", "Best and worst universe outcomes captured."],
      robustness: ["83.3% of universes end profitable.", "Cross-universe Sharpe range shows moderate dispersion."],
      warnings: ["Wide Sharpe range suggests sensitivity to microstructure."],
      verdict: "Strategy demonstrates solid robustness across parallel universes.",
      verdictType: "positive",
    },
    "sharpe": {
      summary: "Bootstrap analysis of Sharpe ratio yields stable confidence bounds.",
      risk: ["Point estimate is strong constraint.", "Probability of Sharpe > 1.0: 78.4%"],
      robustness: ["Bootstrap standard error: 0.28", "Sharpe is stable across sub-periods."],
      warnings: ["CI width indicates meaningful uncertainty."],
      verdict: "Tight confidence band strongly suggests genuine risk-adjusted edge.",
      verdictType: "positive",
    },
    "longevity": {
      summary: "Alpha decay analysis estimates strategy half-life at 14.2 months.",
      risk: ["Current annualized alpha: 2.8%", "Decay rate: 6% per month."],
      robustness: ["Decay model strong fit to exponential decay", "Alpha sources: Systematic momentum."],
      warnings: ["Strategy edge will likely be depleted within 24 months.", "Momentum alpha showing faster decay."],
      verdict: "Strategy has a finite but actionable edge.",
      verdictType: "neutral",
    },
  };
}

regenerateBacktestData(); // Initialize once on load
