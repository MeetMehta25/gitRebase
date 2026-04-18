with open("src/pages/LoginPage.tsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("bg-[size:60px_60px]", "bg-size-[60px_60px]")
code = code.replace("bg-gradient-to-r", "bg-linear-to-r")
code = code.replace("bg-white/[0.04]", "bg-white/4")
code = code.replace("focus:bg-white/[0.06]", "focus:bg-white/6")

with open("src/pages/LoginPage.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed Tailwind classes in LoginPage")
