with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# 1. Imports
text = text.replace('import { useStrategyStore } from "../store/strategyStore";', 
                    'import { useStrategyStore } from "../store/strategyStore";\nimport { normalizeBacktestResponse } from "../utils/normalizeBacktest";\nimport { ErrorState } from "../components/ui/ErrorState";')

# Remove fallback imports
text = text.replace('  FALLBACK_BACKTEST,\n', '')
text = text.replace('  FALLBACK_BACKTEST,', '')

# Remove HARDCODED_CONVERSATIONS completely by parsing lines
import sys

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
  };"""

lines = text.split('\n')
new_lines = []
skip = False
for i, line in enumerate(lines):
    if "const HARDCODED_CONVERSATIONS =" in line:
        skip = True
    if skip and "export function AiAgentsPage() {" in line:
        skip = False

    if "const selectHardcodedConversation =" in line:
        skip = True
    if skip and "const startDebate =" in line:
        skip = False

    # Once we hit startDebate, skip until `// --- Render`
    if "const startDebate = async () => {" in line:
        new_lines.append(start_debate_str)
        skip = True
        
    if skip and "// --- Render: Intro Screen ---" in line:
        skip = False
        
    if not skip:
        new_lines.append(line)

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write("\n".join(new_lines))
