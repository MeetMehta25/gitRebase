with open("src/pages/BacktestRunPage1.tsx", "r") as f:
    text = f.read()

# Fix the ErrorState props
text = text.replace('actionLabel="Go back" onAction={() => navigate("/ai-agents")}', 'onRetry={() => navigate("/ai-agents")}')

# Fix that broken fallback usage
text = text.replace('FALLBACK_BACKTEST[\\n', 'backtestResult[\\n')
text = text.replace('FALLBACK_BACKTEST[\n', 'backtestResult[\n')

with open("src/pages/BacktestRunPage1.tsx", "w") as f:
    f.write(text)
