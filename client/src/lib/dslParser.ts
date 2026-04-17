import type { Node } from "reactflow";
import { FALLBACK_BACKTEST } from "../data/strategyData";

export function generateDSL(
  strategyId: number,
  nodes: Node[],
  ticker: string,
  prompt: string,
  goal: string,
) {
  const fallback = FALLBACK_BACKTEST[strategyId] || FALLBACK_BACKTEST[1];

  const dsl: any = {
    strategy_id: strategyId,
    ticker: ticker || "RELIANCE.NS",
    goal: goal || "momentum",
    prompt: prompt || "",
    indicators: [],
    entry_conditions: [],
    exit_conditions: [],
    initial_capital: 100000,
    position_size: 0.1,
    commission_pct: 0.001,
    slippage_pct: 0.0005,
    stop_loss_pct: null,
    take_profit_pct: null,
  };

  nodes.forEach((node) => {
    const label = node.data?.label || "";
    // User modifications or fallbacks
    const params = node.data?.params || {};
    const props = node.data?.properties || [];

    const getParam = (key: string) => {
      if (params[key] !== undefined) return params[key];
      const propDef = props.find((p: any) => p.key === key);
      return propDef !== undefined ? propDef.default : null;
    };

    if (label.includes("RSI")) {
      const period = Number(getParam("period")) || 14;
      const oversold = Number(getParam("oversold")) || 30;
      const overbought = Number(getParam("overbought")) || 70;

      dsl.indicators.push({ name: "RSI", period });
      dsl.entry_conditions.push({
        indicator: `RSI_${period}`,
        operator: "<",
        value: oversold,
      });
      dsl.exit_conditions.push({
        indicator: `RSI_${period}`,
        operator: ">",
        value: overbought,
      });
    } else if (label.includes("Bollinger") || label.includes("BB ")) {
      const period = Number(getParam("period")) || 20;
      const stddev = Number(getParam("stddev")) || 2;
      const widthThreshold = Number(getParam("threshold")) || 5;

      dsl.indicators.push({ name: "BB", period, stddev });
      if (label.includes("Width")) {
        dsl.entry_conditions.push({
          indicator: `BB_WIDTH_${period}`,
          operator: "<",
          value: widthThreshold,
        });
      } else {
        dsl.entry_conditions.push({
          indicator: "close",
          operator: "<",
          value: `BB_LOWER_${period}`,
        });
        dsl.exit_conditions.push({
          indicator: "close",
          operator: ">",
          value: `BB_UPPER_${period}`,
        });
      }
    } else if (label.includes("MACD")) {
      const fast = Number(getParam("fast")) || 12;
      const slow = Number(getParam("slow")) || 26;
      const signal = Number(getParam("signal")) || 9;

      dsl.indicators.push({
        name: "MACD",
        fast_period: fast,
        slow_period: slow,
        signal_period: signal,
      });
      dsl.entry_conditions.push({
        indicator: `MACD`,
        operator: ">",
        value: `MACD_SIGNAL`,
      });
      dsl.exit_conditions.push({
        indicator: `MACD`,
        operator: "<",
        value: `MACD_SIGNAL`,
      });
    } else if (label.includes("EMA") || label.includes("Moving Average")) {
      const fastPeriod = Number(getParam("fastPeriod")) || 20;
      const slowPeriod = Number(getParam("slowPeriod")) || 50;

      dsl.indicators.push({ name: "EMA", period: fastPeriod });
      dsl.indicators.push({ name: "EMA", period: slowPeriod });
      dsl.entry_conditions.push({
        indicator: `EMA_${fastPeriod}`,
        operator: ">",
        value: `EMA_${slowPeriod}`,
      });
      dsl.exit_conditions.push({
        indicator: `EMA_${fastPeriod}`,
        operator: "<",
        value: `EMA_${slowPeriod}`,
      });
    } else if (label === "Stop Loss" || label.includes("Risk Mgmt")) {
      dsl.stop_loss_pct = (Number(getParam("stopPct")) || 2) / 100;
      if (getParam("takeProfitPct") !== undefined) {
        dsl.take_profit_pct = (Number(getParam("takeProfitPct")) || 5) / 100;
      }
    } else if (label.includes("Support") || label.includes("Resistance")) {
      const window = Number(getParam("window")) || 20;
      dsl.indicators.push({ name: "SR", period: window });
      dsl.entry_conditions.push({
        indicator: "close",
        operator: ">",
        value: `RESISTANCE_${window}`,
      });
      dsl.exit_conditions.push({
        indicator: "close",
        operator: "<",
        value: `SUPPORT_${window}`,
      });
    }
  });

  // Ensure minimum viable logic
  if (dsl.entry_conditions.length === 0)
    dsl.entry_conditions.push({ indicator: "close", operator: ">", value: 0 });
  if (dsl.exit_conditions.length === 0)
    dsl.exit_conditions.push({
      indicator: "close",
      operator: "<",
      value: 99999999,
    });

  return {
    ...fallback,
    ...dsl,
    strategy_from_debate: {
      indicators: dsl.indicators.map((i: any) => i.name),
      entry_conditions: dsl.entry_conditions,
      exit_conditions: dsl.exit_conditions,
    },
    metrics: fallback.metrics,
  };
}
