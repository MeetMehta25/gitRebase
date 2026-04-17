import os

file_path = "../client/src/components/backtest/ChartsPanel.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "border-white/[0.06]": "border-white/6",
    "bg-white/[0.02]": "bg-white/2",
    "text-[#6b7280]": "text-text-muted",
    "text-[#9da1a8]": "text-text-secondary"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in ChartsPanel.")
