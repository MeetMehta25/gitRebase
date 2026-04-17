with open("client/src/lib/dslParser.ts", "r") as f:
    content = f.read()

content = content.replace('import { FALLBACK_BACKTEST } from "../data/strategyData";', '')
content = content.replace('  const fallback = FALLBACK_BACKTEST[strategyId] || FALLBACK_BACKTEST[1];', '')

target = """  return {
    ...fallback,
    ...dsl,
    strategy_from_debate: {
      indicators: dsl.indicators.map((i: any) => i.name),
      entry_conditions: dsl.entry_conditions,
      exit_conditions: dsl.exit_conditions,
    },
    metrics: fallback.metrics,
  };"""

replacement = """  return {
    ...dsl,
    strategy_from_debate: {
      indicators: dsl.indicators.map((i: any) => i.name),
      entry_conditions: dsl.entry_conditions,
      exit_conditions: dsl.exit_conditions,
    },
  };"""

content = content.replace(target, replacement)

with open("client/src/lib/dslParser.ts", "w") as f:
    f.write(content)

