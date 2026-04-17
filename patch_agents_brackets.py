with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    content = f.read()

target = """              // Navigate directly to the results page using backend payload
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
              } else {"""

replacement = """              // Navigate directly to the results page using backend payload
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
            } else {"""

if target in content:
    content = content.replace(target, replacement)
    with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
        f.write(content)
    print("Fixed bracket mismatch")
else:
    print("Target not found. Will try another.")

