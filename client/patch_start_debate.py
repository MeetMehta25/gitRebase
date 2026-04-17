import re

with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

start_debate_replacement = """  const startDebate = async () => {
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
         throw new Error(`Failed to parse server response: ${responseText[:50]}`);
      }

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || "Backend failed to generate strategy");
      }

      const normalizedData = normalizeBacktestResponse(responseData);

      if (!normalizedData.strategy) {
         throw new Error("No strategy generated from backend.");
      }

      // Stream the conversation
      const debateConversation = normalizedData.debateLog || [];
      streamDebateLogs(debateConversation);
      const avgDelay = 1500 + (debateConversation.length - 1) * (3500 + 500) + 2000;
      await new Promise((resolve) => setTimeout(resolve, avgDelay));

      setIsLoading(false);
      setIsTyping(false);
      setActiveSpeakerId(null);

      useStrategyStore.getState().setCurrentStrategy({
         ...normalizedData,
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

pattern = r"  const startDebate = async \(\) => \{.+?    \};\n\n  // --- Render"
text = re.sub(r'  const startDebate = async \(\) => \{.*?(?=  // --- Render)', start_debate_replacement + '\n\n', text, flags=re.DOTALL)

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)
