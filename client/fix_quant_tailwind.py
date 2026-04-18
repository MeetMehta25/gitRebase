with open("src/pages/QuantCoachPage.tsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("text-[#f2f2f2]", "text-text-primary")
code = code.replace("text-[#9da1a8]", "text-text-secondary")
code = code.replace("bg-[size:100%_2px,3px_100%]", "bg-size-[100%_2px,3px_100%]")
code = code.replace("w-[380px]", "w-95")

with open("src/pages/QuantCoachPage.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed Tailwind classes in QuantCoachPage")
