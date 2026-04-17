import sys

with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# 1. Imports
text = text.replace('import { useStrategyStore } from "../store/strategyStore";', 
                    'import { useStrategyStore } from "../store/strategyStore";\nimport { normalizeBacktestResponse } from "../utils/normalizeBacktest";\nimport { ErrorState } from "../components/ui/ErrorState";')

text = text.replace('  FALLBACK_BACKTEST,\n', '')

# 2. Hardcoded Conversations
start_hc = text.find('// --- Hardcoded Conversation Data (8 scenarios) ---')
end_hc = text.find('export function AiAgentsPage() {')
if start_hc != -1 and end_hc != -1:
    text = text[:start_hc] + text[end_hc:]

# 3. selectHardcodedConversation
start_shc = text.find('  const selectHardcodedConversation =')
end_shc = text.find('  // Handle initial prompt submission - start summoning animation')
if start_shc != -1 and end_shc != -1:
    text = text[:start_shc] + text[end_shc:]

# 4. startDebate
start_sd = text.find('  const startDebate = async () => {')
end_sd = text.find('  // --- Render: Intro Screen ---')

start_debate_str = """  const startDebate = async () => {
    if (selectedAgentIds.length === 0) return;

    setViewMode("debate");
    setIsLoading(true);
    setError(null);
    setDebateLogs([]);

    const activeAgents = ALL_AGENTS.filter((a) =>
      selectedAgentIds.includes(a.id),
    );

    try {
      console.log("Starting backend API call...");
      const response = await fetch(
        "http://localhost:5000/api/pipeline_full",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: userGoal,
            selected_agents: selectedAgentIds,
            ticker: "RELIANCE.NS",
            timeframe: "1d",
            start_date: "2020-01-01",
            end_date: "2023-01-01"
          }),
        },
      );

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
         throw new Error(`Failed to parse server response: ${responseText.substring(0, 50)}`);
      }

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || "Backend failed to generate strategy");
      }

      const normalizedData = normalizeBacktestResponse(responseData);

      if (!normalizedData.strategy) {
         throw new Error("No strategy generated from backend.");
      }

      const debateConversation = normalizedData.debateLog || [];
      streamDebateLogs(debateConversation);
      const avgDelay = 1500 + (debateConversation.length - 1) * (3500 + 500) + 2000;
      await new Promise((resolve) => setTimeout(resolve, avgDelay));

      setIsLoading(false);
      setIsTyping(false);
      setActiveSpeakerId(null);

      useStrategyStore.getState().setCurrentStrategy({
         ...normalizedData.strategy,
         debate_agents_used: activeAgents.map((a) => a.name)
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      navigate("/strategy-results", {
        state: { 
          strategy: normalizedData.strategy,
          backtest: normalizedData.backtest,
          debateLog: normalizedData.debateLog
        },
      });

    } catch (error: any) {
      console.log("Backend API error:", error);
      setError(error.message);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

"""
if start_sd != -1 and end_sd != -1:
    text = text[:start_sd] + start_debate_str + text[end_sd:]

text = text.replace('export function AiAgentsPage() {', 'export default function AiAgentsPage() {')

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)
