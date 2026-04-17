with open("src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

# Re-add currentStrategy to StrategyHistoryPanel
text = text.replace('function StrategyHistoryPanel({\n  \n}: {\n  \n}) {\n', 'function StrategyHistoryPanel() {\n  const { currentStrategy } = useStrategyStore();\n')

# Re-add to StrategyFlow
text = text.replace('// Strategy sources: location state, Zustand store\n', '// Strategy sources: location state, Zustand store\n  const { currentStrategy } = useStrategyStore();\n')

# Remove location 
text = text.replace('const location = useLocation();\n', '')

# Remove onWorkflowSelect= from the usage
text = text.replace('<StrategyHistoryPanel onWorkflowSelect={loadWorkflow} />', '<StrategyHistoryPanel />')

with open("src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)
