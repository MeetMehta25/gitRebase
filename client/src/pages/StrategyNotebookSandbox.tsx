import { useState } from "react";
import {
  Play,
  CheckCircle2,
  Terminal,
  Loader2,
  Code2,
  LineChart,
  FileJson,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Area,
  ComposedChart,
} from "recharts";

const EXAMPLES = [
  {
    id: "ex1",
    name: "Breakout & Pullback on NIFTY 50",
    cells: [
      {
        id: 1,
        title: "Cell 1: Load Data",
        icon: <Code2 className="w-4 h-4" />,
        code: `import pandas as pd\nimport yfinance as yf\n\n# Load NIFTY 50 Historical Data\nprint("Connecting to YAHOO Finance API...")\ndata = yf.download("^NSEI", start="2023-03-13", end="2026-03-12", interval="1d")\nprint(f"Loaded {len(data)} rows.")\ndata.head()`,
        logs: [
          "Initializing environment variables...",
          "Connecting to YAHOO Finance API...",
          "Downloading ^NSEI ticker data [2023-03-13 to 2026-03-12]",
          "✓ Loaded 756 rows.",
          "Data payload successful.",
        ],
        output: `[^NSEI Data Preview]\nDate       Open     High     Low      Close\n2023-03-13 17122.10 17212.45 17044.30 17145.35\n2023-03-14 17200.40 17318.10 17161.55 17282.10\n...`,
      },
      {
        id: 2,
        title: "Cell 2: Indicators",
        icon: <LineChart className="w-4 h-4" />,
        code: `# Calculate 30-period EMA\ndata['EMA_30'] = data['Close'].ewm(span=30, adjust=False).mean()\n\n# Calculate 5-period Bollinger Bands (0.3 std)\ndata['SMA_5'] = data['Close'].rolling(window=5).mean()\ndata['STD_5'] = data['Close'].rolling(window=5).std()\ndata['Lower_BB_5'] = data['SMA_5'] - (0.3 * data['STD_5'])\n\n# Calculate 10-period Bollinger Bands (0.3 std)\ndata['SMA_10'] = data['Close'].rolling(window=10).mean()\ndata['STD_10'] = data['Close'].rolling(window=10).std()\ndata['Upper_BB_10'] = data['SMA_10'] + (0.3 * data['STD_10'])`,
        logs: [
          "Allocating memory for indicator matrices...",
          "Calculating EMA_30 with decay adjustment...",
          "Calculating SMA_5 and STD_5 over sliding window...",
          "Derived Lower Bollinger Band (5-period, 0.3 STD)...",
          "Calculating SMA_10 and STD_10 over sliding window...",
          "Derived Upper Bollinger Band (10-period, 0.3 STD)...",
          "✓ All indicators successfully computed and merged.",
        ],
        output: `[Indicators Preview]\nNew columns added: ['EMA_30', 'SMA_5', 'STD_5', 'Lower_BB_5', 'SMA_10', 'STD_10', 'Upper_BB_10']`,
      },
      {
        id: 3,
        title: "Cell 3: Strategy Logic",
        icon: <FileJson className="w-4 h-4" />,
        code: `def apply_strategy(df):\n    signals = []\n    for i in range(len(df)):\n        buy_cond = (df['Close'].iloc[i] < df['Open'].iloc[i] and \n                    df['Low'].iloc[i] < df['Lower_BB_5'].iloc[i] and \n                    df['Close'].iloc[i] > df['EMA_30'].iloc[i])\n                    \n        sell_cond = (df['Close'].iloc[i] > df['Open'].iloc[i] and \n                     df['High'].iloc[i] > df['Upper_BB_10'].iloc[i] and \n                     df['Close'].iloc[i] < df['EMA_30'].iloc[i])\n                     \n        if buy_cond:\n            signals.append('BUY')\n        elif sell_cond:\n            signals.append('SELL')\n        else:\n            signals.append('HOLD')\n            \n    return signals\n\ndata['Signal'] = apply_strategy(data)`,
        logs: [
          "Parsing strategy logic...",
          "Extracting AST nodes from Python definitions...",
          "Mapping variables to execution engine...",
          "Building rule engine...",
          "✓ Strategy rules localized.",
        ],
        specialStrategyOutput: {
          thinking:
            "The system parsed the breakout pullback strategy logic and extracted rules.",
          buyRules: [
            "Price closes below the open",
            "Low touches below lower BB 5",
            "Close above EMA 30",
          ],
          sellRules: [
            "Price closes above the open",
            "High breaks above upper BB 10",
            "Close below EMA 30",
          ],
          indicators: ["BB(5, 0.3)", "BB(10, 0.3)", "EMA(price, 30)"],
        },
      },
      {
        id: 4,
        title: "Cell 4: Run Backtest",
        icon: <Terminal className="w-4 h-4" />,
        code: `engine = BacktestEngine(\n    initial_capital=100000000.0, \n    commission=0.0,\n    max_holdings=10,\n    max_holding_period=120,\n    stop_loss=0.50\n)\n\nresults = engine.run(data, execute_on='OPEN')\nprint("Engine execution complete. Compiling statistics...")`,
        logs: [
          "Initializing backtest environment...",
          "Allocating thread pool for vectorized simulation...",
          "Setting starting capital to $100,000,000...",
          "Applying parameter: Stop Loss = 50%",
          "Running event-driven trade loop over 756 timesteps...",
          "✓ Executing entry/exit logic",
          "✓ Calculating risk metrics and drawdowns",
          "✓ Simulating slippage and fills",
        ],
        output: `Pipeline execution complete. Ready to synthesize results.`,
      },
      {
        id: 5,
        title: "Cell 5: Report Synthesis",
        icon: <LineChart className="w-4 h-4" />,
        code: `# Syncing quant engine parameters to visualization dashboard\nreport = engine.generate_report(include_ai_review=True)\nreport.display()`,
        logs: [
          "Aggregating portfolio metrics...",
          "Calculating Calmar, Sharpe, and Sortino ratios...",
          "Sending execution trace to AI Agent for holistic review...",
          "Awaiting LLM qualitative assessment...",
          "Rendering UI dash components...",
          "✓ Complete.",
        ],
        specialResultsOutput: {
          summary: [
            "Buy when the price closes below the open, the LOW touches below the lower Bollinger Band (5-period, 0.3 std), but CLOSE above the 30-period EMA.",
            "Sell when the price closes above the open, the high breaks above the upper Bollinger Band (10-period, 0.3 std), but closes below the 30-period EMA.",
            "The backtesting period is from 2023-03-13 to 2026-03-12, using a 1-day timeframe.",
            "Buy at the open price, with a maximum holding period of 120 days, max 10 holdings, initial fund $100,000,000.",
            "The stop-loss threshold is 50%, and the commission is 0.",
            "Asset pool: NIFTY 50.",
          ],
          metrics: [
            {
              label: "Annualized return",
              value: "+24.77%",
              color: "text-emerald-400",
            },
            { label: "Win rate", value: "51.15%", color: "text-white" },
            { label: "Sharpe ratio", value: "1.717", color: "text-white" },
            { label: "Max drawdown", value: "-17.96%", color: "text-red-400" },
            { label: "Risk-reward ratio", value: "2.461", color: "text-white" },
            { label: "Avg return", value: "+5.92%", color: "text-emerald-400" },
          ],
          aiReview: {
            returns:
              "The strategy achieves an annualized return of 24.77%, which is strong and competitive. The profit/loss ratio of 2.46 further supports profit stability.",
            risk: "The maximum drawdown of -17.96% is well-controlled. The Sharpe ratio of 1.72 indicates a favorable risk-adjusted return.",
            stability:
              "With a win rate of 51.15% and an average return per trade of 5.92%, the strategy demonstrates consistent performance. The average holding period aligns with the mid-term nature.",
            conclusion:
              "The strategy has achieved a high level of sophistication, meeting profitability and risk benchmarks.",
            rawInput:
              "Create a strategy that buys on price dip below lower BB while respecting the EMA 30 uptrend...",
          },
        },
      },
    ],
  },
  {
    id: "ex2",
    name: "RSI Mean Reversion on RELIANCE.NS",
    cells: [
      {
        id: 1,
        title: "Cell 1: Load Data",
        icon: <Code2 className="w-4 h-4" />,
        code: `import pandas as pd\nimport yfinance as yf\n\n# Load RELIANCE.NS Historical Data\nprint("Connecting to YAHOO Finance API...")\ndata = yf.download("RELIANCE.NS", start="2020-01-01", end="2026-01-01", interval="1d")\nprint(f"Loaded {len(data)} rows.")\ndata.head()`,
        logs: [
          "Initializing environment variables...",
          "Connecting to YAHOO Finance API...",
          "Downloading RELIANCE.NS ticker data [2020-01-01 to 2026-01-01]",
          "✓ Loaded 1510 rows.",
          "Data payload successful.",
        ],
        output: `[RELIANCE.NS Data Preview]\nDate       Open     High     Low      Close\n2020-01-02  1512.06  1525.15  1498.80  1519.09\n2020-01-03  1508.29  1521.14  1496.13  1504.36\n...`,
      },
      {
        id: 2,
        title: "Cell 2: Indicators",
        icon: <LineChart className="w-4 h-4" />,
        code: `import pandas_ta as ta\n\n# Calculate RSI (14 period)\ndata['RSI_14'] = ta.rsi(data['Close'], length=14)\n\n# Calculate 200-period SMA\ndata['SMA_200'] = ta.sma(data['Close'], length=200)`,
        logs: [
          "Loading pandas_ta extension...",
          "Calculating RSI baseline using Wilder's Smoothing...",
          "Calculating Simple Moving Average (200-period)...",
          "✓ RSI and SMA indicators successfully computed.",
        ],
        output: `[Indicators Preview]\nNew columns added: ['RSI_14', 'SMA_200']`,
      },
      {
        id: 3,
        title: "Cell 3: Strategy Logic",
        icon: <FileJson className="w-4 h-4" />,
        code: `def mean_reversion_strategy(df):\n    signals = []\n    for i in range(len(df)):\n        buy_cond = df['RSI_14'].iloc[i] < 30 and df['Close'].iloc[i] > df['SMA_200'].iloc[i]\n        sell_cond = df['RSI_14'].iloc[i] > 70\n                     \n        if buy_cond:\n            signals.append('BUY')\n        elif sell_cond:\n            signals.append('SELL')\n        else:\n            signals.append('HOLD')\n            \n    return signals\n\ndata['Signal'] = mean_reversion_strategy(data)`,
        logs: [
          "Parsing strategy logic...",
          "Mapping conditions to RSI crossover triggers...",
          "Applying trend constraint (Price > SMA 200) filters...",
          "✓ Mean Reversion logic compiled and applied.",
        ],
        specialStrategyOutput: {
          thinking:
            "The system parsed the RSI mean reversion strategy with a trend filter constraint.",
          buyRules: [
            "RSI < 30 (Oversold condition)",
            "Price > SMA 200 (Long-term uptrend)",
          ],
          sellRules: ["RSI > 70 (Overbought condition)"],
          indicators: ["RSI(14)", "SMA(200)"],
        },
      },
      {
        id: 4,
        title: "Cell 4: Run Backtest",
        icon: <Terminal className="w-4 h-4" />,
        code: `engine = BacktestEngine(\n    initial_capital=50000.0, \n    commission=0.001,\n    max_holdings=1,\n    max_holding_period=30,\n    stop_loss=0.05\n)\n\nresults = engine.run(data, execute_on='CLOSE')\nprint("Engine execution complete. Compiling statistics...")`,
        logs: [
          "Initializing backtest environment...",
          "Setting starting capital to $50,000...",
          "Applying constraints: Max Holds=1, Stop Loss = 5%",
          "Running event-driven trade loop over 1510 timesteps...",
          "✓ Simulated fills and commissions",
          "✓ Finished risk analytics",
        ],
        output: `Pipeline execution complete. Ready to synthesize results.`,
      },
      {
        id: 5,
        title: "Cell 5: Report Synthesis",
        icon: <LineChart className="w-4 h-4" />,
        code: `report = engine.generate_report(include_ai_review=True)\nreport.display()`,
        logs: [
          "Aggregating portfolio metrics...",
          "Sending summary to AI Agent...",
          "Evaluating execution trace against benchmark...",
          "Formatting dashboard view...",
          "✓ Complete.",
        ],
        specialResultsOutput: {
          summary: [
            "Buy on oversold conditions (RSI under 30) while price remains above the 200-day Simple Moving Average.",
            "Sell when momentum gets overextended (RSI above 70).",
            "Backtest timeframe covers Jan 2020 through Jan 2026.",
            "Execute at the CLOSE price. Max holding period is capped at 30 days.",
            "Risk constraints: 5% stop loss applied per trade, considering 0.1% commission.",
            "Asset tested: RELIANCE.NS.",
          ],
          metrics: [
            {
              label: "Annualized return",
              value: "+17.32%",
              color: "text-emerald-400",
            },
            { label: "Win rate", value: "68.40%", color: "text-white" },
            { label: "Sharpe ratio", value: "1.45", color: "text-white" },
            { label: "Max drawdown", value: "-12.80%", color: "text-red-400" },
            { label: "Risk-reward ratio", value: "1.65", color: "text-white" },
            { label: "Avg return", value: "+3.10%", color: "text-emerald-400" },
          ],
          aiReview: {
            returns:
              "This mean-reversion strategy on RELIANCE.NS yielded a robust 17.32% annualized return. Trading pullbacks in long-term uptrends captures short-term rallies.",
            risk: "The tight 5% stop loss keeps downside heavily contained. At just -12.80% maximum drawdown, the equity curve is unusually smooth.",
            stability:
              "The extremely high win rate (68.4%) is expected for RSI reversion strategies that wait for genuine oversold bottoms.",
            conclusion:
              "A highly defensive strategy that protects capital while exploiting temporary dips in market leaders.",
            rawInput:
              "Test an RSI mean reversion on Apple stock, using a 200 SMA as trend filter.",
          },
        },
      },
    ],
  },
  {
    id: "ex3",
    name: "MACD Trend Following on TCS.NS",
    cells: [
      {
        id: 1,
        title: "Cell 1: Load Data",
        icon: <Code2 className="w-4 h-4" />,
        code: `import pandas as pd\nimport yfinance as yf\n\n# Load TCS.NS Historical Data\nprint("Connecting to YAHOO Finance API...")\ndata = yf.download("TCS.NS", start="2021-06-01", end="2026-06-01", interval="1d")\nprint(f"Loaded {len(data)} rows.")\ndata.head()`,
        logs: [
          "Initializing environment variables...",
          "Connecting to YAHOO Finance API...",
          "Downloading TCS.NS ticker data [2021-06-01 to 2026-06-01]",
          "✓ Loaded 1258 rows.",
          "Data payload successful.",
        ],
        output: `[TCS.NS Data Preview]\nDate       Open     High     Low      Close\n2021-06-01 3129.11  3171.33  3106.22  3158.00\n2021-06-02 3168.77  3202.55  3122.10  3181.88\n...`,
      },
      {
        id: 2,
        title: "Cell 2: Indicators",
        icon: <LineChart className="w-4 h-4" />,
        code: `import pandas_ta as ta\n\n# Calculate MACD\nmacd_df = ta.macd(data['Close'], fast=12, slow=26, signal=9)\ndata = pd.concat([data, macd_df], axis=1)\n\n# Rename for easier access\ndata.rename(columns={'MACD_12_26_9': 'MACD', 'MACDh_12_26_9': 'MACD_Histogram', 'MACDs_12_26_9': 'Signal_Line'}, inplace=True)`,
        logs: [
          "Loading pandas_ta extension...",
          "Computing Exponential Moving Averages 12 and 26...",
          "Deriving MACD difference line and Signal line...",
          "Appending frames and aliasing identifiers...",
          "✓ MACD computed.",
        ],
        output: `[Indicators Preview]\nNew columns added: ['MACD', 'MACD_Histogram', 'Signal_Line']`,
      },
      {
        id: 3,
        title: "Cell 3: Strategy Logic",
        icon: <FileJson className="w-4 h-4" />,
        code: `def macd_trend_strategy(df):\n    signals = []\n    for i in range(1, len(df)):\n        buy_cond = (df['MACD'].iloc[i] > df['Signal_Line'].iloc[i]) and (df['MACD'].iloc[i-1] <= df['Signal_Line'].iloc[i-1])\n        sell_cond = (df['MACD'].iloc[i] < df['Signal_Line'].iloc[i]) and (df['MACD'].iloc[i-1] >= df['Signal_Line'].iloc[i-1])\n                     \n        if buy_cond:\n            signals.append('BUY')\n        elif sell_cond:\n            signals.append('SELL')\n        else:\n            signals.append('HOLD')\n            \n    signals.insert(0, 'HOLD')\n    return signals\n\ndata['Signal'] = macd_trend_strategy(data)`,
        logs: [
          "Parsing strategy logic...",
          "Evaluating MACD crossover triggers iteratively...",
          "Applying conditional loops and tracking state...",
          "✓ MACD Trend Strategy mapped to signal vector.",
        ],
        specialStrategyOutput: {
          thinking: "The system parsed the MACD momentum crossover logic.",
          buyRules: ["MACD line crosses above the Signal line"],
          sellRules: ["MACD line crosses below the Signal line"],
          indicators: ["MACD(12, 26, 9)"],
        },
      },
      {
        id: 4,
        title: "Cell 4: Run Backtest",
        icon: <Terminal className="w-4 h-4" />,
        code: `engine = BacktestEngine(\n    initial_capital=100000.0, \n    commission=0.002,\n    max_holdings=5,\n    max_holding_period=60,\n    stop_loss=0.10\n)\n\nresults = engine.run(data, execute_on='OPEN')\nprint("Engine execution complete. Compiling statistics...")`,
        logs: [
          "Initializing backtest environment...",
          "Allocating thread pool for sequential TCS.NS tracking...",
          "Applying portfolio variables: Max Holds=5, Capital=$100,000",
          "Applying parameter: Stop Loss = 10%",
          "Running event-driven simulation...",
          "✓ Fills, exits, and drawdown matrices created.",
        ],
        output: `Pipeline execution complete. Ready to synthesize results.`,
      },
      {
        id: 5,
        title: "Cell 5: Report Synthesis",
        icon: <LineChart className="w-4 h-4" />,
        code: `report = engine.generate_report(include_ai_review=True)\nreport.display()`,
        logs: [
          "Computing cumulative PnL, Sortino, Calmar...",
          "Submitting log data for AI narrative summarization...",
          "Receiving completion tokens from agent...",
          "✓ Dashboard compiled.",
        ],
        specialResultsOutput: {
          summary: [
            "Buy signal executed upon upward crossover of MACD against Signal line (momentum turning bullish).",
            "Sell signal executed upon downward crossover of MACD against Signal line (momentum turning bearish).",
            "Tested against strongly trending asset TCS.NS from 2021 to 2026.",
            "Stop loss 10% applied, holding period up to 60 days.",
            "Initial allocation $100,000 with 0.2% commission.",
          ],
          metrics: [
            {
              label: "Annualized return",
              value: "+38.12%",
              color: "text-emerald-400",
            },
            { label: "Win rate", value: "41.60%", color: "text-white" },
            { label: "Sharpe ratio", value: "1.92", color: "text-white" },
            { label: "Max drawdown", value: "-25.40%", color: "text-red-400" },
            { label: "Risk-reward ratio", value: "3.10", color: "text-white" },
            {
              label: "Avg return",
              value: "+12.40%",
              color: "text-emerald-400",
            },
          ],
          aiReview: {
            returns:
              "High performance. The ~38% annualized return reflects the benefit of trend following on highly volatile assets where trends run long.",
            risk: "The 25.4% max drawdown is acceptable given the raw beta of the asset, though investors must tolerate rougher swings.",
            stability:
              "As typical for trend following, the win rate is lower (41.6%), but the average winning trade vastly outpaces average losers (3.10 ratio!).",
            conclusion:
              "A strong, classic momentum setup adapted appropriately for high-beta tech stocks.",
            rawInput:
              "Generate a purely momentum-based TCS.NS strategy using MACD line crossovers.",
          },
        },
      },
    ],
  },
];

const MOCK_EQUITY_DATA = Array.from({ length: 40 }).map((_, i) => ({
  date: new Date(2023, 2 + i, 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  }),
  strategy: 10 + i * 1.5 + Math.random() * 5 - 2.5,
  sp500: 10 + i * 0.8 + Math.random() * 3 - 1.5,
}));

const MOCK_MONTHLY_RETURNS = Array.from({ length: 24 }).map((_, i) => ({
  date: new Date(2024, i, 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  }),
  value: Math.random() * 12 - 4.5,
}));

const MOCK_DISTRIBUTION = [
  { range: "<= -10.43%", count: 7 },
  { range: "-5.42%~-2.91%", count: 13 },
  { range: "2.11%~4.62%", count: 11 },
  { range: "9.64%~12.15%", count: 9 },
  { range: "17.16%~19.67%", count: 7 },
  { range: "24.69%~27.20%", count: 2 },
  { range: "32.22%~34.73%", count: 2 },
  { range: "> 34.73%", count: 7 },
];

const MOCK_DRAWDOWN = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(2023, 2 + i, 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  }),
  value: -(Math.random() * 9 + 1),
}));

const MOCK_TRADES = [
  {
    symbol: "INFY.NS",
    trades: 6,
    winRate: "50.00%",
    avgReturn: "+7.52%",
    bestReturn: "+36.04%",
    worstLoss: "-9.78%",
  },
  {
    symbol: "TCS.NS",
    trades: 6,
    winRate: "66.67%",
    avgReturn: "+18.73%",
    bestReturn: "+77.85%",
    worstLoss: "-10.12%",
  },
  {
    symbol: "RELIANCE.NS",
    trades: 5,
    winRate: "40.00%",
    avgReturn: "+4.51%",
    bestReturn: "+31.44%",
    worstLoss: "-8.37%",
  },
  {
    symbol: "GOOG",
    trades: 5,
    winRate: "20.00%",
    avgReturn: "-1.83%",
    bestReturn: "+12.65%",
    worstLoss: "-11.43%",
  },
  {
    symbol: "ABBV",
    trades: 4,
    winRate: "25.00%",
    avgReturn: "-4.74%",
    bestReturn: "+1.60%",
    worstLoss: "-10.56%",
  },
  {
    symbol: "AMZN",
    trades: 4,
    winRate: "50.00%",
    avgReturn: "+4.93%",
    bestReturn: "+24.50%",
    worstLoss: "-13.25%",
  },
  {
    symbol: "JNJ",
    trades: 4,
    winRate: "50.00%",
    avgReturn: "+0.36%",
    bestReturn: "+3.72%",
    worstLoss: "-2.86%",
  },
  {
    symbol: "META",
    trades: 4,
    winRate: "25.00%",
    avgReturn: "+2.51%",
    bestReturn: "+27.87%",
    worstLoss: "-10.11%",
  },
  {
    symbol: "MU",
    trades: 4,
    winRate: "75.00%",
    avgReturn: "+35.54%",
    bestReturn: "+87.22%",
    worstLoss: "-3.89%",
  },
  {
    symbol: "NFLX",
    trades: 4,
    winRate: "75.00%",
    avgReturn: "+7.20%",
    bestReturn: "+27.89%",
    worstLoss: "-3.18%",
  },
];

export default function StrategyNotebookSandbox() {
  const [selectedExampleId, setSelectedExampleId] = useState(EXAMPLES[0].id);
  const selectedExample =
    EXAMPLES.find((e) => e.id === selectedExampleId) || EXAMPLES[0];

  // Cells state updates based on selected example
  const [cells, setCells] = useState(selectedExample.cells);

  const [runningCell, setRunningCell] = useState<number | null>(null);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [cellOutputs, setCellOutputs] = useState<Record<number, boolean>>({});

  // Reset and load another example
  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEx = EXAMPLES.find((ex) => ex.id === e.target.value);
    if (newEx) {
      setSelectedExampleId(newEx.id);
      setCells(newEx.cells);
      setRunningCell(null);
      setProgressSteps([]);
      setCellOutputs({});
    }
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleCodeChange = (id: number, newCode: string) => {
    setCells(
      cells.map((cell) => (cell.id === id ? { ...cell, code: newCode } : cell)),
    );
  };

  const runCell = async (cellId: number) => {
    if (runningCell !== null) return; // Prevent concurrent runs

    setRunningCell(cellId);
    setProgressSteps([]);

    // Clear previous output for this cell
    setCellOutputs((prev) => ({ ...prev, [cellId]: false }));

    const cell = cells.find((c) => c.id === cellId);
    if (!cell) return;

    for (let i = 0; i < cell.logs.length; i++) {
      await sleep(1000 + Math.random() * 800);
      setProgressSteps((prev) => [...prev, cell.logs[i]]);
    }

    await sleep(800); // Final pause before revealing output
    setCellOutputs((prev) => ({ ...prev, [cellId]: true }));
    setRunningCell(null);
  };

  const StrategyOutputCard = ({ data }: { data: any }) => (
    <div className="mt-4 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 font-mono text-sm shadow-sm transition-all duration-500">
      <div className="flex items-center gap-2 mb-3 text-cyan-400 font-semibold border-b border-gray-800 pb-2">
        <CheckCircle2 className="w-4 h-4" />
        Generating strategy
      </div>

      <div className="text-gray-400 mb-4">
        Thinking Process:
        <br />
        <span className="text-gray-500">{data.thinking}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-950/20 border border-green-900/30 rounded p-3">
          <div className="text-green-400 font-bold mb-2">Buy when:</div>
          <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
            {data.buyRules.map((rule: string, idx: number) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>

        <div className="bg-red-950/20 border border-red-900/30 rounded p-3">
          <div className="text-red-400 font-bold mb-2">Sell when:</div>
          <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
            {data.sellRules.map((rule: string, idx: number) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 bg-blue-950/10 border border-blue-900/30 rounded p-3">
        <div className="text-blue-400 font-bold mb-2">Indicators used:</div>
        <div className="flex flex-wrap gap-2">
          {data.indicators.map((ind: string, idx: number) => (
            <span
              key={idx}
              className="bg-blue-900/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-800/40"
            >
              {ind}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const ResultsOutputCard = ({ data }: { data: any }) => {
    const [activeTab, setActiveTab] = useState("overview");
    return (
      <div className="mt-4 transition-all duration-500 font-sans">
        <h3 className="text-xl font-bold text-white mb-6">
          Backtest completed! Please check the following report:
        </h3>

        {/* Run Summary Block */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 mb-6 shadow-md">
          <h4 className="text-lg font-semibold text-white mb-4">Run summary</h4>
          <p className="text-gray-400 mb-4">
            Backtested with the following conditions:
          </p>
          <div className="space-y-3">
            {data.summary.map((text: string, idx: number) => (
              <div
                key={idx}
                className="border border-gray-700/60 rounded-full px-5 py-3 text-sm text-gray-300 bg-[#161616] inline-block mb-3 mr-3"
              >
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {data.metrics.map((m: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#111111] p-5 rounded-xl border border-gray-800 shadow-md"
            >
              <p className="text-gray-500 text-sm mb-1">{m.label}</p>
              <p className={`${m.color} text-3xl font-bold`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* AI Review Block */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 text-gray-300 shadow-md">
          <h4 className="text-lg font-bold text-white mb-4">AI Review</h4>
          <ul className="space-y-3 mb-4 text-sm leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-white">Returns:</strong>{" "}
              {data.aiReview.returns}
            </li>
            <li>
              <strong className="text-white">Risk:</strong> {data.aiReview.risk}
            </li>
            <li>
              <strong className="text-white">Stability:</strong>{" "}
              {data.aiReview.stability}
            </li>
          </ul>
          <p className="text-sm mt-4 text-gray-400">
            {data.aiReview.conclusion}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
            Optimal version's Backtest Raw Input: {data.aiReview.rawInput}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-2 mb-6 bg-[#1a1a1a] w-fit p-1 rounded-full border border-gray-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === "overview" ? "bg-[#333] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("trades")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === "trades" ? "bg-[#333] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
            >
              Trades
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8 bg-[#111] p-6 rounded-xl border border-gray-800">
              <div>
                <div className="flex items-center gap-6 mb-4">
                  <h4 className="text-white font-bold">
                    Equity curve (Strategy vs. NIFTY 50)
                  </h4>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-2 bg-[#2dd4bf] rounded-full"></span>
                      Strategy 61.07%
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-2 bg-[#3b82f6] rounded-full border border-dashed border-blue-400"></span>
                      NIFTY 50 48.51%
                    </div>
                  </div>
                </div>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={MOCK_EQUITY_DATA}>
                      <defs>
                        <linearGradient
                          id="colorStrategy"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2dd4bf"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2dd4bf"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#222"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#555"
                        tick={{ fill: "#777" }}
                        dy={10}
                      />
                      <YAxis
                        stroke="#555"
                        tick={{ fill: "#777" }}
                        tickFormatter={(val) => `${val}%`}
                        dx={-10}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#111",
                          borderColor: "#333",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="strategy"
                        stroke="#2dd4bf"
                        fillOpacity={1}
                        fill="url(#colorStrategy)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="sp500"
                        stroke="#3b82f6"
                        dot={false}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">
                  Monthly returns heatmap
                </h4>
                <div className="h-48 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_MONTHLY_RETURNS}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#222"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#555"
                        tick={{ fill: "#777" }}
                        dy={10}
                      />
                      <YAxis
                        stroke="#555"
                        tick={{ fill: "#777" }}
                        tickFormatter={(val) => `${val}%`}
                        dx={-10}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#222" }}
                        contentStyle={{
                          backgroundColor: "#111",
                          borderColor: "#333",
                        }}
                      />
                      <Bar dataKey="value">
                        {MOCK_MONTHLY_RETURNS.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.value > 0 ? "#2dd4bf" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">
                  Return distribution
                </h4>
                <div className="h-48 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_DISTRIBUTION}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#222"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="range"
                        stroke="#555"
                        tick={{ fill: "#777" }}
                        dy={10}
                      />
                      <YAxis stroke="#555" tick={{ fill: "#777" }} dx={-10} />
                      <RechartsTooltip
                        cursor={{ fill: "#222" }}
                        contentStyle={{
                          backgroundColor: "#111",
                          borderColor: "#333",
                        }}
                      />
                      <Bar dataKey="count" fill="#2dd4bf" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">Drawdown</h4>
                <div className="h-48 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_DRAWDOWN}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#222"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#555"
                        tick={{ fill: "#777" }}
                        dy={10}
                      />
                      <YAxis
                        stroke="#555"
                        tick={{ fill: "#777" }}
                        tickFormatter={(val) => `${val}%`}
                        dx={-10}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#222" }}
                        contentStyle={{
                          backgroundColor: "#111",
                          borderColor: "#333",
                        }}
                      />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-4 border-t border-gray-800 pt-4">
                Disclaimer: Results are hypothetical and for research only; not
                investment advice.
              </div>
            </div>
          )}

          {activeTab === "trades" && (
            <div className="bg-[#111] p-6 rounded-xl border border-gray-800 overflow-hidden">
              <div className="mb-6 flex items-center justify-between border-b border-gray-800 pb-4">
                <input
                  type="text"
                  placeholder="Search by symbol"
                  className="bg-[#1a1a1a] border border-gray-700 text-sm px-4 py-2 rounded-md focus:outline-none focus:border-indigo-500 text-gray-300 w-64"
                />
                <div className="text-sm text-gray-500">71 tickers total</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="pb-3 px-2 font-medium">Symbol</th>
                      <th className="pb-3 px-2 font-medium">
                        Trades <span className="opacity-50 text-[10px]">▼</span>
                      </th>
                      <th className="pb-3 px-2 font-medium">
                        Win rate{" "}
                        <span className="opacity-50 text-[10px]">▼</span>
                      </th>
                      <th className="pb-3 px-2 font-medium">
                        Average return{" "}
                        <span className="opacity-50 text-[10px]">▼</span>
                      </th>
                      <th className="pb-3 px-2 font-medium">
                        Best trade return{" "}
                        <span className="opacity-50 text-[10px]">▼</span>
                      </th>
                      <th className="pb-3 px-2 font-medium">
                        Worst trade loss{" "}
                        <span className="opacity-50 text-[10px]">▼</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TRADES.map((t, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-2 font-medium text-[#2dd4bf]">
                          {t.symbol}
                        </td>
                        <td className="py-4 px-2 text-gray-300">{t.trades}</td>
                        <td className="py-4 px-2 text-gray-300">{t.winRate}</td>
                        <td
                          className={`py-4 px-2 ${t.avgReturn.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {t.avgReturn}
                        </td>
                        <td
                          className={`py-4 px-2 ${t.bestReturn.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {t.bestReturn}
                        </td>
                        <td
                          className={`py-4 px-2 ${t.worstLoss.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {t.worstLoss}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-200 p-2 md:p-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Strategy Notebook Sandbox
          </h1>
          <p className="text-gray-400 text-sm mb-4">
            Interactive quant research environment with step-by-step pipeline
            execution.
          </p>

          <div className="flex items-center gap-4 bg-[#111] p-3 rounded-lg border border-gray-800">
            <label className="text-sm font-medium text-gray-400">
              Load Example Strategy:
            </label>
            <select
              value={selectedExampleId}
              onChange={handleExampleChange}
              className="bg-[#1a1a1a] border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="space-y-6">
          {cells.map((cell) => (
            <div
              key={cell.id}
              className="bg-[#151515] border border-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-gray-700"
            >
              {/* Cell Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-gray-800">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <span className="text-gray-500 mr-1">[{cell.id}]</span>
                  {cell.icon}
                  {cell.title}
                </div>
                <button
                  onClick={() => runCell(cell.id)}
                  disabled={runningCell !== null && runningCell !== cell.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    runningCell === cell.id
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : runningCell !== null
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                        : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 cursor-pointer"
                  }`}
                >
                  {runningCell === cell.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Cell
                    </>
                  )}
                </button>
              </div>

              {/* Cell Editor */}
              <div className="p-4 bg-[#0a0a0a]">
                <textarea
                  value={cell.code}
                  onChange={(e) => handleCodeChange(cell.id, e.target.value)}
                  className="w-full h-auto min-h-30 bg-transparent text-gray-300 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded resize-y"
                  style={{
                    lineHeight: "1.5",
                    tabSize: 4,
                  }}
                  rows={Math.max(cell.code.split("\n").length, 3)}
                  spellCheck="false"
                />
              </div>

              {/* Running Progress Flow */}
              <AnimatePresence>
                {runningCell === cell.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-800 bg-[#111] overflow-hidden"
                  >
                    <div className="p-4 font-mono text-sm">
                      <div className="text-gray-500 mb-2 flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Runtime Console Output
                      </div>
                      <div className="space-y-1 pl-8 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-800 -translate-x-1/2" />
                        {progressSteps.map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`relative z-10 flex items-center gap-3 py-1 ${step.startsWith("✓") ? "text-emerald-400" : "text-gray-300"}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current absolute -left-4 -translate-x-1/2" />
                            {step}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cell Output */}
              {cellOutputs[cell.id] && (
                <div className="border-t border-gray-800 bg-[#0f0f0f] p-4 text-sm font-mono overflow-x-auto">
                  {cell.specialStrategyOutput ? (
                    <StrategyOutputCard data={cell.specialStrategyOutput} />
                  ) : cell.specialResultsOutput ? (
                    <ResultsOutputCard data={cell.specialResultsOutput} />
                  ) : (
                    <div className="text-indigo-300 whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-500">
                      {cell.output}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
