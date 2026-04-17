import os

file_path = "../client/src/pages/AiAgentsPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "bg-[#1e1f24]/90": "bg-bg-card/90",
    "bg-[#1e1f24]/95": "bg-bg-card/95",
    "bg-[#1e1f24]/70": "bg-bg-card/70",
    "hover:bg-[#1e1f24]": "hover:bg-bg-card",
    "border-[#1e1f24]": "border-bg-card",
    "bg-gradient-to-br": "bg-linear-to-br",
    "bg-gradient-to-r": "bg-linear-to-r",
    "bg-gradient-to-t": "bg-linear-to-t",
    "flex-shrink-0": "shrink-0",
    "min-h-[160px]": "min-h-40",
    "min-h-[100px]": "min-h-25",
    "min-w-[60px]": "min-w-15",
    "border-white/[0.06]": "border-white/6",
    "hover:border-white/[0.12]": "hover:border-white/12"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in AiAgentsPage.")
