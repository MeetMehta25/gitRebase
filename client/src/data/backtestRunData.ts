// Hardcoded realistic quant backtest data for all 8 validation suites

export const KPI_DATA = {
  cagr: "18.7%",
  sharpe: "1.42",
  sortino: "2.18",
  maxDrawdown: "-12.4%",
  profitFactor: "1.87",
};

export const PROGRESS_STEPS = [
  { label: "Initializing", thinking: "Setting up execution environment. Loading configuration parameters: lookback=252, rebalance_frequency=monthly, slippage_model=volume_based. Allocating memory for 15,200 price observations across 47 instruments." },
  { label: "Loading historical market data", thinking: "Fetching OHLCV data from 2018-01-02 to 2024-12-31. Total bars: 1,512 daily candles per instrument. Adjusting for splits and dividends. Data quality check: 99.7% fill rate, 4 gap-fills applied using forward-fill interpolation." },
  { label: "Computing indicators", thinking: "The strategy uses MACD crossovers to detect momentum shifts. A bullish crossover occurs when the MACD line (12,26 EMA difference) crosses above the 9-period signal line. Also computing: RSI(14), Bollinger Bands(20,2), ATR(14) for position sizing. Keltner Channel width used as volatility filter — entries only taken when KC width > 1.5x 60-day median." },
  { label: "Running simulation engine", thinking: "Executing vectorized backtest across 1,512 bars. Fill model: next-bar-open with 5bps slippage. Commission: $0.005/share. Processing 342 signal events, generating 186 round-trip trades. Portfolio rebalanced at each signal with equal-weight allocation capped at 20% per position." },
  { label: "Executing validation suite", thinking: "⚠ Warning: 3 periods show correlation > 0.85 with benchmark — potential regime dependency. Running statistical significance tests. Bootstrap resampling with 10,000 iterations. Null hypothesis: strategy returns = benchmark returns. P-value: 0.023 — statistically significant at 95% confidence." },
  { label: "Calculating metrics", thinking: "Computing risk-adjusted returns: Sharpe=1.42, Sortino=2.18, Calmar=1.51. Maximum drawdown: -12.4% (2022-06-13 to 2022-10-14, recovery: 47 days). Win rate: 58.6%, avg win/loss ratio: 1.62. Tail risk: CVaR(95%)=-2.1%, skewness=-0.34, kurtosis=4.12." },
  { label: "Generating report", thinking: "Compiling performance attribution. Sector exposure analysis complete. Alpha decomposition: systematic=62%, idiosyncratic=38%. Generating visualizations for all chart panels. Report finalized with 24 metrics across 6 categories." },
];

// Walk-forward data
export const walkForwardEquity = Array.from({ length: 60 }, (_, i) => ({
  month: `M${i + 1}`,
  train: 100000 + i * 1800 + Math.sin(i * 0.3) * 5000 + (Math.random() - 0.3) * 3000,
  test: 100000 + i * 1400 + Math.cos(i * 0.25) * 4000 + (Math.random() - 0.35) * 2500,
}));

export const rollingSharpe = Array.from({ length: 48 }, (_, i) => ({
  month: `M${i + 1}`,
  sharpe: 1.2 + Math.sin(i * 0.15) * 0.6 + (Math.random() - 0.5) * 0.3,
}));

export const windowPerformance = [
  { window: "W1", ret: 14.2 }, { window: "W2", ret: 8.7 }, { window: "W3", ret: 22.1 },
  { window: "W4", ret: -3.4 }, { window: "W5", ret: 17.8 }, { window: "W6", ret: 11.5 },
  { window: "W7", ret: 6.9 }, { window: "W8", ret: 19.3 },
];

// Monte Carlo data
export const monteCarloHistogram = Array.from({ length: 30 }, (_, i) => {
  const x = 80000 + i * 8000;
  const mu = 180000, sigma = 35000;
  return { bin: `$${(x / 1000).toFixed(0)}k`, freq: Math.round(800 * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)) };
});

export const sharpeDistMC = Array.from({ length: 25 }, (_, i) => {
  const x = 0.2 + i * 0.12;
  return { bin: x.toFixed(2), freq: Math.round(600 * Math.exp(-0.5 * ((x - 1.4) / 0.45) ** 2)) };
});

export const mcPaths = Array.from({ length: 8 }, (_, pathIdx) =>
  Array.from({ length: 50 }, (_, i) => ({
    day: i,
    equity: 100000 + i * (1200 + pathIdx * 300) + Math.sin(i * 0.2 + pathIdx) * 8000 + (Math.random() - 0.4) * 5000,
  }))
);

// Kupiec data
export const varExceedance = Array.from({ length: 100 }, (_, i) => {
  const loss = -0.5 + Math.random() * -4.5;
  const var95 = -2.8;
  return { day: i + 1, loss: parseFloat(loss.toFixed(2)), var95, exceeded: loss < var95 };
});

export const lossDistribution = Array.from({ length: 30 }, (_, i) => {
  const x = -5 + i * 0.35;
  return { bin: x.toFixed(1), freq: Math.round(500 * Math.exp(-0.5 * ((x + 0.8) / 1.2) ** 2)) };
});

export const confidenceIntervals = Array.from({ length: 40 }, (_, i) => ({
  day: i + 1,
  var95: -2.8 - Math.sin(i * 0.1) * 0.4,
  var99: -3.6 - Math.sin(i * 0.1) * 0.5,
  actual: -1.2 + Math.sin(i * 0.15) * 2.5 + (Math.random() - 0.5) * 1.5,
}));

// Regime data
export const regimeEquity = Array.from({ length: 80 }, (_, i) => {
  const regime = i < 20 ? "bull" : i < 40 ? "bear" : i < 60 ? "sideways" : "bull";
  const base = regime === "bull" ? 2200 : regime === "bear" ? -1500 : 400;
  return {
    day: i + 1, equity: 100000 + i * 1500 + base * (i / 20) + (Math.random() - 0.4) * 3000,
    regime,
  };
});

export const regimePerformance = [
  { regime: "Bull", ret: 28.4, color: "#22c55e" },
  { regime: "Bear", ret: -8.2, color: "#ef4444" },
  { regime: "Sideways", ret: 5.1, color: "#eab308" },
];

export const regimeFrequency = [
  { name: "Bull", value: 42, fill: "#22c55e" },
  { name: "Bear", value: 28, fill: "#ef4444" },
  { name: "Sideways", value: 30, fill: "#eab308" },
];

// Overfitting data
export const paramHeatmap = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 8 }, (_, col) => ({
    x: col, y: row,
    sharpe: 0.3 + Math.exp(-0.1 * ((row - 3) ** 2 + (col - 4) ** 2)) * 1.8 + (Math.random() - 0.5) * 0.3,
  }))
).flat();

export const sharpeSensitivity = Array.from({ length: 20 }, (_, i) => ({
  param: i + 5,
  sharpe: 0.8 + Math.exp(-0.05 * (i - 10) ** 2) * 1.2 + (Math.random() - 0.5) * 0.15,
  insample: 1.0 + Math.exp(-0.04 * (i - 10) ** 2) * 1.5,
}));

// Parallel universes data
export const parallelPaths = Array.from({ length: 12 }, (_, pathIdx) =>
  Array.from({ length: 60 }, (_, i) => ({
    day: i,
    equity: 100000 + i * (800 + (pathIdx - 6) * 200) + Math.sin(i * 0.1 + pathIdx * 0.5) * 6000 + (Math.random() - 0.45) * 4000,
  }))
);

// Sharpe distribution data
export const sharpeHistogramData = Array.from({ length: 30 }, (_, i) => {
  const x = -0.5 + i * 0.12;
  return { bin: x.toFixed(2), freq: Math.round(500 * Math.exp(-0.5 * ((x - 1.4) / 0.5) ** 2)) };
});

export const sharpeConfBand = Array.from({ length: 50 }, (_, i) => ({
  sample: i + 1,
  sharpe: 1.42 + Math.sin(i * 0.08) * 0.3 + (Math.random() - 0.5) * 0.15,
  upper: 1.92 + Math.sin(i * 0.08) * 0.2,
  lower: 0.92 + Math.sin(i * 0.08) * 0.2,
}));

// Longevity data
export const alphaDecay = Array.from({ length: 36 }, (_, i) => ({
  month: i + 1,
  alpha: 2.8 * Math.exp(-0.06 * i) + (Math.random() - 0.5) * 0.2,
}));

export const halfLifeProjection = Array.from({ length: 48 }, (_, i) => ({
  month: i + 1,
  projected: 1.42 * Math.exp(-0.04 * i),
  actual: i < 24 ? 1.42 * Math.exp(-0.04 * i) + (Math.random() - 0.5) * 0.15 : undefined,
  halfLine: 0.71,
}));

// AI Analysis content per suite
export const AI_ANALYSIS: Record<string, {
  summary: string;
  risk: string[];
  robustness: string[];
  warnings: string[];
  verdict: string;
  verdictType: "positive" | "neutral" | "negative";
}> = {
  "walk-forward": {
    summary: "Walk-forward analysis across 8 windows shows consistent out-of-sample performance. The strategy maintained positive returns in 7 of 8 test windows, with an average out-of-sample Sharpe of 1.18.",
    risk: [
      "Max drawdown of -12.4% occurred during Window 4 (Q2 2022), coinciding with aggressive Fed rate hikes.",
      "Sharpe ratio of 1.42 is robust — above the 1.0 threshold for institutional acceptance.",
      "Moderate regime dependency detected: performance degrades ~35% during high-VIX environments (VIX > 25).",
    ],
    robustness: [
      "7/8 windows profitable — 87.5% consistency rate exceeds the 75% threshold for production deployment.",
      "Walk-forward efficiency ratio: 0.82 (out-of-sample / in-sample Sharpe), indicating low overfitting risk.",
      "Returns show low autocorrelation (DW statistic: 1.94), suggesting no serial dependency exploitation.",
    ],
    warnings: [
      "Window 4 showed negative returns (-3.4%) — strategy should incorporate VIX-based position scaling.",
      "Rolling Sharpe dips below 0.8 in 3 periods — consider adding regime filters.",
    ],
    verdict: "Strategy demonstrates moderate statistical edge with Sharpe 1.42 and stable performance across walk-forward windows. Recommended for live deployment with reduced position sizing during high-volatility regimes.",
    verdictType: "positive",
  },
  "monte-carlo": {
    summary: "Monte Carlo simulation with 1,000 paths shows 89.2% probability of positive terminal wealth. Median final equity: $178,400 (78.4% return over the backtest period).",
    risk: ["5th percentile outcome: $112,300 (-5.2% drawdown worst case)", "Sharpe distribution median: 1.38, 95% CI: [0.72, 2.04]", "Tail risk: 2.3% probability of >20% drawdown"],
    robustness: ["Probability of profit: 89.2% across 1,000 simulated paths", "Median path Sharpe: 1.38, consistent with backtest Sharpe of 1.42", "Path dispersion (std of final equity): $32,100 — moderate uncertainty"],
    warnings: ["10.8% of paths end in loss — strategy is not risk-free", "Fat-tailed distribution detected (kurtosis: 4.12) — extreme outcomes more likely than normal"],
    verdict: "Monte Carlo results support strategy viability with 89.2% win probability. The distribution of outcomes is favorably skewed with manageable tail risk.",
    verdictType: "positive",
  },
  "kupiec": {
    summary: "VaR model validation using Kupiec POF test and Christoffersen independence test. The 95% VaR model shows 4.8% exceedance rate (expected: 5%), passing both tests.",
    risk: ["VaR exceedance rate: 4.8% vs 5.0% expected — model is well-calibrated", "Kupiec test p-value: 0.847 — fail to reject null (model is accurate)", "Max single-day loss: -4.2% on 2022-06-13"],
    robustness: ["Christoffersen independence test p-value: 0.312 — exceedances are not clustered", "99% VaR exceedance rate: 1.2% vs 1.0% expected — slightly conservative", "VaR model stability: calibration holds across rolling 6-month windows"],
    warnings: ["3 consecutive exceedances detected in Sept 2022 — borderline clustering", "Consider upgrading to GARCH-based VaR for volatile regimes"],
    verdict: "Risk model passes both Kupiec and Christoffersen tests. VaR estimates are well-calibrated with no significant clustering of exceedances.",
    verdictType: "positive",
  },
  "regime": {
    summary: "Strategy performance segmented across Bull, Bear, and Sideways market regimes using HMM classification. Strong alpha generation in bull markets, moderate loss containment in bear regimes.",
    risk: ["Bull regime: +28.4% annualized — strong momentum capture", "Bear regime: -8.2% annualized — drawdown contained vs benchmark -18.7%", "Regime transition risk: 12 false signals detected at regime boundaries"],
    robustness: ["Strategy outperforms benchmark in all 3 regimes (alpha: +10.2%, +10.5%, +3.8%)", "Regime classification accuracy: 78% (validated against NBER recession dates)", "Low regime-switching cost: avg 1.2% slippage during transitions"],
    warnings: ["Strategy performance is 3.4x better in bull vs bear — significant regime dependency", "Sideways regime accounts for 30% of time but only 5.1% annualized return", "Consider regime-adaptive position sizing to improve bear market performance"],
    verdict: "Strategy shows clear regime dependency with strong bull-market alpha. Bear-market drawdowns are contained but significant. Recommend regime-aware position sizing overlay.",
    verdictType: "neutral",
  },
  "overfitting": {
    summary: "Overfitting analysis using parameter sensitivity, data snooping tests, and in-sample vs out-of-sample comparison. Overfitting score: 0.23 (low risk — scale: 0=none, 1=severe).",
    risk: ["Parameter sensitivity: Sharpe varies ±0.3 across ±20% parameter perturbation", "Optimal parameter region is broad (spanning 6 parameter combinations)", "In-sample vs OOS Sharpe ratio: 1.68 vs 1.42 — 15.5% degradation (acceptable)"],
    robustness: ["White's Reality Check p-value: 0.034 — strategy survives data snooping bias adjustment", "Deflated Sharpe Ratio: 1.12 (adjusted for multiple testing)", "Parameter stability: optimal region consistent across 4/5 sub-periods"],
    warnings: ["15.5% in-sample to OOS degradation suggests mild curve-fitting", "Strategy uses 4 parameters — borderline for 1,512 data points (rule of thumb: <5 params per 1000 obs)"],
    verdict: "Low overfitting risk with score 0.23. Strategy parameters show broad optimal region and survive data snooping tests. Mild IS-to-OOS degradation is within acceptable bounds.",
    verdictType: "positive",
  },
  "parallel": {
    summary: "12 synthetic alternative histories generated using block bootstrap with replacement. Strategy maintains positive returns in 10 of 12 parallel universes (83.3% consistency).",
    risk: ["Median terminal equity across universes: $168,200", "Worst universe outcome: -4.8% total return", "Best universe outcome: +124.2% total return"],
    robustness: ["83.3% of universes end profitable — strong multi-history robustness", "Cross-universe Sharpe range: [0.42, 2.14] — moderate dispersion", "Path-dependent strategy components verified: entry timing robust to historical reordering"],
    warnings: ["2 of 12 universes show negative returns — strategy not universally profitable", "Wide Sharpe range (0.42-2.14) suggests sensitivity to market microstructure"],
    verdict: "Strategy demonstrates solid robustness across parallel universes with 83.3% win rate. The dispersion of outcomes is acceptable for a momentum-based approach.",
    verdictType: "positive",
  },
  "sharpe": {
    summary: "Bootstrap analysis of Sharpe ratio distribution yields point estimate 1.42 with 95% confidence interval [0.88, 1.96]. Probability of Sharpe > 0: 98.7%.",
    risk: ["Point estimate: 1.42 — strong risk-adjusted performance", "95% CI: [0.88, 1.96] — lower bound still above minimum acceptable threshold of 0.5", "Probability of Sharpe > 1.0: 78.4%"],
    robustness: ["Bootstrap standard error: 0.28 — moderate estimation uncertainty", "Sharpe is stable across sub-periods (rolling 12M range: 0.94 to 1.89)", "Distribution is approximately normal (Jarque-Bera p: 0.42) — CI is reliable"],
    warnings: ["CI width of 1.08 indicates meaningful uncertainty — true Sharpe could be as low as 0.88", "Small sample bias correction applied (Lo, 2002): adjusted Sharpe = 1.38"],
    verdict: "Sharpe ratio of 1.42 with tight confidence band strongly suggests genuine risk-adjusted edge. The 98.7% probability of positive Sharpe provides high confidence in strategy viability.",
    verdictType: "positive",
  },
  "longevity": {
    summary: "Alpha decay analysis estimates strategy half-life at 14.2 months. Current alpha: 2.8% annualized, decaying at 6% per month. Projected edge depletion: ~24 months.",
    risk: ["Current annualized alpha: 2.8%", "Decay rate: 6% per month (exponential model R²=0.87)", "Projected half-life: 14.2 months — alpha drops to 1.4% by month 14"],
    robustness: ["Decay model R²: 0.87 — strong fit to exponential decay", "Alpha sources: 62% systematic momentum, 38% mean-reversion — momentum component decays faster", "Capacity estimate: strategy alpha stable up to ~$50M AUM"],
    warnings: ["Strategy edge will likely be depleted within 24 months without parameter refresh", "Momentum alpha showing faster decay (8%/mo) vs mean-reversion (3%/mo)", "Recommend quarterly re-optimization with walk-forward validation"],
    verdict: "Strategy has a finite but actionable edge with 14.2-month half-life. Recommend deployment with quarterly re-optimization cycle and capacity limits under $50M AUM.",
    verdictType: "neutral",
  },
};
