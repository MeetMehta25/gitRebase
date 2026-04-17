with open("client/src/pages/BacktestRunPage1.tsx", "r") as f:
    text = f.read()

text = text.replace("FALLBACK_BACKTEST,", "")
text = text.replace("? strategyData\n        : FALLBACK_BACKTEST[strategyId];", "? strategyData\n        : null;")

with open("client/src/pages/BacktestRunPage1.tsx", "w") as f:
    f.write(text)

