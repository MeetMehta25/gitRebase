with open("src/pages/BacktestRunPage1.tsx", "r") as f:
    text = f.read()

# Remove imports
text = text.replace('  getStrategyByPrompt,\n', '')
text = text.replace('  getBacktestWorkflowNodes,\n', '')
text = text.replace('  type BacktestExecNode,\n', '')

# Insert the interface directly
start_main = text.find('// ─── Main Page Component ─────────────────────────────────────────────────────')
insert_nodes = """
export interface BacktestExecNode {
  id: string;
  label: string;
  icon: string;
  subtext: string;
  durationPct: number;
}
export function getBacktestWorkflowNodes(): BacktestExecNode[] {
  return [
    { id: "e1", label: "Initial Setup", icon: "Bot", subtext: "Parsing params...", durationPct: 10 },
    { id: "e2", label: "Data Pipeline", icon: "Activity", subtext: "Fetching historical feeds...", durationPct: 30 },
    { id: "e3", label: "Indicator Calculation", icon: "TrendingUp", subtext: "Applying math models...", durationPct: 50 },
    { id: "e4", label: "Signal Generation", icon: "Cpu", subtext: "Trading logic conditions...", durationPct: 70 },
    { id: "e5", label: "Strategy Execution", icon: "CheckCircle2", subtext: "Recording trades...", durationPct: 90 }
  ];
}
"""
text = text[:start_main] + insert_nodes + text[start_main:]

text = text.replace('getStrategyByPrompt(strategyData?.ticker || strategyData?.prompt || "")?.id || 1', '1')
text = text.replace('getBacktestWorkflowNodes(strategyId)', 'getBacktestWorkflowNodes()')

with open("src/pages/BacktestRunPage1.tsx", "w") as f:
    f.write(text)

with open("src/pages/StrategyResultsPage.tsx", "r") as f:
    text2 = f.read()

text2 = text2.replace('import { getStrategyByPrompt } from "../data/strategyData";', '')
text2 = text2.replace('const matchedStrategy = getStrategyByPrompt((strategy?.prompt || strategy?.ticker || ""));', 'const matchedStrategy = null;')
text2 = text2.replace('getStrategyByPrompt(strategy?.ticker || "")?.id ||', '')    

with open("src/pages/StrategyResultsPage.tsx", "w") as f:
    f.write(text2)
