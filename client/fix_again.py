with open("client/src/pages/StrategyBuilderPage.tsx", "r", encoding='utf-8') as f:
    text = f.read()

import re

# Remove any unused 'const { addPoints } = useProfile();' if there's no matching import
if 'import { useProfile }' not in text:
    text = text.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport { useProfile } from '../hooks/useProfile';")

    text = text.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\nimport { useProfile } from "../hooks/useProfile";') 


# Try to add points to compilation success function
target = "console.log('Compile Success:', data);"
replacement = "console.log('Compile Success:', data);\n      addPoints(30, 'Strategy Created Successfully!');"
if replacement not in text:
    text = text.replace(target, replacement)

with open("client/src/pages/StrategyBuilderPage.tsx", "w", encoding='utf-8') as f:
    f.write(text)

