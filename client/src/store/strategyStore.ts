import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Strategy, StrategyHistoryItem } from "../types";

interface StrategyStore {
  // Current strategy state
  currentStrategy: Strategy | null;
  allStrategies: Strategy[];
  strategyHistory: StrategyHistoryItem[];

  // Actions
  setCurrentStrategy: (strategy: Strategy) => void;
  saveStrategy: (strategy: Strategy) => Promise<string>; // Returns strategyId
  updateStrategy: (
    strategyId: string,
    updates: Partial<Strategy>,
  ) => Promise<void>;
  fetchStrategyHistory: () => Promise<void>;
  loadStrategyById: (strategyId: string) => Promise<Strategy | null>;
  addStrategyToHistory: (strategy: Strategy) => void;
  deleteStrategy: (strategyId: string) => Promise<void>;
  clearCurrentStrategy: () => void;

  // Node editing
  updateNodeParams: (nodeId: string, params: Record<string, any>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;

  // UI Workflow Editor Saver
  savedWorkflows: Record<string, { nodes: any[]; edges: any[] }>;
  saveWorkflow: (strategyId: number, workflowType: string, nodes: any[], edges: any[]) => void;
}

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set) => ({
      // Initial state
      currentStrategy: null,
      allStrategies: [],
      strategyHistory: [],
      savedWorkflows: {},

      // Action: Set current strategy
      setCurrentStrategy: (strategy: Strategy) => {
        set({ currentStrategy: strategy });
      },

      // Action: Save strategy to backend
      saveStrategy: async (strategy: Strategy): Promise<string> => {
        const strategyId = strategy.strategyId || `strategy_${Date.now()}`;
        const workflowId = strategyId;

        const payload = {
          ...strategy,
          strategyId,
          workflowId,
          metadata: {
            ...strategy.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        try {
          const response = await fetch("http://localhost:5000/api/strategies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Failed to save strategy: ${response.statusText}`);
          }

          const data = await response.json();
          const savedStrategyId = data.data?._id || strategyId;

          // Update local state
          set((state) => ({
            currentStrategy: {
              ...payload,
              strategyId: savedStrategyId,
              workflowId: savedStrategyId,
            },
            allStrategies: [
              ...state.allStrategies.filter(
                (s) => s.strategyId !== savedStrategyId,
              ),
              {
                ...payload,
                strategyId: savedStrategyId,
                workflowId: savedStrategyId,
              },
            ],
          }));

          return savedStrategyId;
        } catch (error) {
          console.error("Error saving strategy:", error);
          throw error;
        }
      },

      // Action: Update strategy
      updateStrategy: async (
        strategyId: string,
        updates: Partial<Strategy>,
      ) => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/strategies/${strategyId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...updates,
                metadata: {
                  ...(updates.metadata || {}),
                  updatedAt: new Date().toISOString(),
                },
              }),
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to update strategy: ${response.statusText}`,
            );
          }

          set((state) => ({
            currentStrategy: state.currentStrategy
              ? { ...state.currentStrategy, ...updates, isEdited: false }
              : null,
            allStrategies: state.allStrategies.map((s) =>
              s.strategyId === strategyId ? { ...s, ...updates } : s,
            ),
          }));
        } catch (error) {
          console.error("Error updating strategy:", error);
          throw error;
        }
      },

      // Action: Fetch strategy history from backend
      fetchStrategyHistory: async () => {
        try {
          console.log("fetchStrategyHistory: Calling API...");
          const response = await fetch(
            "http://localhost:5000/api/strategies/history",
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.statusText}`);
          }

          const data = await response.json();
          const history = data.data || [];

          console.log(
            "fetchStrategyHistory: Got",
            history.length,
            "strategies from server",
          );
          history.forEach((s: any) =>
            console.log("  -", s.ticker, s._id || s.id),
          );

          set({ strategyHistory: history });
        } catch (error) {
          console.error("Error fetching strategy history:", error);
          set({ strategyHistory: [] });
        }
      },

      // Action: Load strategy by ID
      loadStrategyById: async (
        strategyId: string,
      ): Promise<Strategy | null> => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/strategies/${strategyId}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to load strategy: ${response.statusText}`);
          }

          const data = await response.json();
          const strategy = data.data;

          if (strategy) {
            set({ currentStrategy: strategy });
          }

          return strategy || null;
        } catch (error) {
          console.error("Error loading strategy:", error);
          return null;
        }
      },

      // Action: Add strategy to history (local)
      addStrategyToHistory: (strategy: Strategy) => {
        const historyItem: StrategyHistoryItem = {
          id: strategy.id,
          strategyId: strategy.strategyId,
          ticker: strategy.ticker,
          goal: strategy.goal,
          riskLevel: strategy.riskLevel,
          createdAt: strategy.metadata.createdAt,
          updatedAt: strategy.metadata.updatedAt,
        };

        set((state) => ({
          strategyHistory: [
            historyItem,
            ...state.strategyHistory.filter(
              (h) => h.strategyId !== strategy.strategyId,
            ),
          ],
        }));
      },

      // Action: Delete strategy
      deleteStrategy: async (strategyId: string) => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/strategies/${strategyId}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to delete strategy: ${response.statusText}`,
            );
          }

          set((state) => ({
            currentStrategy:
              state.currentStrategy?.strategyId === strategyId
                ? null
                : state.currentStrategy,
            allStrategies: state.allStrategies.filter(
              (s) => s.strategyId !== strategyId,
            ),
            strategyHistory: state.strategyHistory.filter(
              (h) => h.strategyId !== strategyId,
            ),
          }));
        } catch (error) {
          console.error("Error deleting strategy:", error);
          throw error;
        }
      },

      // Action: Clear current strategy
      clearCurrentStrategy: () => {
        set({ currentStrategy: null });
      },

      // Action: Update node params (for builder editing)
      updateNodeParams: (nodeId: string, params: Record<string, any>) => {
        set((state) => {
          if (!state.currentStrategy) return state;

          return {
            currentStrategy: {
              ...state.currentStrategy,
              nodes: state.currentStrategy.nodes.map((node) =>
                node.id === nodeId
                  ? { ...node, params: { ...node.params, ...params } }
                  : node,
              ),
              isEdited: true,
              metadata: {
                ...state.currentStrategy.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      // Action: Update node label
      updateNodeLabel: (nodeId: string, label: string) => {
        set((state) => {
          if (!state.currentStrategy) return state;

          return {
            currentStrategy: {
              ...state.currentStrategy,
              nodes: state.currentStrategy.nodes.map((node) =>
                node.id === nodeId ? { ...node, label } : node,
              ),
              isEdited: true,
              metadata: {
                ...state.currentStrategy.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      saveWorkflow: (strategyId: number, workflowType: string, nodes: any[], edges: any[]) => {
        set((state) => ({
          savedWorkflows: {
            ...state.savedWorkflows,
            [`${strategyId}-${workflowType}`]: { nodes, edges }
          }
        }));
      },
    }),
    {
      name: "strategy-store",
      partialize: (state) => ({
        currentStrategy: state.currentStrategy,
        allStrategies: state.allStrategies,
        strategyHistory: state.strategyHistory,
        savedWorkflows: state.savedWorkflows,
      }),
    },
  ),
);
