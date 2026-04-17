with open("client/src/pages/StrategyBuilderPage.tsx", "r", encoding='utf-8') as f:
    text = f.read()

if "import { useProfile }" not in text:
    text = text.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\nimport { useProfile } from "../hooks/useProfile";\n')

# Check where addPoints is used
if "addPoints(" not in text:
    text = text.replace("console.log('Compile Success:', data);", "console.log('Compile Success:', data);\n      addPoints(30, 'Strategy Created Successfully!');")

with open("client/src/pages/StrategyBuilderPage.tsx", "w", encoding='utf-8') as f:
    f.write(text)

