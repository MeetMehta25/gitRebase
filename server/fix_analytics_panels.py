import os

file_path = "../client/src/components/panels/AnalyticsPanels.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "bg-[#1e1f24]": "bg-bg-card",
    "border-white/[0.06]": "border-white/6",
    "text-[#ff5c5c]": "text-accent-red",
    "text-[#9da1a8]": "text-text-secondary",
    "bg-[#17181c]": "bg-bg-secondary",
    "border-white/[0.04]": "border-white/4",
    "hover:border-white/[0.08]": "hover:border-white/8",
    "text-[#f2f2f2]": "text-text-primary",
    "text-[#f5a623]": "text-accent-amber",
    "bg-[#00c896]/10": "bg-accent-green/10",
    "text-[#00c896]": "text-accent-green",
    "border-[#00c896]/20": "border-accent-green/20"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in AnalyticsPanels.")
