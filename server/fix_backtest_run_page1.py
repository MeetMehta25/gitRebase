import os

file_path = "../client/src/pages/BacktestRunPage1.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "text-[#9da1a8]": "text-text-secondary",
    "bg-white/[0.02]": "bg-white/2",
    "bg-[#00c896]": "bg-accent-green",
    "text-[#00c896]": "text-accent-green",
    "bg-gradient-to-r": "bg-linear-to-r",
    "from-[#00c896]": "from-accent-green",
    "bg-[#00c896]/40": "bg-accent-green/40",
    "border-white/[0.06]": "border-white/6",
    "bg-white/[0.06]": "bg-white/6",
    "from-[#4a9eff]": "from-accent-blue",
    "to-[#00c896]": "to-accent-green",
    "text-[#6b7280]": "text-text-muted",
    "text-[#f2f2f2]": "text-text-primary",
    "text-[#00c896]/90": "text-accent-green/90",
    "border-[#00c896]/30": "border-accent-green/30",
    "via-[#00c896]": "via-accent-green",
    "text-[#4a9eff]": "text-accent-blue"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in BacktestRunPage1.")
