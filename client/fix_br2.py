import re
with open("src/pages/BacktestRunPage1.tsx", "r") as f:
    t = f.read()

t = t.replace('{ id: "e1",', '{ type: "action", id: "e1",')
t = t.replace('{ id: "e2",', '{ type: "action", id: "e2",')
t = t.replace('{ id: "e3",', '{ type: "action", id: "e3",')
t = t.replace('{ id: "e4",', '{ type: "action", id: "e4",')
t = t.replace('{ id: "e5",', '{ type: "action", id: "e5",')

# Completely nuke the getStrategyByName block
t = re.sub(r'const strategyId =\s+location\.state\?\.strategyId \|\|[^;]+;|const strategyId =[^;]+getStrategyByPrompt[^;]+;', 'const strategyId = location.state?.strategyId || 1;', t)

with open("src/pages/BacktestRunPage1.tsx", "w") as f:
    f.write(t)
