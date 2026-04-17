import re

with open("src/data/strategyData.ts", "r") as f:
    text = f.read()

# I am KEEPING: StrategyQuestion, NODE_PROPERTY_CONFIG, STRATEGY_QUESTIONS.
# I am DELETING: FALLBACK_BACKTEST, FALLBACK_ADVERSARIAL, ALL_WORKFLOWS, getWorkflowNodes, getStrategyById, getStrategyByPrompt, apiWithFallback, BacktestExecNode, getBacktestWorkflowNodes
# It's easier to just overwrite strategyData.ts with ONLY the interfaces and STRATEGY_QUESTIONS.

new_content = """export interface StrategyQuestion {
  id: number;
  prompt: string;
  ticker: string;
  timeframe: string;
  goal: string;
  risk_level: string;
  short_name: string;
}

export const STRATEGY_QUESTIONS: StrategyQuestion[] = [
  {
    id: 1,
    prompt:
      "Create a mean reversion strategy for RELIANCE.NS using RSI and support/resistance levels",
    ticker: "RELIANCE.NS",
    timeframe: "1d",
    goal: "mean_reversion",
    risk_level: "medium",
    short_name: "Reliance Mean Reversion",
  },
  {
    id: 2,
    prompt: "Build an aggressive breakout strategy for INFY.NS using Bollinger Bands and MACD",
    ticker: "INFY.NS",
    timeframe: "1h",
    goal: "breakout",
    risk_level: "high",
    short_name: "INFY Breakout Edge",
  },
  {
    id: 3,
    prompt: "Design a long-term trend following system for TCS.NS with Moving Averages",
    ticker: "TCS.NS",
    timeframe: "1w",
    goal: "trend_following",
    risk_level: "low",
    short_name: "TCS Trend Follower",
  },
  {
    id: 4,
    prompt: "Medium risk volatility contraction strategy for HDFCBANK.NS using ADX",
    ticker: "HDFCBANK.NS",
    timeframe: "1d",
    goal: "volatility",
    risk_level: "medium",
    short_name: "HDFC Volatility Contraction",
  },
];
"""

with open("src/data/strategyData.ts", "w") as f:
    f.write(new_content)
