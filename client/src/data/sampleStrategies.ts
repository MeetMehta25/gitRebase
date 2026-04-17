// Sample strategy presets for each validation suite
// Each suite gets a unique, realistic strategy configuration

export interface SampleStrategy {
  strategyDescription: string;
  dateFrom: string;
  dateTo: string;
  timeframe: string;
  assetClass: string;
  universe: string;
  entryTiming: string;
  maxHolding: number;
  maxPositions: number;
  initialCapital: number;
  stopLoss: number;
  commission: number;
  buyOrderPriority: string;
}

export const SAMPLE_STRATEGIES: Record<string, SampleStrategy> = {
  "walk-forward": {
    strategyDescription:
      "Go long when MACD(12,26) crosses above the 9-period signal line AND RSI(14) is below 65.\nExit when MACD crosses below the signal, RSI exceeds 80, or after 30 days — whichever comes first.\nFilter: only enter when Keltner Channel width > 1.5× its 60-day median.",
    dateFrom: "2020-01-01",
    dateTo: "2025-01-01",
    timeframe: "1-Day",
    assetClass: "Stock",
    universe: "NIFTY 50",
    entryTiming: "At Market Open",
    maxHolding: 30,
    maxPositions: 5,
    initialCapital: 1000000,
    stopLoss: 10,
    commission: 0.1,
    buyOrderPriority: "Market Cap ↓ — Large cap first",
  },
  "monte-carlo": {
    strategyDescription:
      "Buy when the 20-day Bollinger Band %B drops below 0.05 (oversold squeeze).\nSell when %B rises above 0.95 or a trailing stop of 2× ATR(14) is hit.\nPosition size: risk 1% of portfolio per trade using ATR-based sizing.",
    dateFrom: "2019-06-01",
    dateTo: "2025-01-01",
    timeframe: "1-Day",
    assetClass: "Stock",
    universe: "NIFTY IT",
    entryTiming: "At Market Close",
    maxHolding: 20,
    maxPositions: 8,
    initialCapital: 500000,
    stopLoss: 8,
    commission: 0.05,
    buyOrderPriority: "Volume ↓ — High liquidity first",
  },
  kupiec: {
    strategyDescription:
      "Enter long when price closes above the 50-day SMA AND India VIX is below its 20-day moving average.\nExit when price closes below the 50-day SMA or India VIX spikes above 18.\nUse a fixed 2% stop loss per position to validate VaR model accuracy.",
    dateFrom: "2018-01-01",
    dateTo: "2024-12-31",
    timeframe: "1-Day",
    assetClass: "ETF",
    universe: "NIFTY 50",
    entryTiming: "At Market Open",
    maxHolding: 45,
    maxPositions: 3,
    initialCapital: 2000000,
    stopLoss: 2,
    commission: 0.02,
    buyOrderPriority: "Market Cap ↓ — Large cap first",
  },
  regime: {
    strategyDescription:
      "In bull regime (HMM state 0): go long momentum leaders (top 10% 6-month returns).\nIn bear regime (HMM state 1): rotate to defensive sectors (Utilities, Healthcare, Staples).\nIn sideways regime: hold 50% cash, trade mean-reversion on RSI(5) extremes.",
    dateFrom: "2015-01-01",
    dateTo: "2025-01-01",
    timeframe: "1-Day",
    assetClass: "Stock",
    universe: "NIFTY 50",
    entryTiming: "At Market Close",
    maxHolding: 60,
    maxPositions: 10,
    initialCapital: 1500000,
    stopLoss: 12,
    commission: 0.08,
    buyOrderPriority: "Market Cap ↓ — Large cap first",
  },
  overfitting: {
    strategyDescription:
      "Go long when the 10-day EMA crosses above the 30-day EMA with confirmation from ADX(14) > 25.\nExit on EMA cross-down or when ADX drops below 20.\nMinimal parameters to test overfitting sensitivity: only 3 tuneable inputs.",
    dateFrom: "2017-01-01",
    dateTo: "2024-06-30",
    timeframe: "1-Day",
    assetClass: "Stock",
    universe: "NIFTY NEXT 50",
    entryTiming: "At Market Open",
    maxHolding: 25,
    maxPositions: 4,
    initialCapital: 750000,
    stopLoss: 7,
    commission: 0.1,
    buyOrderPriority: "Price ↓ — High price first",
  },
  parallel: {
    strategyDescription:
      "Buy breakouts above the 52-week high with volume > 2× 20-day average volume.\nSell when price retraces 10% from the breakout high or after 40 trading days.\nUniverse: mid-cap stocks to test robustness across alternative market histories.",
    dateFrom: "2018-06-01",
    dateTo: "2024-12-31",
    timeframe: "1-Day",
    assetClass: "Stock",
    universe: "NIFTY MIDCAP 100",
    entryTiming: "Intraday",
    maxHolding: 40,
    maxPositions: 6,
    initialCapital: 1200000,
    stopLoss: 10,
    commission: 0.15,
    buyOrderPriority: "Volume ↓ — High liquidity first",
  },
  sharpe: {
    strategyDescription:
      "Pairs trading strategy: go long the underperformer and short the outperformer when the z-score of the spread exceeds ±2.\nExit when the z-score reverts to 0 or after 15 trading days.\nUse cointegration (Engle-Granger) to select pairs.",
    dateFrom: "2019-01-01",
    dateTo: "2025-01-01",
    timeframe: "1-Hour",
    assetClass: "Stock",
    universe: "NIFTY IT",
    entryTiming: "Intraday",
    maxHolding: 15,
    maxPositions: 4,
    initialCapital: 800000,
    stopLoss: 5,
    commission: 0.12,
    buyOrderPriority: "Market Cap ↑ — Small cap first",
  },
  longevity: {
    strategyDescription:
      "Momentum-decay test: buy top-decile 12-month momentum stocks, hold for 1 month, rebalance.\nTrack alpha decay over successive 6-month windows.\nUse Fama-French 5-factor model to decompose alpha sources.",
    dateFrom: "2016-01-01",
    dateTo: "2025-01-01",
    timeframe: "1-Day",
    assetClass: "Stock",
    universe: "NIFTY 50",
    entryTiming: "At Market Close",
    maxHolding: 22,
    maxPositions: 15,
    initialCapital: 2000000,
    stopLoss: 15,
    commission: 0.05,
    buyOrderPriority: "Market Cap ↓ — Large cap first",
  },
};
