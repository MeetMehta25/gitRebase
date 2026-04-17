import re

with open("src/pages/BacktestRunPage1.tsx", "r") as f:
    text = f.read()

# Replace FALLBACK_BACKTEST import
text = text.replace('  FALLBACK_BACKTEST,\n', '')

# Remove fallback references in backtestResult lookup
text = text.replace("""const backtestResult =
    location.state?.backtestResult ||
    strategyData?.backtest_result ||
    strategyData?.metrics
      ? strategyData
      : FALLBACK_BACKTEST[strategyId];""", 
"""const backtestResult =
    location.state?.backtest ||
    location.state?.backtestResult ||
    strategyData?.backtest_result ||
    strategyData?.metrics
      ? strategyData
      : null;""")

text = text.replace('const fb = FALLBACK_BACKTEST[strategyId];', 'const fb = backtestResult;')
text = text.replace('FALLBACK_BACKTEST[strategyId]', 'backtestResult')

# Add ErrorState import
if 'import { ErrorState }' not in text:
    text = text.replace('import { useStrategyStore } from "../store/strategyStore";', 
                        'import { useStrategyStore } from "../store/strategyStore";\nimport { ErrorState } from "../components/ui/ErrorState";')

# Add missing data guard
start_main = text.find('// ─── Main Page Component ─────────────────────────────────────────────────────')
idx = text.find('const workflowNodes = useMemo(', start_main)
missing_data_guard = """
  if (!backtestResult) {
    return <ErrorState message="Missing backtest data. Please generate a strategy first." actionLabel="Go back" onAction={() => navigate("/ai-agents")} />;
  }

  """
text = text[:idx] + missing_data_guard + text[idx:]

with open("src/pages/BacktestRunPage1.tsx", "w") as f:
    f.write(text)
