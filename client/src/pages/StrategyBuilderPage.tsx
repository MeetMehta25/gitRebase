import { useProfile } from "../hooks/useProfile";
import { useCallback, useState, useRef, useEffect } from "react";
import type { DragEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import type { Connection, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";
import { StrategyNode } from "../components/flow/StrategyNode";
import { TradingViewChart } from "../components/panels/TradingViewChart";
import { useStrategyStore } from "../store/strategyStore";
import { Calendar } from "lucide-react";
import {
  Play,
  Save,
  Activity,
  Target,
  Shield,
  BarChart3,
  LineChart,
  List,
  ArrowDownUp,
  Settings2,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  STRATEGY_QUESTIONS,
  ALL_WORKFLOWS,
  getWorkflowNodes,
  FALLBACK_BACKTEST,
  getStrategyByPrompt,
  type NodePropertyConfig,
} from "../data/strategyData";

const nodeTypes = { strategyNode: StrategyNode };

const NODE_PALETTE = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Activity,
    defaultParams: { value: "Price Cross" },
  },
  {
    type: "condition",
    label: "Indicator",
    icon: BarChart3,
    defaultParams: { value: "RSI(14)" },
  },
  {
    type: "condition",
    label: "Entry Rule",
    icon: Target,
    defaultParams: { value: "RSI > 50" },
  },
  {
    type: "action",
    label: "Exit Rule",
    icon: Shield,
    defaultParams: { value: "RSI > 70" },
  },
  {
    type: "action",
    label: "Risk Mgmt",
    icon: Shield,
    defaultParams: { value: "2% Stop" },
  },
  {
    type: "action",
    label: "Order",
    icon: ArrowDownUp,
    defaultParams: { value: "Market Buy" },
  },
];

// ─── History Panel ───────────────────────────────────────────────────────────
function StrategyHistoryPanel({
  onWorkflowSelect,
}: {
  onWorkflowSelect: (
    strategyId: number,
    workflowType: "initial" | "adversarial",
  ) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 p-2">
        {STRATEGY_QUESTIONS.map((q) => {
          const workflows = ALL_WORKFLOWS.filter((w) => w.strategyId === q.id);
          const isExpanded = expandedId === q.id;
          const fb = FALLBACK_BACKTEST[q.id];
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: q.id * 0.05 }}
              className="bg-white/3 border border-white/6 rounded-xl overflow-hidden hover:border-white/10 transition-all"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-400 tracking-widest">
                    STRATEGY {q.id}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded",
                      fb.metrics.risk_adjusted.sharpe_ratio > 1.5
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400",
                    )}
                  >
                    Sharpe {fb.metrics.risk_adjusted.sharpe_ratio}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {q.short_name}
                </h3>
                <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
                  {q.prompt}
                </p>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-white/30">
                  <span>{q.ticker}</span>
                  <span>•</span>
                  <span>{q.risk_level}</span>
                  <span>•</span>
                  <span>{fb.metrics.trade_stats.total_trades} trades</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {workflows
                    .filter((wf) => wf.workflowType === "initial")
                    .map((wf) => (
                      <button
                        key={`${wf.strategyId}-${wf.workflowType}`}
                        onClick={() =>
                          onWorkflowSelect(wf.strategyId, wf.workflowType)
                        }
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 transition-all text-left group"
                      >
                        <Workflow className="w-4 h-4 text-white/30 group-hover:text-purple-400 shrink-0 transition-colors" />
                        <div>
                          <div className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">
                            Initial Strategy
                          </div>
                          <div className="text-[10px] text-white/30">
                            {wf.nodes.length} nodes
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Interactive Property Panel ──────────────────────────────────────────────
function PropertyPanel({
  selectedNode,
  onPropertyChange,
}: {
  selectedNode: Node | null;
  onPropertyChange: (nodeId: string, key: string, value: any) => void;
}) {
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30 p-6 text-center">
        <Settings2 className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">Select a node to configure its properties.</p>
      </div>
    );
  }

  const { data } = selectedNode;
  const properties: NodePropertyConfig[] = data.properties || [];
  const params = data.params || {};

  // If we have structured property configs, use them; otherwise fall back to raw params
  const hasStructuredProps = properties.length > 0;

  return (
    <div className="p-5 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Node Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div
          className={cn(
            "p-2 rounded-lg bg-black/40 border border-white/5",
            data.type === "trigger"
              ? "text-emerald-400"
              : data.type === "condition"
                ? "text-amber-400"
                : "text-blue-400",
          )}
        >
          {data.icon && <data.icon className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{data.label}</h3>
          <p className="text-[10px] text-white/50 uppercase tracking-widest">
            {data.type} Node
          </p>
        </div>
      </div>

      <h4 className="text-xs font-medium flex items-center gap-2 text-white/60">
        <SlidersHorizontal className="w-3.5 h-3.5" /> Parameters
      </h4>

      {/* Structured Properties */}
      {hasStructuredProps ? (
        <div className="flex flex-col gap-4">
          {properties.map((prop) => {
            const val = params[prop.key] ?? prop.default;
            return (
              <div key={prop.key} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider flex items-center justify-between">
                  <span>{prop.label}</span>
                  {prop.type === "slider" && (
                    <span className="text-white/80 font-mono text-xs">
                      {val}
                      {prop.suffix || ""}
                    </span>
                  )}
                </label>

                {prop.type === "slider" && (
                  <input
                    type="range"
                    min={prop.min}
                    max={prop.max}
                    step={prop.step}
                    value={val as number}
                    onChange={(e) =>
                      onPropertyChange(
                        selectedNode.id,
                        prop.key,
                        Number(e.target.value),
                      )
                    }
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                )}

                {prop.type === "dropdown" && (
                  <select
                    value={val as string}
                    onChange={(e) =>
                      onPropertyChange(
                        selectedNode.id,
                        prop.key,
                        e.target.value,
                      )
                    }
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors appearance-none"
                  >
                    {prop.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}

                {prop.type === "toggle" && (
                  <button
                    onClick={() =>
                      onPropertyChange(selectedNode.id, prop.key, !val)
                    }
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                      val
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                        : "bg-white/5 border-white/10 text-white/40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full transition-colors",
                        val ? "bg-purple-500" : "bg-white/20",
                      )}
                    />
                    {val ? "Enabled" : "Disabled"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Fallback: raw params editing
        <div className="flex flex-col gap-4">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                {key}
              </label>
              {typeof value === "number" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={
                      key === "threshold" ? 100 : key === "period" ? 200 : 1000
                    }
                    value={value}
                    onChange={(e) =>
                      onPropertyChange(
                        selectedNode.id,
                        key,
                        Number(e.target.value),
                      )
                    }
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-xs text-white/80 font-mono w-12 text-right">
                    {value}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) =>
                    onPropertyChange(selectedNode.id, key, e.target.value)
                  }
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main StrategyFlow Component ─────────────────────────────────────────────
function StrategyFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { addPoints } = useProfile();


  // Strategy sources: location state, Zustand store
  const generatedStrategy = location.state?.generatedStrategy;
  const locationStrategyId = location.state?.strategyId;
  const locationWorkflowType = location.state?.workflowType;
  const { currentStrategy } = useStrategyStore();

  // Active strategy tracking
  const [activeStrategyId, setActiveStrategyId] = useState<number | null>(null);
  const [activeWorkflowType, setActiveWorkflowType] = useState<
    "initial" | "adversarial"
  >("initial");
  const [strategyName, setStrategyName] = useState("Strategy Builder");

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Bottom panel
  const [activeBottomTab, setActiveBottomTab] = useState<
    "chart" | "history" | "trades"
  >("chart");
  const [bottomPanelHeight, setBottomPanelHeight] = useState(280);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  // ─── Load workflow logic ────────────────────────────────────────────────────
  const loadWorkflow = useCallback(
    (strategyId: number, workflowType: "initial" | "adversarial") => {
      const { nodes: wfNodes, edges: wfEdges } = getWorkflowNodes(
        strategyId,
        workflowType,
      );
      if (wfNodes.length > 0) {
        setNodes(wfNodes);
        setEdges(wfEdges);
        setActiveStrategyId(strategyId);
        setActiveWorkflowType(workflowType);
        const q = STRATEGY_QUESTIONS.find((s) => s.id === strategyId);
        setStrategyName(
          q
            ? `${q.short_name} — ${workflowType === "initial" ? "Initial" : "Modified"}`
            : "Strategy Builder",
        );
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges],
  );

  // On mount: determine which workflow to show
  useEffect(() => {
    // Priority: location state strategyId > generatedStrategy match > first strategy
    if (locationStrategyId) {
      loadWorkflow(locationStrategyId, locationWorkflowType || "initial");
    } else if (generatedStrategy) {
      // Try to match to one of our 4 strategies
      const match = getStrategyByPrompt(
        generatedStrategy.prompt || generatedStrategy.ticker || "",
      );
      if (match) {
        loadWorkflow(match.id, "initial");
      } else {
        loadWorkflow(1, "initial");
      }
    } else if (currentStrategy) {
      const match = getStrategyByPrompt(
        (currentStrategy as any).prompt ||
          (currentStrategy as any).ticker ||
          "",
      );
      if (match) {
        loadWorkflow(match.id, "initial");
      }
    } else {
      // Default: load strategy 1
      loadWorkflow(1, "initial");
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Node interactions ──────────────────────────────────────────────────────
  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#fff", strokeWidth: 2, opacity: 0.5 },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow/type");
      const label = event.dataTransfer.getData("application/reactflow/label");
      const paramsStr = event.dataTransfer.getData(
        "application/reactflow/params",
      );
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const icon =
        NODE_PALETTE.find((n) => n.label === label)?.icon || Activity;
      const params = paramsStr ? JSON.parse(paramsStr) : {};

      setNodes((nds) =>
        nds.concat({
          id: `node_${Date.now()}`,
          type: "strategyNode",
          position,
          data: { label, type, icon, params, properties: [] },
        }),
      );
    },
    [screenToFlowPosition, setNodes],
  );

  const onNodeClick = useCallback(
    (_: any, node: Node) => setSelectedNode(node),
    [],
  );
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onPropertyChange = useCallback(
    (nodeId: string, key: string, value: any) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            const updated = {
              ...n,
              data: { ...n.data, params: { ...n.data.params, [key]: value } },
            };
            setSelectedNode(updated);
            return updated;
          }
          return n;
        }),
      );
    },
    [setNodes],
  );

  // ─── Run Backtest handler ───────────────────────────────────────────────────
  const handleRunBacktest = useCallback(async () => {
    const strategyId = activeStrategyId || 1;
    const q = STRATEGY_QUESTIONS.find((s) => s.id === strategyId);
    const fallback = FALLBACK_BACKTEST[strategyId];

    // Navigate immediately with fallback data (no blocking API call)
    const backtestResult = {
      ...fallback,
      strategy_id: strategyId,
      ticker: q?.ticker,
      goal: q?.goal,
    };
    useStrategyStore.getState().setCurrentStrategy(backtestResult);
    addPoints(30, 'Strategy Selected for Backtest! Good luck.');

    navigate("/backtest-run-1", {
      state: {
        strategy: backtestResult,
        strategyId,
        backtestResult,
      },
    });
  }, [activeStrategyId, navigate]);

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] text-white">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0 flex items-center px-6 justify-between z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Strategy Builder
          </h1>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm text-white/50">{strategyName}</span>
          {activeStrategyId && (
            <span className="text-[10px] font-mono text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              ID: {activeStrategyId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Workflow toggle */}
          {activeStrategyId && activeWorkflowType === "adversarial" && (
            <div className="flex bg-white/5 rounded-lg border border-white/5 overflow-hidden">
              <span className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white">
                Modified
              </span>
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/5">
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={handleRunBacktest}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-sm font-medium shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          >
            <Play className="w-4 h-4" /> Run Backtest
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Left Palette */}
        <div className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col z-10">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Node Palette
            </h2>
          </div>
          <div className="p-3 flex flex-col gap-2 overflow-y-auto">
            {NODE_PALETTE.map((node, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/reactflow/type",
                    node.type,
                  );
                  e.dataTransfer.setData(
                    "application/reactflow/label",
                    node.label,
                  );
                  e.dataTransfer.setData(
                    "application/reactflow/params",
                    JSON.stringify(node.defaultParams),
                  );
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all duration-200"
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg bg-black/40 border border-white/5",
                    node.type === "trigger"
                      ? "text-emerald-400"
                      : node.type === "condition"
                        ? "text-amber-400"
                        : "text-blue-400",
                  )}
                >
                  <node.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                    {node.type}
                  </div>
                  <div className="text-xs font-medium">{node.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={() => {}}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-transparent"
          >
            <Background
              color="#ffffff"
              gap={24}
              size={1}
              className="opacity-5"
            />
            <Controls className="bg-black/40 border-white/10 fill-white" />
          </ReactFlow>
        </div>

        {/* Right Properties Panel */}
        <div className="w-80 border-l border-white/5 bg-black/20 backdrop-blur-md flex flex-col z-10">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Properties
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <PropertyPanel
              selectedNode={selectedNode}
              onPropertyChange={onPropertyChange}
            />
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div
        className="border-t border-white/10 bg-black/60 backdrop-blur-2xl flex flex-col z-20 relative"
        style={{ height: bottomPanelHeight }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1.5 -mt-0.75 cursor-row-resize z-30 hover:bg-purple-500/50 transition-colors"
          onMouseDown={() => setIsDraggingPanel(true)}
        />

        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/5">
          <button
            onClick={() => setActiveBottomTab("history")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
              activeBottomTab === "history"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/80 hover:bg-white/5",
            )}
          >
            <Calendar className="w-3.5 h-3.5" /> History
          </button>
          <button
            onClick={() => setActiveBottomTab("chart")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
              activeBottomTab === "chart"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/80 hover:bg-white/5",
            )}
          >
            <LineChart className="w-3.5 h-3.5" /> Chart
          </button>
          <button
            onClick={() => setActiveBottomTab("trades")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
              activeBottomTab === "trades"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/80 hover:bg-white/5",
            )}
          >
            <List className="w-3.5 h-3.5" /> Trades
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {activeBottomTab === "history" && (
            <StrategyHistoryPanel onWorkflowSelect={loadWorkflow} />
          )}
          {activeBottomTab === "chart" && (
            <div className="h-full w-full">
              <TradingViewChart />
            </div>
          )}
          {activeBottomTab === "trades" && (
            <div className="h-full overflow-y-auto rounded-xl border border-white/10 bg-black/40">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Trade #</th>
                    <th className="px-4 py-3 font-medium">Entry</th>
                    <th className="px-4 py-3 font-medium">Exit</th>
                    <th className="px-4 py-3 font-medium">Entry $</th>
                    <th className="px-4 py-3 font-medium">Exit $</th>
                    <th className="px-4 py-3 font-medium">P&L</th>
                    <th className="px-4 py-3 font-medium">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(FALLBACK_BACKTEST[activeStrategyId || 1]?.trades || [])
                    .slice(0, 10)
                    .map((t: any) => (
                      <tr
                        key={t.trade_id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-white/80 font-mono text-xs">
                          #{t.trade_id}
                        </td>
                        <td className="px-4 py-2.5 text-white/60 text-xs">
                          {t.entry_date}
                        </td>
                        <td className="px-4 py-2.5 text-white/60 text-xs">
                          {t.exit_date}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">
                          ${t.entry_price}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">
                          ${t.exit_price}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2.5 font-mono text-xs font-medium",
                            t.pnl >= 0 ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-white/40 text-xs">
                          {t.holding_days}d
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Resize overlay */}
      {isDraggingPanel && (
        <div
          className="fixed inset-0 z-50 cursor-row-resize"
          onMouseMove={(e) =>
            setBottomPanelHeight(
              Math.max(
                100,
                Math.min(
                  window.innerHeight - e.clientY,
                  window.innerHeight - 200,
                ),
              ),
            )
          }
          onMouseUp={() => setIsDraggingPanel(false)}
          onMouseLeave={() => setIsDraggingPanel(false)}
        />
      )}
    </div>
  );
}

export function StrategyBuilderPage() {
  return (
    <ReactFlowProvider>
      <StrategyFlow />
    </ReactFlowProvider>
  );
}
