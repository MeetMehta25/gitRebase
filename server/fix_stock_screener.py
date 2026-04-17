import os

file_path = "../client/src/pages/StockScreenerPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "h-[40px]": "h-10",
    "bg-white/[0.02]": "bg-white/2",
    "flex-[3]": "flex-3",
    "bg-white/[0.03]": "bg-white/3",
    "min-h-[400px]": "min-h-100",
    "bg-gradient-to-r": "bg-linear-to-r",
    "flex-[2]": "flex-2",
    "min-h-[300px]": "min-h-75",
    "bg-white/[0.01]": "bg-white/1",
    "hover:bg-white/[0.02]": "hover:bg-white/2"
}

for old_val, new_val in replacements.items():
    content = content.replace(old_val, new_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: Tailwind classes updated in StockScreenerPage.")
