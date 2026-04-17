export interface Agent {
  id: string;
  name: string;
  role: string;
  votingWeight: number;
  currentStance: string;
  isThinking: boolean;
  avatar: string;
}

export interface DebateMessage {
  id: string;
  agentId: string;
  text: string;
  timestamp: Date;
}

// Strategy Types
export interface StrategyNode {
  id: string;
  type: "trigger" | "condition" | "action";
  label: string;
  icon?: any;
  params: Record<string, any>;
}

export interface StrategyEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface Strategy {
  id: string;
  strategyId: string;
  workflowId: string; // Same as strategyId for differentiation
  ticker: string;
  timeframe: string;
  goal: string;
  riskLevel: string;
  style: string;
  nodes: StrategyNode[];
  edges: StrategyEdge[];
  entryRules: string[];
  exitRules: string[];
  indicators: string[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    agentsUsed: string[];
    debateLog: string[];
    notes?: string;
  };
  isEdited?: boolean;
}

export interface StrategyHistoryItem {
  id: string;
  strategyId: string;
  ticker: string;
  goal: string;
  riskLevel: string;
  createdAt: string;
  updatedAt: string;
}
