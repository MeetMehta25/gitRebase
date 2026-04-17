with open("src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

# Fix unused imports
text = text.replace('import { motion } from "framer-motion";\n', '')
text = text.replace('import { ErrorState } from "../components/ui/ErrorState";\n', '')
text = text.replace('import { type NodePropertyConfig } from "../data/strategyData";', '')

# Fix property access 
text = text.replace('{currentStrategy.prompt || "No prompt provided."}', '{null}')
text = text.replace('{(useStrategyStore.getState().currentStrategy?.backtest_result?.trades || [])', '{([])')
text = text.replace('trades={useStrategyStore.getState().currentStrategy?.backtest_result?.trades || []}', 'trades={[]}')
text = text.replace('data={useStrategyStore.getState().currentStrategy?.backtest_result?.equity_curve || []}', 'data={[]}')

# Remove loadWorkflow and related methods that call dummy data
start_lw = text.find('  const loadWorkflow = useCallback(')
end_lw = text.find('  const handleSave = useCallback(')
if start_lw != -1 and end_lw != -1:
    text = text[:start_lw] + text[end_lw:]

# In StrategyHistoryPanel, we passed onWorkflowSelect inside button but loadWorkflow is gone.
text = text.replace('onClick={() => onWorkflowSelect(1, "initial")}', 'onClick={() => {}}')

# Wait, handleRunBacktest references getWorkflowNodes?
start_hrb = text.find('  // ─── Run Backtest handler ───────────────────────────────────────────────────')
end_hrb = text.find('  return (\n    <div className="flex flex-col h-full w-full bg-[#050505] text-white">')
new_hrb = """
  const handleRunBacktest = useCallback(async () => {
    navigate("/backtest-run-1");
  }, [navigate]);

"""
if start_hrb != -1 and end_hrb != -1:
    text = text[:start_hrb] + new_hrb + text[end_hrb:]

with open("src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)
