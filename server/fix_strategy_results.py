import os

file_path = "../client/src/pages/StrategyResultsPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "bg-gradient-to-b": "bg-linear-to-b",
    "border-white/[0.06]": "border-white/6",
    "bg-gradient-to-r": "bg-linear-to-r",
    "bg-gradient-to-br": "bg-linear-to-br",
    "flex-shrink-0": "shrink-0",
    "max-h-[600px]": "max-h-150"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in StrategyResultsPage.")
