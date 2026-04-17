with open("src/pages/StrategyBuilderPage.tsx", "r", encoding='utf-8') as f:
    text = f.read()

target = "    useStrategyStore.getState().setCurrentStrategy(backtestResult);"
replacement = "    useStrategyStore.getState().setCurrentStrategy(backtestResult);\n    addPoints(30, 'Strategy Selected for Backtest! Good luck.');\n"

if replacement not in text:
    text = text.replace(target, replacement)

with open("src/pages/StrategyBuilderPage.tsx", "w", encoding='utf-8') as f:
    f.write(text)

