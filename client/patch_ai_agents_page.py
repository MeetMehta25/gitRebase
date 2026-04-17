with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# 1. Imports
text = text.replace('import { useStrategyStore } from "../store/strategyStore";', 
                    'import { useStrategyStore } from "../store/strategyStore";\nimport { normalizeBacktestResponse } from "../utils/normalizeBacktest";\nimport { ErrorState } from "../components/ui/ErrorState";')

# Remove fallback imports
text = text.replace('  FALLBACK_BACKTEST,\n', '')

# Remove HARDCODED_CONVERSATIONS safely
import re
text = re.sub(r'// --- Hardcoded Conversation Data \(8 scenarios\) ---.+?export default function AiAgentsPage', 'export default function AiAgentsPage', text, flags=re.DOTALL)

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)
