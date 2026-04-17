import os

file_path = "../client/src/pages/BacktestHistoryPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "text-[#f2f2f2]": "text-text-primary",
    "group-hover:text-[#4a9eff]": "group-hover:text-accent-blue",
    "text-[#00c896]": "text-accent-green",
    "text-[#ff5c5c]": "text-accent-red",
    "bg-[#00c896]/10": "bg-accent-green/10",
    "border-[#00c896]/20": "border-accent-green/20",
    "text-[#4a9eff]": "text-accent-blue",
    "text-[#9da1a8]": "text-text-secondary",
    "bg-[#0f0f10]/85": "bg-bg-primary/85",
    "bg-[#17181c]": "bg-bg-secondary",
    "border-white/[0.08]": "border-white/8",
    "border-white/[0.06]": "border-white/6",
    "bg-white/[0.04]": "bg-white/4",
    "hover:bg-white/[0.08]": "hover:bg-white/8",
    "hover:text-[#ff5c5c]": "hover:text-accent-red",
    "bg-[#1e1f24]": "bg-bg-card",
    "bg-[#0f0f10]": "bg-bg-primary",
    "border-white/[0.04]": "border-white/4"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in BacktestHistoryPage.")
