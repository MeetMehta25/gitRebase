import re

with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    content = f.read()

target = """            body: JSON.stringify({ 
              prompt: userGoal,
              initial_capital: 100000,
              selected_agents: selectedAgentIds
            }),"""

replacement = """            body: JSON.stringify({ 
              prompt: userGoal,
              ticker: ticker || undefined,
              timeframe: timeframe || undefined,
              start_date: startDate || undefined,
              end_date: endDate || undefined,
              initial_capital: 100000,
              selected_agents: selectedAgentIds
            }),"""

content = content.replace(target, replacement)

with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(content)

