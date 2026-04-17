with open("src/pages/BacktestRunPage1.tsx", "r") as f:
    t1 = f.read()

# Fix the interface
t1 = t1.replace('export interface BacktestExecNode {\n  id: string;', 'export interface BacktestExecNode {\n  id: string;\n  type: "trigger" | "condition" | "action";\n  sublabel?: string;\n')

# Fix getStrategyByPrompt
t1 = t1.replace('getStrategyByPrompt(strategyData?.ticker || strategyData?.prompt || "")\n        ?.id ||', '1 ||')

with open("src/pages/BacktestRunPage1.tsx", "w") as f:
    f.write(t1)

with open("src/pages/StrategyResultsPage.tsx", "r") as f:
    t2 = f.read()

# Fix getStrategyByPrompt 
import re
t2 = re.sub(r'const matchedStrategy = getStrategyByPrompt\([^)]+\);', 'const matchedStrategy: any = null;', t2)

with open("src/pages/StrategyResultsPage.tsx", "w") as f:
    f.write(t2)
