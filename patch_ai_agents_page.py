import re

with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    content = f.read()

# 1. Remove fallback import
content = re.sub(
    r"\s*FALLBACK_BACKTEST,\s*",
    "\n",
    content
)

content = re.sub(
    r"\s*HARDCODED_CONVERSATIONS,\s*",
    "\n",
    content
)

# 2. Modify the API response handling
target = """          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log("Backend API successful!");
              console.log("🔥 RAW API RESPONSE: ", data);
              
              // Wait for visual effect
              await new Promise((resolve) => setTimeout(resolve, 800));
              setIsTyping(false);
              
              strategyData = { ...data.data, source: "backend" };
              
              console.log("🔥 debate_log: ", strategyData.debate_log);
              
              setDebateLogs(
                (strategyData.debate_log || []).map((log: any, idx: number) => {
                  const messageText = typeof log === "string" ? log : (log.content || log.message);
                  return {
                    id: `bk-${idx}`,
                    agentId: typeof log === "string" ? undefined : log.agent,
                    message: messageText || "",
                    timestamp: Date.now() + idx * 5,
                  };
                }),
              );
                
              useStrategyStore.getState().setCurrentStrategy(strategyData);
              
              // Navigate directly to the results page using backend payload
              setTimeout(() => {
                  navigate("/strategy-results", {
                      state: {
                          strategy: strategyData,
                          strategyId: strategyData.strategy_id || strategyData.id,
                          agents: activeAgents.map((a) => ({
                              id: a.id,
                              name: a.name,
                              role: a.role,
                          })),
                      },
                  });
              }, 1500);
              return; // Exit early since we used the backend API
            }
          }
        // If no conversation was set, use hardcoded one
        if (!debateConversation || debateConversation.length === 0) {
          debateConversation = selectHardcodedConversation(userGoal);
        }

        // Stream the conversation (from backend or hardcoded) with realistic timing
        streamDebateLogs(debateConversation);

        // Calculate and wait for logs to finish streaming (with increased delays)
        // First message: 1500ms, subsequent: 2500-4500ms, plus 500ms highlight each
        const avgDelay =
          1500 + (debateConversation.length - 1) * (3500 + 500) + 2000; // Extra 2s buffer

        await new Promise((resolve) => setTimeout(resolve, avgDelay));

        setIsLoading(false);
        setIsTyping(false);
        setActiveSpeakerId(null);

        // If backend didn't provide strategy data, create one
        if (!strategyData) {
          const matchedStrategy = getStrategyByPrompt(userGoal);
          const strategyId = matchedStrategy?.id || 1;

          strategyData = {
            ...FALLBACK_BACKTEST[strategyId],
            strategy_id: `debate-${Date.now()}`,
            ticker: matchedStrategy?.ticker || "RELIANCE.NS",
            goal: matchedStrategy?.goal || "momentum",
            risk_level: matchedStrategy?.risk_level || "moderate",
            prompt: userGoal,
            strategy_from_debate: {
              strategy_name: matchedStrategy?.short_name || "Generated Strategy",
              indicators:
                FALLBACK_BACKTEST[strategyId]?.summary?.indicators_used || [],
              entry_conditions: [{ indicator: "RSI", operator: "<", value: 30 }],
              exit_conditions: [{ indicator: "RSI", operator: ">", value: 70 }],
            },
            debate_agents_used: activeAgents.map((a) => a.name),
            debate_log: debateConversation,
          };
        }

        // Store in Zustand
        useStrategyStore.getState().setCurrentStrategy(strategyData);

        // Add completion animation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Navigate to strategy results page
        navigate("/strategy-results", {
          state: {
            strategy: strategyData,
            strategyId: strategyData.strategy_id,
            agents: activeAgents.map((a) => ({
              id: a.id,
              name: a.name,
              role: a.role,
            })),
          },
        });
      } catch (err: any) {
        console.error("Error running debate:", err);
        setError(err.message || "Failed to generate strategy");
        setIsLoading(false);
        setIsTyping(false);
        // We do NOT use fallback data here. Stop the process.
      }
    };"""

replacement = """          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log("Backend API successful!");
              
              await new Promise((resolve) => setTimeout(resolve, 800));
              setIsTyping(false);
              
              const fetchedStrategy = { ...data.data, source: "backend" };
              
              setDebateLogs(
                (fetchedStrategy.debate_log || []).map((log: any, idx: number) => {
                  const messageText = typeof log === "string" ? log : (log.content || log.message);
                  return {
                    id: `bk-${idx}`,
                    agentId: typeof log === "string" ? undefined : log.agent,
                    message: messageText || "",
                    timestamp: Date.now() + idx * 5,
                  };
                }),
              );
                
              useStrategyStore.getState().setCurrentStrategy(fetchedStrategy);
              
              setTimeout(() => {
                  navigate("/strategy-results", {
                      state: {
                          strategy: fetchedStrategy,
                          strategyId: fetchedStrategy.strategy_id || fetchedStrategy.id,
                          agents: activeAgents.map((a) => ({
                              id: a.id,
                              name: a.name,
                              role: a.role,
                          })),
                      },
                  });
              }, 1500);
            } else {
                throw new Error(data.error || "Backend failed to generate strategy");
            }
          } else {
              throw new Error("API request failed with status: " + response.status);
          }
      } catch (err: any) {
        console.error("Error running debate:", err);
        setError(err.message || "Failed to generate strategy");
        setIsLoading(false);
        setIsTyping(false);
      }
    };"""

content = content.replace(target, replacement)

# 3. Clean up selectHardcodedConversation method definition as well
target_hardcoded = """    // Select hardcoded conversation based on user goal keywords
    const selectHardcodedConversation = (goal: string): string[] => {
      const lowerGoal = goal.toLowerCase();

      // Try to match to specific conversation types
      if (
        lowerGoal.includes("scalp") ||
        lowerGoal.includes("day trade") ||
        lowerGoal.includes("short-term") ||
        lowerGoal.includes("quick")
      ) {
        return HARDCODED_CONVERSATIONS["scalping_short_term"];
      } else if (
        lowerGoal.includes("swing") ||
        lowerGoal.includes("3-7 day") ||
        lowerGoal.includes("hold")
      ) {
        return HARDCODED_CONVERSATIONS["swing_trading"];
      } else if (
        lowerGoal.includes("range") ||
        lowerGoal.includes("consolidat") ||
        lowerGoal.includes("bound")
      ) {
        return HARDCODED_CONVERSATIONS["range_bound_trading"];
      } else if (
        lowerGoal.includes("crypto") ||
        lowerGoal.includes("bitcoin") ||
        lowerGoal.includes("eth") ||
        lowerGoal.includes("btc") ||
        lowerGoal.includes("24/7")
      ) {
        return HARDCODED_CONVERSATIONS["crypto_momentum"];
      } else if (
        lowerGoal.includes("dividend") ||
        lowerGoal.includes("yield") ||
        lowerGoal.includes("income")
      ) {
        return HARDCODED_CONVERSATIONS["dividend_capture"];
      } else if (
        lowerGoal.includes("options") ||
        lowerGoal.includes("straddle") ||
        lowerGoal.includes("strangle") ||
        lowerGoal.includes("iron condor")
      ) {
        return HARDCODED_CONVERSATIONS["options_volatility"];
      } else if (
        lowerGoal.includes("breakout") ||
        lowerGoal.includes("resistance") ||
        lowerGoal.includes("support")
      ) {
        return HARDCODED_CONVERSATIONS["breakout_strategy"];
      } else if (
        lowerGoal.includes("sentiment") ||
        lowerGoal.includes("news") ||
        lowerGoal.includes("flow") ||
        lowerGoal.includes("macro")
      ) {
        return HARDCODED_CONVERSATIONS["market_sentiment"];
      }

      // Default to bull momentum
      return HARDCODED_CONVERSATIONS["bull_momentum"];
    };"""

content = content.replace(target_hardcoded, "")

with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(content)

