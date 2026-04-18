import sys
import re

def insert_translation(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import if not present
    if "useTranslation" not in content:
        content = content.replace('import {', 'import { useTranslation } from "react-i18next";\nimport {', 1)

    # Insert hook if it's a page component
    component_name = filepath.split('/')[-1].split('.')[0]
    func_pattern = f"export function {component_name}() {{"
    
    if func_pattern in content and "const { t }" not in content:
        content = content.replace(func_pattern, f"{func_pattern}\n  const {{ t }} = useTranslation();")

    # Replace specific strings
    content = content.replace('Strategy Builder', '{t("strategy_builder")}')
    content = content.replace('AI Agents', '{t("ai_agents")}')
    # Revert if it broke className or something similar, handle strings cautiously
    # A safer way is manual replacement
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

