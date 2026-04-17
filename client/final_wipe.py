with open("src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

# 1. Remove onWorkflowSelect
text = text.replace('onWorkflowSelect,', '')
text = text.replace('onWorkflowSelect: (\n    strategyId: number,\n    workflowType: "initial" | "adversarial",\n  ) => void;', '')

# 2. Fix implicit any 'o'
text = text.replace('prop.options?.map((o) => (', 'prop.options?.map((o: any) => (')

# 3. Remove unused vars
text = text.replace('const generatedStrategy = location.state?.generatedStrategy;\n', '')
text = text.replace('const locationStrategyId = location.state?.strategyId;\n', '')
text = text.replace('const locationWorkflowType = location.state?.workflowType;\n', '')
text = text.replace('const { currentStrategy } = useStrategyStore();\n', '')

with open("src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)
