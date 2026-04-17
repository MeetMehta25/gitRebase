with open("client/src/pages/BacktestRunPage1.tsx", "r") as f:
    content = f.read()

content = content.replace("FALLBACK_BACKTEST,", "")
content = content.replace("? strategyData\n        : FALLBACK_BACKTEST[strategyId];", "? strategyData\n        : null;")

content = content.replace("{apiResult?.summary?.bars_tested || FALLBACK_BACKTEST[strategyId]?.summary?.bars_tested || 501}", "{apiResult?.summary?.bars_tested || '--'}")

with open("client/src/pages/BacktestRunPage1.tsx", "w") as f:
    f.write(content)

