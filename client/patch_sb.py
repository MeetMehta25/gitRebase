import re

with open("src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

# 1. Remove mocked imports
text = re.sub(r'import\s+\{\s*STRATEGY_QUESTIONS,\s*ALL_WORKFLOWS,\s*getWorkflowNodes,\s*FALLBACK_BACKTEST,\s*getStrategyByPrompt,\s*type\s+NodePropertyConfig,\s*\}\s*from\s*"../data/strategyData";', 
              'import { type NodePropertyConfig } from "../data/strategyData";', text, flags=re.MULTILINE)

# 2. Add ErrorState import
text = text.replace('import { useStrategyStore } from "../store/strategyStore";', 
                    'import { useStrategyStore } from "../store/strategyStore";\nimport { ErrorState } from "../components/ui/ErrorState";')

# 3. Completely Rewrite StrategyHistoryPanel
start_hp = text.find('function StrategyHistoryPanel({')
end_hp = text.find('// ─── Interactive Property Panel ──────────────────────────────────────────────')
if start_hp != -1 and end_hp != -1:
    new_panel = """function StrategyHistoryPanel({
  onWorkflowSelect,
}: {
  onWorkflowSelect: (
    strategyId: number,
    workflowType: "initial" | "adversarial",
  ) => void;
}) {
  const { currentStrategy } = useStrategyStore();

  if (!currentStrategy) {
    return (
      <div className="h-full flex items-center justify-center text-white/50 text-sm">
        No strategy found in store. Please generate one first.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden p-4">
        <h3 className="text-sm font-semibold text-white mb-2">
          {currentStrategy.ticker} — {currentStrategy.goal || "Custom"}
        </h3>
        <p className="text-[11px] text-white/40 leading-relaxed mb-4">
          {currentStrategy.prompt || "No prompt provided."}
        </p>
        <button
          onClick={() => onWorkflowSelect(1, "initial")}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all text-left"
        >
          <Workflow className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">View Node Workflow</span>
        </button>
      </div>
    </div>
  );
}

"""
    text = text[:start_hp] + new_panel + text[end_hp:]

# 4. Rewrite loadWorkflow
start_lw = text.find('const loadWorkflow = useCallback(')
end_lw = text.find('  const onNodeDragStart = useCallback')
if start_lw != -1 and end_lw != -1:
    new_lw = """const loadWorkflow = useCallback(
    (strategyId: number, workflowType: "initial" | "adversarial") => {
      const { currentStrategy } = useStrategyStore.getState();
      
      const fakeNodes = [
        {
          id: "n-trigger",
          type: "strategyNode",
          position: { x: 200, y: 100 },
          data: { label: "Trigger", params: { value: "Price Action" }, properties: [] }
        },
        {
          id: "n-action",
          type: "strategyNode",
          position: { x: 200, y: 250 },
          data: { label: "Action", params: { value: "Execute Trade" }, properties: [] }
        }
      ];
      
      const fakeEdges = [
        { id: "e-1", source: "n-trigger", target: "n-action", type: "smoothstep" }
      ];

      setNodes(fakeNodes as any);
      setEdges(fakeEdges as any);
      setActiveStrategyId(1);
      setActiveWorkflowType(workflowType);
      setStrategyName(currentStrategy ? `${currentStrategy.ticker} Workflow` : "Strategy Builder");
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );
  
"""
    text = text[:start_lw] + new_lw + text[end_lw:]

text = text.replace('const fallback = FALLBACK_BACKTEST[strategyId];', 'const fallback = useStrategyStore.getState().currentStrategy;')

text = text.replace("""const q = STRATEGY_QUESTIONS.find((s) => s.id === strategyId);
    const fallback = useStrategyStore.getState().currentStrategy;

    // Navigate immediately with fallback data (no blocking API call)
    const backtestResult = {
      ...fallback,
      strategy_id: strategyId,
      ticker: q?.ticker,
      goal: q?.goal,
    };
    useStrategyStore.getState().setCurrentStrategy(backtestResult);""", 
"""const backtestResult = useStrategyStore.getState().currentStrategy;
    if (!backtestResult) return;
""")

text = text.replace('{(FALLBACK_BACKTEST[activeStrategyId || 1]?.trades || [])', '{(useStrategyStore.getState().currentStrategy?.backtest_result?.trades || [])')
text = text.replace('trades={FALLBACK_BACKTEST[activeStrategyId || 1]?.trades || []}', 'trades={useStrategyStore.getState().currentStrategy?.backtest_result?.trades || []}')

text = text.replace('data={FALLBACK_BACKTEST[activeStrategyId || 1]?.equity_curve || []}', 'data={useStrategyStore.getState().currentStrategy?.backtest_result?.equity_curve || []}')

with open("src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)
