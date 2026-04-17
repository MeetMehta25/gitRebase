import re

with open("client/src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

text = text.replace("FALLBACK_BACKTEST,", "")

text = re.sub(r"const fb = FALLBACK_BACKTEST\[q.id\];", "const fb = null;", text)
text = re.sub(r"const fallback = FALLBACK_BACKTEST\[strategyId\];", "const fallback = null;", text)
text = re.sub(r"\(FALLBACK_BACKTEST\[activeStrategyId \|\| 1\]\?\.trades \|\| \[\]\)", "([])", text)

with open("client/src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)

