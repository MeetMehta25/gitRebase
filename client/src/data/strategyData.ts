// ─── Strategy Data Module ────────────────────────────────────────────────────
// Central data for 4 hardcoded strategies, 8 workflows, node configs, fallbacks
// Strategy IDs 1-4 are constant across the entire application.

import {
  Activity,
  Target,
  Shield,
  BarChart3,
  LineChart,
  Database,
  Settings2,
  Cpu,
  TrendingUp,
  ArrowDownUp,
  Gauge,
  Layers,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface StrategyQuestion {
  id: number;
  prompt: string;
  ticker: string;
  goal: string;
  risk_level: string;
  short_name: string;
}

export interface NodePropertyConfig {
  key: string;
  label: string;
  type: "slider" | "dropdown" | "toggle";
  min?: number;
  max?: number;
  step?: number;
  default: number | string | boolean;
  options?: string[];
  suffix?: string;
}

export interface WorkflowNodeDef {
  id: string;
  type: string;
  label: string;
  nodeType: "trigger" | "condition" | "action";
  icon: any;
  properties: NodePropertyConfig[];
  position: { x: number; y: number };
}

export interface WorkflowDef {
  strategyId: number;
  workflowType: "initial" | "adversarial";
  name: string;
  nodes: WorkflowNodeDef[];
}

// ─── 4 Hardcoded Strategy Questions ──────────────────────────────────────────
export const STRATEGY_QUESTIONS: StrategyQuestion[] = [
  {
    id: 1,
    prompt:
      "Create a mean reversion strategy for RELIANCE.NS using RSI and support/resistance levels",
    ticker: "RELIANCE.NS",
    goal: "mean reversion",
    risk_level: "moderate",
    short_name: "RELIANCE Mean Reversion",
  },
  {
    id: 2,
    prompt:
      "Design a swing trading strategy for INFY.NS that combines MACD with volume analysis",
    ticker: "INFY.NS",
    goal: "swing trading",
    risk_level: "moderate",
    short_name: "INFY Swing Strategy",
  },
  {
    id: 3,
    prompt:
      "Build a scalping strategy for TCS.NS using fast moving averages and tight stops",
    ticker: "TCS.NS",
    goal: "scalping",
    risk_level: "aggressive",
    short_name: "TCS Scalping",
  },
  {
    id: 4,
    prompt:
      "Generate a risk-managed trading system for HDFCBANK.NS with proper position sizing and drawdown limits",
    ticker: "HDFCBANK.NS",
    goal: "risk-managed trend following",
    risk_level: "conservative",
    short_name: "HDFCBANK Risk-Managed",
  },
];

// ─── Interactive Node Property Configs ───────────────────────────────────────
const RSI_PROPS: NodePropertyConfig[] = [
  {
    key: "rsi_period",
    label: "RSI Period",
    type: "slider",
    min: 5,
    max: 30,
    step: 1,
    default: 14,
  },
  {
    key: "overbought",
    label: "Overbought Level",
    type: "slider",
    min: 60,
    max: 90,
    step: 1,
    default: 70,
    suffix: "",
  },
  {
    key: "oversold",
    label: "Oversold Level",
    type: "slider",
    min: 10,
    max: 40,
    step: 1,
    default: 30,
    suffix: "",
  },
];

const MACD_PROPS: NodePropertyConfig[] = [
  {
    key: "fast_length",
    label: "Fast Length",
    type: "slider",
    min: 5,
    max: 20,
    step: 1,
    default: 12,
  },
  {
    key: "slow_length",
    label: "Slow Length",
    type: "slider",
    min: 15,
    max: 40,
    step: 1,
    default: 26,
  },
  {
    key: "signal_length",
    label: "Signal Length",
    type: "slider",
    min: 5,
    max: 15,
    step: 1,
    default: 9,
  },
];

const MA_PROPS: NodePropertyConfig[] = [
  {
    key: "ma_type",
    label: "MA Type",
    type: "dropdown",
    default: "EMA",
    options: ["SMA", "EMA", "WMA", "DEMA", "TEMA"],
  },
  {
    key: "fast_period",
    label: "Fast Period",
    type: "slider",
    min: 5,
    max: 50,
    step: 1,
    default: 20,
  },
  {
    key: "slow_period",
    label: "Slow Period",
    type: "slider",
    min: 20,
    max: 200,
    step: 5,
    default: 50,
  },
];

const RISK_PROPS: NodePropertyConfig[] = [
  {
    key: "stop_loss_pct",
    label: "Stop Loss %",
    type: "slider",
    min: 0.5,
    max: 10,
    step: 0.5,
    default: 2,
    suffix: "%",
  },
  {
    key: "take_profit_pct",
    label: "Take Profit %",
    type: "slider",
    min: 1,
    max: 25,
    step: 0.5,
    default: 5,
    suffix: "%",
  },
  {
    key: "trailing_stop",
    label: "Trailing Stop",
    type: "toggle",
    default: false,
  },
  {
    key: "max_drawdown_pct",
    label: "Max Drawdown Limit",
    type: "slider",
    min: 5,
    max: 30,
    step: 1,
    default: 15,
    suffix: "%",
  },
];

const POSITION_SIZING_PROPS: NodePropertyConfig[] = [
  {
    key: "risk_per_trade",
    label: "Risk Per Trade %",
    type: "slider",
    min: 0.5,
    max: 5,
    step: 0.25,
    default: 2,
    suffix: "%",
  },
  {
    key: "max_exposure",
    label: "Max Portfolio Exposure",
    type: "slider",
    min: 10,
    max: 100,
    step: 5,
    default: 20,
    suffix: "%",
  },
  {
    key: "sizing_method",
    label: "Sizing Method",
    type: "dropdown",
    default: "Fixed %",
    options: ["Fixed %", "Kelly", "Volatility-Adjusted", "Equal Weight"],
  },
];

const VOLUME_PROPS: NodePropertyConfig[] = [
  {
    key: "volume_spike_mult",
    label: "Volume Spike Multiplier",
    type: "slider",
    min: 1.2,
    max: 4,
    step: 0.1,
    default: 2,
  },
  {
    key: "volume_ma_period",
    label: "Volume MA Period",
    type: "slider",
    min: 5,
    max: 50,
    step: 1,
    default: 20,
  },
  {
    key: "min_volume",
    label: "Min Volume Filter",
    type: "toggle",
    default: true,
  },
];

const SUPPORT_RESISTANCE_PROPS: NodePropertyConfig[] = [
  {
    key: "lookback_window",
    label: "Lookback Window",
    type: "slider",
    min: 10,
    max: 100,
    step: 5,
    default: 50,
  },
  {
    key: "breakout_threshold",
    label: "Breakout Threshold %",
    type: "slider",
    min: 0.1,
    max: 3,
    step: 0.1,
    default: 0.5,
    suffix: "%",
  },
  {
    key: "pivot_type",
    label: "Pivot Type",
    type: "dropdown",
    default: "Standard",
    options: ["Standard", "Fibonacci", "Camarilla", "Woodie"],
  },
];

const BOLLINGER_PROPS: NodePropertyConfig[] = [
  {
    key: "bb_period",
    label: "BB Period",
    type: "slider",
    min: 10,
    max: 50,
    step: 1,
    default: 20,
  },
  {
    key: "bb_std_dev",
    label: "Std Deviation",
    type: "slider",
    min: 1,
    max: 3,
    step: 0.25,
    default: 2,
  },
  {
    key: "squeeze_detection",
    label: "Detect Squeeze",
    type: "toggle",
    default: true,
  },
];

const ATR_PROPS: NodePropertyConfig[] = [
  {
    key: "atr_period",
    label: "ATR Period",
    type: "slider",
    min: 7,
    max: 21,
    step: 1,
    default: 14,
  },
  {
    key: "atr_multiplier",
    label: "ATR Multiplier",
    type: "slider",
    min: 1,
    max: 4,
    step: 0.25,
    default: 1.5,
  },
];

const EXECUTION_PROPS: NodePropertyConfig[] = [
  {
    key: "order_type",
    label: "Order Type",
    type: "dropdown",
    default: "Market",
    options: ["Market", "Limit", "Stop-Limit", "TWAP"],
  },
  {
    key: "slippage_pct",
    label: "Slippage %",
    type: "slider",
    min: 0,
    max: 0.5,
    step: 0.01,
    default: 0.05,
    suffix: "%",
  },
  {
    key: "commission_pct",
    label: "Commission %",
    type: "slider",
    min: 0,
    max: 0.5,
    step: 0.01,
    default: 0.1,
    suffix: "%",
  },
];

const BACKTEST_PROPS: NodePropertyConfig[] = [
  {
    key: "initial_capital",
    label: "Initial Capital",
    type: "slider",
    min: 10000,
    max: 1000000,
    step: 10000,
    default: 100000,
    suffix: "$",
  },
  {
    key: "start_year",
    label: "Start Year",
    type: "slider",
    min: 2015,
    max: 2024,
    step: 1,
    default: 2020,
  },
  {
    key: "benchmark",
    label: "Benchmark",
    type: "dropdown",
    default: "^NSEI",
    options: ["^NSEI", "^NSEBANK", "^CNXIT", "None"],
  },
];

// ─── 8 Workflows (4 strategies × 2 each) ────────────────────────────────────

function makeBaseNodes(
  strategyId: number,
  workflowType: "initial" | "adversarial",
): WorkflowNodeDef[] {
  const q = STRATEGY_QUESTIONS.find((s) => s.id === strategyId)!;
  const isModified = workflowType === "adversarial";
  const suffix = isModified ? " (Modified)" : "";
  const pfx = `${strategyId}-${workflowType}`;

  let indicators: WorkflowNodeDef[] = [];
  let includeExec = true;

  // ── Strategy 1: RELIANCE Mean Reversion ─────────────────────────────────
  if (strategyId === 1) {
    if (isModified) {
      // Council: Replace BB with VIX filter + Earnings blackout (4 indicators vs 3)
      indicators = [
        {
          id: `${pfx}-rsi`,
          type: "strategyNode",
          label: "RSI (Tuned)",
          nodeType: "condition",
          icon: Gauge,
          properties: RSI_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "rsi_period"
                ? 10
                : p.key === "overbought"
                  ? 75
                  : p.key === "oversold"
                    ? 25
                    : p.default,
          })),
          position: { x: -100, y: 200 },
        },
        {
          id: `${pfx}-sr`,
          type: "strategyNode",
          label: "Support / Resistance (Tuned)",
          nodeType: "condition",
          icon: Layers,
          properties: SUPPORT_RESISTANCE_PROPS.map((p) => ({
            ...p,
            default: p.key === "lookback_window" ? 30 : p.default,
          })),
          position: { x: 150, y: 200 },
        },
        {
          id: `${pfx}-vix`,
          type: "strategyNode",
          label: "VIX Regime Filter",
          nodeType: "condition",
          icon: Shield,
          properties: [
            {
              key: "vix_threshold",
              label: "VIX Threshold",
              type: "slider" as const,
              min: 15,
              max: 45,
              step: 1,
              default: 30,
            },
            {
              key: "pause_above",
              label: "Pause Entries Above",
              type: "toggle" as const,
              default: true,
            },
          ],
          position: { x: 400, y: 200 },
        },
        {
          id: `${pfx}-earnings`,
          type: "strategyNode",
          label: "Earnings Blackout",
          nodeType: "condition",
          icon: Activity,
          properties: [
            {
              key: "blackout_days",
              label: "Blackout Days (±)",
              type: "slider" as const,
              min: 1,
              max: 7,
              step: 1,
              default: 3,
            },
            {
              key: "filter_enabled",
              label: "Enable Filter",
              type: "toggle" as const,
              default: true,
            },
          ],
          position: { x: 650, y: 200 },
        },
      ];
    } else {
      // Initial — Diamond layout
      indicators = [
        {
          id: `${pfx}-rsi`,
          type: "strategyNode",
          label: "RSI Indicator",
          nodeType: "condition",
          icon: Gauge,
          properties: RSI_PROPS,
          position: { x: 50, y: 220 },
        },
        {
          id: `${pfx}-sr`,
          type: "strategyNode",
          label: "Support / Resistance",
          nodeType: "condition",
          icon: Layers,
          properties: SUPPORT_RESISTANCE_PROPS,
          position: { x: 300, y: 180 },
        },
        {
          id: `${pfx}-bb`,
          type: "strategyNode",
          label: "Bollinger Bands",
          nodeType: "condition",
          icon: Activity,
          properties: BOLLINGER_PROPS,
          position: { x: 550, y: 220 },
        },
      ];
    }
    // ── Strategy 2: INFY Swing ───────────────────────────────────────────────
  } else if (strategyId === 2) {
    if (isModified) {
      // Council: Add ADX trend filter (4 indicators vs 3)
      indicators = [
        {
          id: `${pfx}-macd`,
          type: "strategyNode",
          label: "MACD (Fast 8/21)",
          nodeType: "condition",
          icon: TrendingUp,
          properties: MACD_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "fast_length"
                ? 8
                : p.key === "slow_length"
                  ? 21
                  : p.default,
          })),
          position: { x: -50, y: 200 },
        },
        {
          id: `${pfx}-vol`,
          type: "strategyNode",
          label: "Volume Spike (2.5×)",
          nodeType: "condition",
          icon: BarChart3,
          properties: VOLUME_PROPS.map((p) => ({
            ...p,
            default: p.key === "volume_spike_mult" ? 2.5 : p.default,
          })),
          position: { x: 200, y: 200 },
        },
        {
          id: `${pfx}-ma`,
          type: "strategyNode",
          label: "Moving Averages (10/30)",
          nodeType: "condition",
          icon: LineChart,
          properties: MA_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "fast_period"
                ? 10
                : p.key === "slow_period"
                  ? 30
                  : p.default,
          })),
          position: { x: 450, y: 200 },
        },
        {
          id: `${pfx}-adx`,
          type: "strategyNode",
          label: "ADX Trend Filter",
          nodeType: "condition",
          icon: TrendingUp,
          properties: [
            {
              key: "adx_period",
              label: "ADX Period",
              type: "slider" as const,
              min: 7,
              max: 28,
              step: 1,
              default: 14,
            },
            {
              key: "adx_threshold",
              label: "Min ADX",
              type: "slider" as const,
              min: 15,
              max: 40,
              step: 1,
              default: 20,
            },
          ],
          position: { x: 700, y: 200 },
        },
      ];
    } else {
      // Initial — V-shape layout
      indicators = [
        {
          id: `${pfx}-macd`,
          type: "strategyNode",
          label: "MACD Crossover",
          nodeType: "condition",
          icon: TrendingUp,
          properties: MACD_PROPS,
          position: { x: 50, y: 280 },
        },
        {
          id: `${pfx}-vol`,
          type: "strategyNode",
          label: "Volume Analysis",
          nodeType: "condition",
          icon: BarChart3,
          properties: VOLUME_PROPS,
          position: { x: 350, y: 180 },
        },
        {
          id: `${pfx}-ma`,
          type: "strategyNode",
          label: "Moving Averages",
          nodeType: "condition",
          icon: LineChart,
          properties: MA_PROPS,
          position: { x: 650, y: 280 },
        },
      ];
    }
    // ── Strategy 3: TCS Scalping ─────────────────────────────────────────────
  } else if (strategyId === 3) {
    if (isModified) {
      // Council: Replace RSI with Momentum filter, remove Execution Engine (9 nodes vs 10)
      includeExec = false;
      indicators = [
        {
          id: `${pfx}-fma`,
          type: "strategyNode",
          label: "Fast MA (5/15 EMA)",
          nodeType: "condition",
          icon: LineChart,
          properties: MA_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "fast_period"
                ? 5
                : p.key === "slow_period"
                  ? 15
                  : p.key === "ma_type"
                    ? "EMA"
                    : p.default,
          })),
          position: { x: 0, y: 180 },
        },
        {
          id: `${pfx}-atr`,
          type: "strategyNode",
          label: "ATR Dynamic Stops",
          nodeType: "condition",
          icon: Activity,
          properties: ATR_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "atr_period"
                ? 10
                : p.key === "atr_multiplier"
                  ? 2
                  : p.default,
          })),
          position: { x: 250, y: 180 },
        },
        {
          id: `${pfx}-mom`,
          type: "strategyNode",
          label: "Momentum Filter",
          nodeType: "condition",
          icon: Gauge,
          properties: [
            {
              key: "mom_period",
              label: "Momentum Period",
              type: "slider" as const,
              min: 3,
              max: 20,
              step: 1,
              default: 10,
            },
            {
              key: "mom_threshold",
              label: "Min Momentum",
              type: "slider" as const,
              min: 0,
              max: 5,
              step: 0.1,
              default: 1.5,
            },
          ],
          position: { x: 500, y: 180 },
        },
      ];
    } else {
      // Initial — Compact triangle layout
      indicators = [
        {
          id: `${pfx}-fma`,
          type: "strategyNode",
          label: "Fast Moving Avg",
          nodeType: "condition",
          icon: LineChart,
          properties: MA_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "fast_period"
                ? 8
                : p.key === "slow_period"
                  ? 21
                  : p.default,
          })),
          position: { x: 50, y: 160 },
        },
        {
          id: `${pfx}-atr`,
          type: "strategyNode",
          label: "ATR Volatility",
          nodeType: "condition",
          icon: Activity,
          properties: ATR_PROPS,
          position: { x: 200, y: 160 },
        },
        {
          id: `${pfx}-rsi2`,
          type: "strategyNode",
          label: "RSI Filter",
          nodeType: "condition",
          icon: Gauge,
          properties: RSI_PROPS.map((p) => ({
            ...p,
            default: p.key === "rsi_period" ? 9 : p.default,
          })),
          position: { x: 350, y: 160 },
        },
      ];
    }
    // ── Strategy 4: HDFCBANK Risk-Managed ────────────────────────────────────
  } else {
    if (isModified) {
      // Council: Replace ATR with Kelly + Portfolio heat (4 indicators vs 3)
      indicators = [
        {
          id: `${pfx}-ma2`,
          type: "strategyNode",
          label: "Trend Filter (50/200)",
          nodeType: "condition",
          icon: LineChart,
          properties: MA_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "fast_period"
                ? 50
                : p.key === "slow_period"
                  ? 200
                  : p.default,
          })),
          position: { x: -50, y: 250 },
        },
        {
          id: `${pfx}-bb2`,
          type: "strategyNode",
          label: "Bollinger Bands (Tuned)",
          nodeType: "condition",
          icon: Gauge,
          properties: BOLLINGER_PROPS.map((p) => ({
            ...p,
            default: p.key === "bb_std_dev" ? 2.25 : p.default,
          })),
          position: { x: 250, y: 250 },
        },
        {
          id: `${pfx}-kelly`,
          type: "strategyNode",
          label: "Kelly Criterion Sizer",
          nodeType: "condition",
          icon: Settings2,
          properties: [
            {
              key: "kelly_fraction",
              label: "Kelly Fraction",
              type: "slider" as const,
              min: 0.1,
              max: 1.0,
              step: 0.05,
              default: 0.5,
            },
            {
              key: "max_kelly_pct",
              label: "Max Bet %",
              type: "slider" as const,
              min: 5,
              max: 25,
              step: 1,
              default: 10,
              suffix: "%",
            },
          ],
          position: { x: 550, y: 250 },
        },
        {
          id: `${pfx}-heat`,
          type: "strategyNode",
          label: "Portfolio Heat Monitor",
          nodeType: "condition",
          icon: BarChart3,
          properties: [
            {
              key: "max_heat",
              label: "Max Portfolio Heat %",
              type: "slider" as const,
              min: 10,
              max: 50,
              step: 5,
              default: 20,
              suffix: "%",
            },
            {
              key: "cool_period",
              label: "Cooldown Bars",
              type: "slider" as const,
              min: 1,
              max: 10,
              step: 1,
              default: 5,
            },
          ],
          position: { x: 850, y: 250 },
        },
      ];
    } else {
      // Initial — Wide tier layout
      indicators = [
        {
          id: `${pfx}-ma2`,
          type: "strategyNode",
          label: "Trend Filter (MA)",
          nodeType: "condition",
          icon: LineChart,
          properties: MA_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "fast_period"
                ? 20
                : p.key === "slow_period"
                  ? 50
                  : p.default,
          })),
          position: { x: 0, y: 250 },
        },
        {
          id: `${pfx}-atr2`,
          type: "strategyNode",
          label: "Volatility Regime",
          nodeType: "condition",
          icon: Activity,
          properties: ATR_PROPS,
          position: { x: 400, y: 250 },
        },
        {
          id: `${pfx}-bb2`,
          type: "strategyNode",
          label: "Bollinger Bands",
          nodeType: "condition",
          icon: Gauge,
          properties: BOLLINGER_PROPS,
          position: { x: 800, y: 250 },
        },
      ];
    }
  }

  // ── Position layouts per strategy for common nodes ────────────────────────
  const lp =
    strategyId === 1
      ? isModified
        ? {
            def: { x: 300, y: 0 },
            entry: { x: 100, y: 400 },
            exit: { x: 500, y: 400 },
            risk: { x: -50, y: 600 },
            pos: { x: 250, y: 600 },
            exec: { x: 550, y: 600 },
            bt: { x: 250, y: 800 },
          }
        : {
            def: { x: 300, y: 0 },
            entry: { x: 150, y: 420 },
            exit: { x: 450, y: 420 },
            risk: { x: 50, y: 620 },
            pos: { x: 300, y: 620 },
            exec: { x: 550, y: 620 },
            bt: { x: 300, y: 830 },
          }
      : strategyId === 2
        ? isModified
          ? {
              def: { x: 350, y: 0 },
              entry: { x: 150, y: 400 },
              exit: { x: 550, y: 400 },
              risk: { x: 0, y: 600 },
              pos: { x: 350, y: 600 },
              exec: { x: 700, y: 600 },
              bt: { x: 350, y: 800 },
            }
          : {
              def: { x: 350, y: 0 },
              entry: { x: 200, y: 430 },
              exit: { x: 500, y: 430 },
              risk: { x: 50, y: 620 },
              pos: { x: 350, y: 620 },
              exec: { x: 650, y: 620 },
              bt: { x: 350, y: 830 },
            }
        : strategyId === 3
          ? isModified
            ? {
                def: { x: 200, y: 0 },
                entry: { x: 80, y: 350 },
                exit: { x: 350, y: 350 },
                risk: { x: 0, y: 500 },
                pos: { x: 250, y: 500 },
                exec: { x: 0, y: 0 },
                bt: { x: 125, y: 660 },
              }
            : {
                def: { x: 200, y: 0 },
                entry: { x: 100, y: 310 },
                exit: { x: 300, y: 310 },
                risk: { x: 0, y: 460 },
                pos: { x: 200, y: 460 },
                exec: { x: 400, y: 460 },
                bt: { x: 200, y: 610 },
              }
          : isModified
            ? {
                def: { x: 400, y: 0 },
                entry: { x: 150, y: 450 },
                exit: { x: 650, y: 450 },
                risk: { x: 0, y: 640 },
                pos: { x: 350, y: 640 },
                exec: { x: 700, y: 640 },
                bt: { x: 350, y: 840 },
              }
            : {
                def: { x: 400, y: 0 },
                entry: { x: 200, y: 470 },
                exit: { x: 600, y: 470 },
                risk: { x: 0, y: 670 },
                pos: { x: 400, y: 670 },
                exec: { x: 800, y: 670 },
                bt: { x: 400, y: 870 },
              };

  // ── Assemble all nodes ────────────────────────────────────────────────────
  const nodes: WorkflowNodeDef[] = [
    {
      id: `${pfx}-def`,
      type: "strategyNode",
      label: q.short_name + suffix,
      nodeType: "trigger",
      icon: Target,
      properties: [
        {
          key: "ticker",
          label: "Ticker",
          type: "dropdown",
          default: q.ticker,
          options: [q.ticker],
        },
        {
          key: "timeframe",
          label: "Timeframe",
          type: "dropdown",
          default: "1D",
          options: ["1m", "5m", "15m", "1H", "4H", "1D", "1W"],
        },
        {
          key: "goal",
          label: "Goal",
          type: "dropdown",
          default: q.goal,
          options: [
            "momentum",
            "mean reversion",
            "swing trading",
            "scalping",
            "trend following",
            "risk-managed trend following",
          ],
        },
      ],
      position: lp.def,
    },
    ...indicators,
    {
      id: `${pfx}-entry`,
      type: "strategyNode",
      label: "Entry Conditions" + suffix,
      nodeType: "trigger",
      icon: ArrowDownUp,
      properties: [
        {
          key: "confirm_bars",
          label: "Confirmation Bars",
          type: "slider",
          min: 1,
          max: 5,
          step: 1,
          default: isModified ? 2 : 1,
        },
        {
          key: "entry_window",
          label: "Entry Window (bars)",
          type: "slider",
          min: 1,
          max: 10,
          step: 1,
          default: 3,
        },
      ],
      position: lp.entry,
    },
    {
      id: `${pfx}-exit`,
      type: "strategyNode",
      label: "Exit Conditions" + suffix,
      nodeType: "trigger",
      icon: ArrowDownUp,
      properties: [
        {
          key: "exit_timeout",
          label: "Time-based Exit (days)",
          type: "slider",
          min: 1,
          max: 60,
          step: 1,
          default: isModified ? 15 : 20,
        },
        {
          key: "partial_exit",
          label: "Partial Exit",
          type: "toggle",
          default: isModified,
        },
      ],
      position: lp.exit,
    },
    {
      id: `${pfx}-risk`,
      type: "strategyNode",
      label: "Risk Management" + suffix,
      nodeType: "action",
      icon: Shield,
      properties: isModified
        ? RISK_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "stop_loss_pct"
                ? 1.5
                : p.key === "take_profit_pct"
                  ? 4
                  : p.key === "trailing_stop"
                    ? true
                    : p.key === "max_drawdown_pct"
                      ? 10
                      : p.default,
          }))
        : RISK_PROPS,
      position: lp.risk,
    },
    {
      id: `${pfx}-pos`,
      type: "strategyNode",
      label: "Position Sizing" + suffix,
      nodeType: "action",
      icon: Settings2,
      properties: isModified
        ? POSITION_SIZING_PROPS.map((p) => ({
            ...p,
            default:
              p.key === "risk_per_trade"
                ? 1.5
                : p.key === "max_exposure"
                  ? 15
                  : p.key === "sizing_method"
                    ? "Volatility-Adjusted"
                    : p.default,
          }))
        : POSITION_SIZING_PROPS,
      position: lp.pos,
    },
  ];

  if (includeExec) {
    nodes.push({
      id: `${pfx}-exec`,
      type: "strategyNode",
      label: "Execution Engine" + suffix,
      nodeType: "action",
      icon: Cpu,
      properties: EXECUTION_PROPS,
      position: lp.exec,
    });
  }

  nodes.push({
    id: `${pfx}-bt`,
    type: "strategyNode",
    label: "Backtesting" + suffix,
    nodeType: "action",
    icon: Database,
    properties: BACKTEST_PROPS,
    position: lp.bt,
  });

  return nodes;
}

// Generate all 8 workflows
export const ALL_WORKFLOWS: WorkflowDef[] = STRATEGY_QUESTIONS.flatMap((q) => [
  {
    strategyId: q.id,
    workflowType: "initial" as const,
    name: `${q.short_name} — Initial Strategy`,
    nodes: makeBaseNodes(q.id, "initial"),
  },
  {
    strategyId: q.id,
    workflowType: "adversarial" as const,
    name: `${q.short_name} — Adversarial Modified`,
    nodes: makeBaseNodes(q.id, "adversarial"),
  },
]);

// ─── Helper: Convert WorkflowDef to ReactFlow Nodes & Edges ─────────────────
export function getWorkflowNodes(
  strategyId: number,
  workflowType: "initial" | "adversarial" = "initial",
) {
  const wf = ALL_WORKFLOWS.find(
    (w) => w.strategyId === strategyId && w.workflowType === workflowType,
  );
  if (!wf) return { nodes: [], edges: [] };

  const rfNodes = wf.nodes.map((n) => ({
    id: n.id,
    type: "strategyNode",
    position: n.position,
    data: {
      label: n.label,
      type: n.nodeType,
      icon: n.icon,
      properties: n.properties,
    },
  }));

  // Dynamic edge generation — works with any number of indicator nodes
  const prefix = `${strategyId}-${workflowType}`;
  const knownSuffixes = ["def", "entry", "exit", "risk", "pos", "exec", "bt"];
  const indicatorNodes = wf.nodes.filter((n) => {
    const s = n.id.replace(`${prefix}-`, "");
    return !knownSuffixes.includes(s);
  });
  const hasNode = (sfx: string) =>
    wf.nodes.some((n) => n.id === `${prefix}-${sfx}`);
  let ei = 0;
  const mkEdge = (src: string, tgt: string, color: string) => ({
    id: `e-${prefix}-${ei++}`,
    source: src,
    target: tgt,
    animated: true,
    style: { stroke: color, strokeWidth: 2, opacity: 0.5 },
  });

  const edges: any[] = [];
  // def → all indicators
  indicatorNodes.forEach((ind) =>
    edges.push(mkEdge(`${prefix}-def`, ind.id, "#a855f7")),
  );
  // indicators → entry/exit (first half → entry, rest → exit)
  const mid = Math.ceil(indicatorNodes.length / 2);
  indicatorNodes.forEach((ind, i) => {
    if (i < mid) edges.push(mkEdge(ind.id, `${prefix}-entry`, "#10b981"));
    else edges.push(mkEdge(ind.id, `${prefix}-exit`, "#f59e0b"));
  });
  // entry/exit → risk/pos
  edges.push(mkEdge(`${prefix}-entry`, `${prefix}-risk`, "#3b82f6"));
  edges.push(mkEdge(`${prefix}-exit`, `${prefix}-risk`, "#3b82f6"));
  edges.push(mkEdge(`${prefix}-entry`, `${prefix}-pos`, "#3b82f6"));
  // risk → exec (if exists), exec → bt, pos → bt
  if (hasNode("exec")) {
    edges.push(mkEdge(`${prefix}-risk`, `${prefix}-exec`, "#3b82f6"));
    edges.push(
      mkEdge(`${prefix}-exec`, `${prefix}-bt`, "rgba(255,255,255,0.5)"),
    );
  } else {
    edges.push(
      mkEdge(`${prefix}-risk`, `${prefix}-bt`, "rgba(255,255,255,0.5)"),
    );
  }
  edges.push(mkEdge(`${prefix}-pos`, `${prefix}-bt`, "rgba(255,255,255,0.5)"));

  return { nodes: rfNodes, edges };
}

// ─── Fallback Backtest Results ───────────────────────────────────────────────
function generateEquityCurve(
  startDate: string,
  months: number,
  trend: number,
  volatility: number,
) {
  const curve: any[] = [];
  let equity = 100000;
  let peak = equity;
  const start = new Date(startDate);

  for (let i = 0; i < months * 21; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dailyReturn = trend / 252 + (Math.random() - 0.5) * volatility * 2;
    equity = equity * (1 + dailyReturn);
    peak = Math.max(peak, equity);
    const dd = (peak - equity) / peak;

    curve.push({
      date: d.toISOString().split("T")[0],
      equity: Math.round(equity * 100) / 100,
      cash:
        equity > peak * 0.95
          ? Math.round(equity * 0.9 * 100) / 100
          : Math.round(equity * 100) / 100,
      holdings_value:
        equity > peak * 0.95 ? Math.round(equity * 0.1 * 100) / 100 : 0,
      drawdown: Math.round(dd * 1000000) / 1000000,
      open_positions: equity > peak * 0.95 ? 1 : 0,
    });
  }
  return curve;
}

// Seeded PRNG for deterministic trade data
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateTrades(ticker: string, count: number) {
  const trades: any[] = [];
  const basePrice =
    ticker === "RELIANCE.NS"
      ? 2850
      : ticker === "INFY.NS"
        ? 1650
        : ticker === "TCS.NS"
          ? 3950
          : 1750;
  const seed =
    ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 1000 + count;
  const rng = mulberry32(seed);
  let currentDate = new Date("2024-01-08");

  for (let i = 1; i <= count; i++) {
    // Advance date by a realistic gap
    const gap = Math.floor(rng() * 5) + 2;
    currentDate = new Date(currentDate.getTime() + gap * 86400000);
    // Skip weekends
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate = new Date(currentDate.getTime() + 86400000);
    }

    const isWin = rng() > 0.4;
    const priceVariation = 0.92 + rng() * 0.16;
    const entry = basePrice * priceVariation;
    const holdDays = Math.floor(rng() * 25) + 3;
    const pnlPct = isWin ? 0.8 + rng() * 5.5 : -(0.5 + rng() * 3.5);
    const exit = entry * (1 + pnlPct / 100);
    const shares = Math.floor(10000 / entry);
    const exitDate = new Date(currentDate.getTime() + holdDays * 86400000);

    const fmtDate = (d: Date) => d.toISOString().split("T")[0];
    trades.push({
      trade_id: i,
      entry_date: fmtDate(currentDate),
      exit_date: fmtDate(exitDate),
      entry_price: Math.round(entry * 100) / 100,
      exit_price: Math.round(exit * 100) / 100,
      shares,
      pnl: Math.round(shares * (exit - entry) * 100) / 100,
      pnl_pct: Math.round(pnlPct * 100) / 100,
      holding_days: holdDays,
      exit_reason: isWin ? "signal" : "stop_loss",
      commission: Math.round(entry * shares * 0.001 * 100) / 100,
    });

    // Move current date past exit
    currentDate = new Date(exitDate.getTime() + 86400000);
  }
  return trades;
}

export const FALLBACK_BACKTEST: Record<number, any> = {
  1: {
    status: "success",
    success: true,
    ticker: "RELIANCE.NS",
    metrics: {
      returns: {
        total_return_pct: 18.72,
        cagr_pct: 12.4,
        annualised_volatility_pct: 28.5,
      },
      risk_adjusted: {
        sharpe_ratio: 1.42,
        sortino_ratio: 1.98,
        calmar_ratio: 1.15,
        omega_ratio: 1.38,
      },
      drawdown: {
        max_drawdown_pct: 14.8,
        avg_drawdown_pct: 5.2,
        max_dd_duration_days: 45,
        current_drawdown_pct: 2.1,
      },
      trade_stats: {
        total_trades: 47,
        winning_trades: 28,
        losing_trades: 19,
        win_rate_pct: 59.6,
        avg_win_pct: 4.2,
        avg_loss_pct: -2.8,
        profit_factor: 1.65,
        expectancy_pct: 1.12,
        avg_holding_days: 8,
        best_trade_pct: 12.4,
        worst_trade_pct: -7.2,
      },
      capital: {
        initial_capital: 100000,
        final_equity: 118720,
        total_pnl: 18720,
        total_fees_paid: 312.5,
      },
      sharpe_ratio: 1.42,
      max_drawdown_pct: 14.8,
      total_return_pct: 18.72,
      win_rate_pct: 59.6,
    },
    equity_curve: generateEquityCurve("2024-01-01", 12, 0.18, 0.015),
    trades: generateTrades("RELIANCE.NS", 47),
    benchmark: {
      total_return_pct: 12.3,
      cagr_pct: 8.1,
      sharpe_ratio: 0.85,
      max_drawdown_pct: 18.2,
      final_value: 112300,
    },
    quant_tests: {
      walk_forward: {
        n_windows: 4,
        consistency_pct: 75,
        degradation_flag: false,
        verdict: "Strategy maintains performance out-of-sample",
      },
      overfitting: {
        overfitting_probability: 0.22,
        risk_level: "low",
        verdict:
          "Low overfitting risk with 47 trades across diverse conditions",
      },
      regime: {
        current_regime: "bull_volatile",
        dominant_regime: "bull_trending",
        regime_stats: {
          bull_trending: {
            n_trades: 18,
            win_rate_pct: 72,
            avg_return_pct: 3.8,
          },
          bear_volatile: {
            n_trades: 12,
            win_rate_pct: 42,
            avg_return_pct: -1.2,
          },
        },
      },
    },
    summary: {
      bars_tested: 501,
      entry_signals_raw: 84,
      exit_signals_raw: 92,
      total_trades: 47,
      indicators_used: ["RSI_14", "BB_20", "Support_Resistance"],
      date_range: { start: "2024-01-01", end: "2025-01-01" },
    },
  },
  2: {
    status: "success",
    success: true,
    ticker: "INFY.NS",
    metrics: {
      returns: {
        total_return_pct: 24.5,
        cagr_pct: 16.8,
        annualised_volatility_pct: 22.1,
      },
      risk_adjusted: {
        sharpe_ratio: 1.85,
        sortino_ratio: 2.41,
        calmar_ratio: 1.98,
        omega_ratio: 1.62,
      },
      drawdown: {
        max_drawdown_pct: 12.4,
        avg_drawdown_pct: 4.1,
        max_dd_duration_days: 32,
        current_drawdown_pct: 0.8,
      },
      trade_stats: {
        total_trades: 62,
        winning_trades: 42,
        losing_trades: 20,
        win_rate_pct: 67.7,
        avg_win_pct: 3.8,
        avg_loss_pct: -2.1,
        profit_factor: 2.15,
        expectancy_pct: 1.52,
        avg_holding_days: 12,
        best_trade_pct: 9.8,
        worst_trade_pct: -5.4,
      },
      capital: {
        initial_capital: 100000,
        final_equity: 124500,
        total_pnl: 24500,
        total_fees_paid: 425.8,
      },
      sharpe_ratio: 1.85,
      max_drawdown_pct: 12.4,
      total_return_pct: 24.5,
      win_rate_pct: 67.7,
    },
    equity_curve: generateEquityCurve("2024-01-01", 12, 0.24, 0.012),
    trades: generateTrades("INFY.NS", 62),
    benchmark: {
      total_return_pct: 15.2,
      cagr_pct: 10.5,
      sharpe_ratio: 0.92,
      max_drawdown_pct: 15.8,
      final_value: 115200,
    },
    quant_tests: {
      walk_forward: {
        n_windows: 4,
        consistency_pct: 100,
        degradation_flag: false,
        verdict: "Excellent out-of-sample consistency",
      },
      overfitting: {
        overfitting_probability: 0.15,
        risk_level: "low",
        verdict: "Robust strategy with strong signal-to-noise ratio",
      },
      regime: {
        current_regime: "bull_trending",
        dominant_regime: "bull_trending",
        regime_stats: {
          bull_trending: {
            n_trades: 28,
            win_rate_pct: 78,
            avg_return_pct: 4.2,
          },
          sideways: { n_trades: 14, win_rate_pct: 50, avg_return_pct: 0.8 },
        },
      },
    },
    summary: {
      bars_tested: 501,
      entry_signals_raw: 120,
      exit_signals_raw: 115,
      total_trades: 62,
      indicators_used: ["MACD_12_26_9", "Volume_20", "EMA_20", "EMA_50"],
      date_range: { start: "2024-01-01", end: "2025-01-01" },
    },
  },
  3: {
    status: "success",
    success: true,
    ticker: "TCS.NS",
    metrics: {
      returns: {
        total_return_pct: 32.1,
        cagr_pct: 22.5,
        annualised_volatility_pct: 35.2,
      },
      risk_adjusted: {
        sharpe_ratio: 1.12,
        sortino_ratio: 1.55,
        calmar_ratio: 0.95,
        omega_ratio: 1.28,
      },
      drawdown: {
        max_drawdown_pct: 22.8,
        avg_drawdown_pct: 8.5,
        max_dd_duration_days: 28,
        current_drawdown_pct: 5.2,
      },
      trade_stats: {
        total_trades: 184,
        winning_trades: 105,
        losing_trades: 79,
        win_rate_pct: 57.1,
        avg_win_pct: 2.1,
        avg_loss_pct: -1.4,
        profit_factor: 1.72,
        expectancy_pct: 0.65,
        avg_holding_days: 2,
        best_trade_pct: 6.5,
        worst_trade_pct: -4.8,
      },
      capital: {
        initial_capital: 100000,
        final_equity: 132100,
        total_pnl: 32100,
        total_fees_paid: 1250.4,
      },
      sharpe_ratio: 1.12,
      max_drawdown_pct: 22.8,
      total_return_pct: 32.1,
      win_rate_pct: 57.1,
    },
    equity_curve: generateEquityCurve("2024-01-01", 12, 0.32, 0.02),
    trades: generateTrades("TCS.NS", 50),
    benchmark: {
      total_return_pct: 18.5,
      cagr_pct: 12.8,
      sharpe_ratio: 0.78,
      max_drawdown_pct: 20.1,
      final_value: 118500,
    },
    quant_tests: {
      walk_forward: {
        n_windows: 4,
        consistency_pct: 50,
        degradation_flag: true,
        verdict: "Mixed results — performance degrades in volatile periods",
      },
      overfitting: {
        overfitting_probability: 0.45,
        risk_level: "medium",
        verdict: "Moderate overfitting risk due to high trade frequency",
      },
      regime: {
        current_regime: "bull_volatile",
        dominant_regime: "bull_trending",
        regime_stats: {
          bull_trending: {
            n_trades: 72,
            win_rate_pct: 65,
            avg_return_pct: 2.8,
          },
          bear_volatile: {
            n_trades: 45,
            win_rate_pct: 42,
            avg_return_pct: -0.5,
          },
        },
      },
    },
    summary: {
      bars_tested: 501,
      entry_signals_raw: 310,
      exit_signals_raw: 295,
      total_trades: 184,
      indicators_used: ["EMA_8", "EMA_21", "ATR_14", "RSI_9"],
      date_range: { start: "2024-01-01", end: "2025-01-01" },
    },
  },
  4: {
    status: "success",
    success: true,
    ticker: "HDFCBANK.NS",
    metrics: {
      returns: {
        total_return_pct: 14.2,
        cagr_pct: 9.8,
        annualised_volatility_pct: 12.5,
      },
      risk_adjusted: {
        sharpe_ratio: 2.15,
        sortino_ratio: 2.85,
        calmar_ratio: 2.42,
        omega_ratio: 1.78,
      },
      drawdown: {
        max_drawdown_pct: 6.2,
        avg_drawdown_pct: 2.1,
        max_dd_duration_days: 18,
        current_drawdown_pct: 0.5,
      },
      trade_stats: {
        total_trades: 35,
        winning_trades: 24,
        losing_trades: 11,
        win_rate_pct: 68.6,
        avg_win_pct: 2.8,
        avg_loss_pct: -1.2,
        profit_factor: 2.85,
        expectancy_pct: 1.35,
        avg_holding_days: 15,
        best_trade_pct: 5.8,
        worst_trade_pct: -2.4,
      },
      capital: {
        initial_capital: 100000,
        final_equity: 114200,
        total_pnl: 14200,
        total_fees_paid: 180.25,
      },
      sharpe_ratio: 2.15,
      max_drawdown_pct: 6.2,
      total_return_pct: 14.2,
      win_rate_pct: 68.6,
    },
    equity_curve: generateEquityCurve("2024-01-01", 12, 0.14, 0.008),
    trades: generateTrades("HDFCBANK.NS", 35),
    benchmark: {
      total_return_pct: 10.8,
      cagr_pct: 7.5,
      sharpe_ratio: 0.95,
      max_drawdown_pct: 12.5,
      final_value: 110800,
    },
    quant_tests: {
      walk_forward: {
        n_windows: 4,
        consistency_pct: 100,
        degradation_flag: false,
        verdict: "Extremely consistent across all windows",
      },
      overfitting: {
        overfitting_probability: 0.08,
        risk_level: "very_low",
        verdict: "Minimal overfitting — simple, robust rules",
      },
      regime: {
        current_regime: "bull_trending",
        dominant_regime: "bull_trending",
        regime_stats: {
          bull_trending: {
            n_trades: 20,
            win_rate_pct: 80,
            avg_return_pct: 3.2,
          },
          sideways: { n_trades: 10, win_rate_pct: 50, avg_return_pct: 0.4 },
        },
      },
    },
    summary: {
      bars_tested: 501,
      entry_signals_raw: 55,
      exit_signals_raw: 60,
      total_trades: 35,
      indicators_used: ["EMA_20", "EMA_50", "ATR_14", "BB_20"],
      date_range: { start: "2024-01-01", end: "2025-01-01" },
    },
  },
};

// ─── Fallback Adversarial Results ────────────────────────────────────────────
export const FALLBACK_ADVERSARIAL: Record<number, any> = {
  1: {
    loopholes: [
      {
        severity: "medium",
        finding:
          "RSI oversold signals cluster during earnings volatility — false entries",
        suggestion: "Add earnings blackout filter (±3 days)",
      },
      {
        severity: "high",
        finding:
          "Support levels break during macro sell-offs, leading to cascading losses",
        suggestion: "Add VIX regime filter > 30 to pause entries",
      },
      {
        severity: "low",
        finding: "Position sizing doesn't account for RELIANCE.NS beta profile",
        suggestion: "Scale position size by inverse beta",
      },
    ],
    improvements: [
      "Added trailing stop based on ATR",
      "Reduced RSI oversold to 25 from 30",
      "Added Bollinger Band squeeze confirmation",
      "Increased lookback for S/R to 30 bars",
    ],
    attack_type: "volatility_shock",
    stress_backtest: {
      sharpe_ratio: 1.18,
      total_return_pct: 14.2,
      max_drawdown_pct: 18.5,
    },
  },
  2: {
    loopholes: [
      {
        severity: "low",
        finding: "MACD crossover lag causes late entries in fast moves",
        suggestion: "Use histogram slope instead of line crossover",
      },
      {
        severity: "medium",
        finding: "Volume spikes during market open cause false signals",
        suggestion: "Exclude first 15 minutes of trading",
      },
      {
        severity: "low",
        finding: "Strategy underperforms in low-volatility sideways markets",
        suggestion: "Add ADX filter > 20 for trend confirmation",
      },
    ],
    improvements: [
      "Shortened MACD fast length to 8",
      "Increased volume spike threshold to 2.5x",
      "Added time-of-day filter",
      "Enabled partial exit at 50% of target",
    ],
    attack_type: "trend_reversal",
    stress_backtest: {
      sharpe_ratio: 1.62,
      total_return_pct: 20.1,
      max_drawdown_pct: 14.8,
    },
  },
  3: {
    loopholes: [
      {
        severity: "high",
        finding:
          "Scalping frequency leads to excessive commission drag (-4.2% annually)",
        suggestion: "Increase minimum profit threshold to 0.5%",
      },
      {
        severity: "high",
        finding: "Tight stops get triggered by normal market noise",
        suggestion: "Use ATR-based stops instead of fixed percentage",
      },
      {
        severity: "medium",
        finding: "Fast MA crossovers generate whipsaw in choppy markets",
        suggestion: "Add momentum filter (RSI > 50 for longs)",
      },
    ],
    improvements: [
      "Switched to ATR-based dynamic stops (2x ATR)",
      "Reduced trade frequency by adding RSI filter",
      "Shortened fast MA to 5 from 8",
      "Added minimum holding period of 30 minutes",
    ],
    attack_type: "liquidity_shock",
    stress_backtest: {
      sharpe_ratio: 0.85,
      total_return_pct: 22.8,
      max_drawdown_pct: 28.5,
    },
  },
  4: {
    loopholes: [
      {
        severity: "low",
        finding:
          "Drawdown limits occasionally trigger during normal corrections",
        suggestion: "Use rolling 20-day drawdown instead of peak-to-trough",
      },
      {
        severity: "low",
        finding:
          "Position sizing is conservative — leaves returns on table in strong trends",
        suggestion: "Scale up position size when trend strength (ADX) > 35",
      },
    ],
    improvements: [
      "Increased MA slow period to 200 for major trend filter",
      "Added dynamic position sizing with Kelly criterion",
      "Reduced max drawdown from 15% to 10%",
      "Added portfolio heat check",
    ],
    attack_type: "overfitting",
    stress_backtest: {
      sharpe_ratio: 1.95,
      total_return_pct: 12.8,
      max_drawdown_pct: 7.5,
    },
  },
};

// ─── Lookup Helpers ──────────────────────────────────────────────────────────
export function getStrategyById(id: number) {
  return STRATEGY_QUESTIONS.find((s) => s.id === id);
}

export function getStrategyByPrompt(prompt: string) {
  return STRATEGY_QUESTIONS.find(
    (s) =>
      prompt.toLowerCase().includes(s.ticker.toLowerCase()) ||
      prompt.toLowerCase().includes(s.goal.toLowerCase()),
  );
}

// ─── API Fallback Wrapper ────────────────────────────────────────────────────
export async function apiWithFallback<T>(
  apiCall: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.warn("[API Fallback] Request failed, using fallback data:", error);
    return fallback;
  }
}

// ─── Backtest Execution Nodes (per-strategy, for left panel visualizer) ──────
export interface BacktestExecNode {
  id: string;
  type: "trigger" | "condition" | "action" | "data" | "signal";
  label: string;
  sublabel?: string;
}

export function getBacktestWorkflowNodes(
  strategyId: number,
): BacktestExecNode[] {
  switch (strategyId) {
    case 1: // RELIANCE Mean Reversion
      return [
        {
          id: "n1",
          type: "data",
          label: "Load RELIANCE.NS OHLCV",
          sublabel: "1D bars",
        },
        {
          id: "n2",
          type: "condition",
          label: "RSI(14) < 30",
          sublabel: "Oversold filter",
        },
        {
          id: "n3",
          type: "condition",
          label: "Price at Support",
          sublabel: "S/R detection",
        },
        {
          id: "n4",
          type: "condition",
          label: "BB Squeeze Active",
          sublabel: "Bollinger 20,2",
        },
        {
          id: "n5",
          type: "signal",
          label: "Entry Signal",
          sublabel: "All conditions met",
        },
        {
          id: "n6",
          type: "action",
          label: "Buy Market Order",
          sublabel: "2% risk per trade",
        },
        {
          id: "n7",
          type: "condition",
          label: "RSI(14) > 70",
          sublabel: "Overbought exit",
        },
        {
          id: "n8",
          type: "action",
          label: "Close Position",
          sublabel: "Trailing stop",
        },
        {
          id: "n9",
          type: "trigger",
          label: "Risk Check",
          sublabel: "Max DD 15%",
        },
        {
          id: "n10",
          type: "action",
          label: "Record Trade",
          sublabel: "PnL + Stats",
        },
      ];
    case 2: // INFY Swing
      return [
        {
          id: "n1",
          type: "data",
          label: "Load INFY.NS Data",
          sublabel: "1D OHLCV",
        },
        {
          id: "n2",
          type: "condition",
          label: "MACD Cross Up",
          sublabel: "12,26,9",
        },
        {
          id: "n3",
          type: "condition",
          label: "Volume > 2x Avg",
          sublabel: "20-day vol MA",
        },
        {
          id: "n4",
          type: "condition",
          label: "EMA 20 > EMA 50",
          sublabel: "Trend filter",
        },
        {
          id: "n5",
          type: "signal",
          label: "Swing Entry",
          sublabel: "Confirmed",
        },
        {
          id: "n6",
          type: "action",
          label: "Limit Buy Order",
          sublabel: "At pullback",
        },
        {
          id: "n7",
          type: "condition",
          label: "MACD Cross Down",
          sublabel: "Exit signal",
        },
        {
          id: "n8",
          type: "condition",
          label: "Volume Dry Up",
          sublabel: "< 0.5x avg",
        },
        {
          id: "n9",
          type: "action",
          label: "Partial Exit 50%",
          sublabel: "Scale out",
        },
        {
          id: "n10",
          type: "action",
          label: "Full Exit",
          sublabel: "Timeout 20d",
        },
        {
          id: "n11",
          type: "trigger",
          label: "Portfolio Rebal",
          sublabel: "Position sizing",
        },
      ];
    case 3: // TCS Scalping
      return [
        {
          id: "n1",
          type: "data",
          label: "Load TCS.NS Tick Data",
          sublabel: "1m bars",
        },
        {
          id: "n2",
          type: "condition",
          label: "EMA(8) Cross EMA(21)",
          sublabel: "Fast cross",
        },
        {
          id: "n3",
          type: "condition",
          label: "ATR(14) > Threshold",
          sublabel: "Volatility OK",
        },
        {
          id: "n4",
          type: "condition",
          label: "RSI(9) Momentum",
          sublabel: "> 50 for longs",
        },
        {
          id: "n5",
          type: "signal",
          label: "Scalp Entry",
          sublabel: "Fast exec",
        },
        {
          id: "n6",
          type: "action",
          label: "Market Buy",
          sublabel: "TWAP split",
        },
        {
          id: "n7",
          type: "condition",
          label: "ATR Stop Hit",
          sublabel: "2x ATR trail",
        },
        {
          id: "n8",
          type: "action",
          label: "Flash Exit",
          sublabel: "Market sell",
        },
        {
          id: "n9",
          type: "trigger",
          label: "Commission Check",
          sublabel: "Fee drag",
        },
      ];
    case 4: // HDFCBANK Risk-Managed
      return [
        {
          id: "n1",
          type: "data",
          label: "Load HDFCBANK.NS Daily",
          sublabel: "10Y history",
        },
        {
          id: "n2",
          type: "condition",
          label: "EMA(20) > EMA(50)",
          sublabel: "Uptrend filter",
        },
        {
          id: "n3",
          type: "condition",
          label: "ATR Regime Low",
          sublabel: "Vol < 1.5x",
        },
        {
          id: "n4",
          type: "condition",
          label: "BB Width Normal",
          sublabel: "No squeeze",
        },
        {
          id: "n5",
          type: "signal",
          label: "Trend Entry Signal",
          sublabel: "Conservative",
        },
        {
          id: "n6",
          type: "action",
          label: "Buy with Kelly %",
          sublabel: "Position size",
        },
        {
          id: "n7",
          type: "trigger",
          label: "Drawdown Monitor",
          sublabel: "Max -6.2%",
        },
        {
          id: "n8",
          type: "condition",
          label: "Trend Reversal",
          sublabel: "EMA cross down",
        },
        {
          id: "n9",
          type: "action",
          label: "Gradual Exit",
          sublabel: "Scale out 3d",
        },
        {
          id: "n10",
          type: "trigger",
          label: "Portfolio Heat",
          sublabel: "< 20% exposed",
        },
        {
          id: "n11",
          type: "action",
          label: "Rebalance",
          sublabel: "Weekly check",
        },
        {
          id: "n12",
          type: "action",
          label: "Log Performance",
          sublabel: "Attribution",
        },
      ];
    default:
      return [
        { id: "n1", type: "data", label: "Load Price Data" },
        { id: "n2", type: "condition", label: "Check Entry" },
        { id: "n3", type: "action", label: "Execute Trade" },
        { id: "n4", type: "action", label: "Record Result" },
      ];
  }
}
