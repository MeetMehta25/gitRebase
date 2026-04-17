import os

file_path = "../client/src/components/backtest/BacktestResults.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "bg-[#17181c]/80": "bg-bg-secondary/80",
    "border-white/[0.06]": "border-white/6",
    "text-[#6b7280]": "text-text-muted",
    "text-[#00c896]": "text-accent-green",
    "text-[#ff5c5c]": "text-accent-red",
    "text-[#f2f2f2]": "text-text-primary",
    "bg-[#00c896]/10": "bg-accent-green/10",
    "bg-[#ff5c5c]/10": "bg-accent-red/10",
    "bg-[#00c896]": "bg-accent-green",
    "bg-[#17181c]/60": "bg-bg-secondary/60",
    "bg-[#17181c]": "bg-bg-secondary",
    "border-white/[0.04]": "border-white/4",
    "text-[#9da1a8]": "text-text-secondary",
    "text-[#4a9eff]": "text-accent-blue",
    "text-[#a78bfa]": "text-accent-purple",
    "text-[#f5a623]": "text-accent-amber",
    "bg-[#0f0f10]": "bg-bg-primary"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated.")
