import os

file_path = "../client/src/components/backtest/ProgressLogPanel.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "border-white/[0.06]": "border-white/6",
    "text-[#9da1a8]": "text-text-secondary",
    "bg-white/[0.06]": "bg-white/6",
    "bg-gradient-to-r": "bg-linear-to-r",
    "text-[#6b7280]": "text-text-muted",
    "left-[11px]": "left-2.75",
    "bg-white/[0.08]": "bg-white/8",
    "hover:bg-white/[0.03]": "hover:bg-white/3",
    "w-[22px]": "w-5.5",
    "h-[22px]": "h-5.5",
    "border-white/[0.15]": "border-white/15",
    "ml-[34px]": "ml-8.5",
    "bg-white/[0.03]": "bg-white/3"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in ProgressLogPanel.")
