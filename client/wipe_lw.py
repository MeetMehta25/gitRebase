with open("src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

start_idx = text.find('  // ─── Load workflow logic ────────────────────────────────────────────────────')
end_idx = text.find('  // ─── Node interactions ──────────────────────────────────────────────────────')

new_logic = """  // ─── Load workflow logic ────────────────────────────────────────────────────
  const loadWorkflow = () => {
    const { currentStrategy } = useStrategyStore.getState();
    const fakeNodes = [
      { id: "n-trigger", type: "strategyNode", position: { x: 200, y: 100 }, data: { label: "Trigger", params: { value: "Price Action" }, properties: [] } },
      { id: "n-action", type: "strategyNode", position: { x: 200, y: 250 }, data: { label: "Action", params: { value: "Execute Trade" }, properties: [] } }
    ];
    const fakeEdges = [{ id: "e-1", source: "n-trigger", target: "n-action", type: "smoothstep" }];
    setNodes(fakeNodes as any);
    setEdges(fakeEdges as any);
    setActiveStrategyId(1);
    setActiveWorkflowType("initial");
    setStrategyName(currentStrategy ? `${currentStrategy.ticker} Strategy` : "Strategy Builder");
    setSelectedNode(null);
  };

  useEffect(() => {
    loadWorkflow();
  }, []);

"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_logic + text[end_idx:]

text = text.replace('import { type NodePropertyConfig } from "../data/strategyData";', '')
text = text.replace('const properties: NodePropertyConfig[] = data.properties || [];', 'const properties: any[] = data.properties || [];')
text = text.replace('const q = STRATEGY_QUESTIONS.find((s) => s.id === strategyId);', '')
text = text.replace('const match = getStrategyByPrompt(', '')

with open("src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)
