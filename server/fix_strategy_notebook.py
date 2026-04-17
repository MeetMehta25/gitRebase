import os

file_path = "../client/src/pages/StrategyNotebookSandbox.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "min-h-[120px]": "min-h-30"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in StrategyNotebookSandbox.")
