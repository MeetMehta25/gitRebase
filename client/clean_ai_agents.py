import re

with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# remove unused imports
text = text.replace("import React from 'react';\n", "")
text = text.replace("import { ErrorState } from \"../components/ui/ErrorState\";\n", "")
text = text.replace("  getStrategyByPrompt,\n", "")

# remove HARDCODED_CONVERSATIONS and selectHardcodedConversation
text = re.sub(r'// --- Hardcoded Conversation Data \(8 scenarios\) ---.*?const handleIntroSubmit', 'const handleIntroSubmit', text, flags=re.DOTALL)
text = re.sub(r'  const selectHardcodedConversation =.+?  // --- Render ---', '  // --- Render ---', text, flags=re.DOTALL)

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)
