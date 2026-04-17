import os

file_path = "../client/src/components/debate/DebateTheater.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "bg-[#1e1f24]/90": "bg-bg-card/90",
    "bg-[#1e1f24]": "bg-bg-card",
    "border-white/[0.06]": "border-white/6",
    "border-[#00c896]/20": "border-accent-green/20",
    "text-[#9da1a8]/40": "text-text-secondary/40",
    "text-[#9da1a8]": "text-text-secondary",
    "bg-[#ff5c5c]": "bg-accent-red",
    "hover:bg-[#ff5c5c]/90": "hover:bg-accent-red/90",
    "bg-[#9da1a8]/30": "bg-text-secondary/30",
    "bg-[#17181c]": "bg-bg-secondary",
    "max-w-[60px]": "max-w-15",
    "bg-[#00c896]/10": "bg-accent-green/10",
    "bg-[#00c896]": "bg-accent-green",
    "text-[#f2f2f2]/90": "text-text-primary/90",
    "text-[#f2f2f2]": "text-text-primary",
    "border-white/[0.08]": "border-white/8",
    "text-[#0f0f10]": "text-bg-primary",
    "hover:bg-[#00c896]/90": "hover:bg-accent-green/90",
    "bg-white/[0.06]": "bg-white/6",
    "hover:bg-white/[0.1]": "hover:bg-white/10",
    "bg-gradient-to-br": "bg-linear-to-br",
    "from-[#00c896]": "from-accent-green",
    "shadow-[#00c896]/20": "shadow-accent-green/20",
    "text-[#00c896]": "text-accent-green",
    "border-white/[0.04]": "border-white/4"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in DebateTheater.")
