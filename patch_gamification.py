import os
import re

# 1. AiAgentsPage
path_ai = 'client/src/pages/AiAgentsPage.tsx'
with open(path_ai, 'r', encoding='utf-8') as f:
    ai_content = f.read()

import_hook = 'import { useProfile } from "../hooks/useProfile";\n'
if 'useProfile' not in ai_content:
    ai_content = ai_content.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\n' + import_hook)

ai_hook_call = "  const navigate = useNavigate();\n  const { addPoints } = useProfile();\n"
ai_content = ai_content.replace("  const navigate = useNavigate();", ai_hook_call)

ai_reward = """      // Store in Zustand
      useStrategyStore.getState().setCurrentStrategy(strategyData);

      addPoints(50, "Strategy Analysis Complete! Excellent start!");

      // Add completion animation
"""
ai_content = ai_content.replace("""      // Store in Zustand
      useStrategyStore.getState().setCurrentStrategy(strategyData);

      // Add completion animation
""", ai_reward)

with open(path_ai, 'w', encoding='utf-8') as f:
    f.write(ai_content)


# 2. StrategyBuilderPage
path_sb = 'client/src/pages/StrategyBuilderPage.tsx'
if os.path.exists(path_sb):
    with open(path_sb, 'r', encoding='utf-8') as f:
        sb_content = f.read()

    if 'useProfile' not in sb_content:
        sb_content = sb_content.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\n' + import_hook)

    if 'useProfile()' not in sb_content:
        # StrategyBuilderPage might already have useNavigate
        if "const navigate = useNavigate();" in sb_content:
            sb_hook_call = "  const navigate = useNavigate();\n  const { addPoints } = useProfile();\n"
            sb_content = sb_content.replace("  const navigate = useNavigate();", sb_hook_call)
        
        sb_reward = """      console.log('Compile Success:', data);
      addPoints(30, "Strategy Created Successfully!");
"""
        sb_content = sb_content.replace("      console.log('Compile Success:', data);", sb_reward)

    with open(path_sb, 'w', encoding='utf-8') as f:
        f.write(sb_content)

print("Patched gamification in pages")
