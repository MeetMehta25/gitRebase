import os

file_path = "../client/src/pages/StrategyBuilderPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "bg-white/[0.03]": "bg-white/3",
    "border-white/[0.06]": "border-white/6",
    "-mt-[3px]": "-mt-0.75"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in StrategyBuilderPage.")
