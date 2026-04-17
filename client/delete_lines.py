with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

lines = text.split("\n")
new_lines = lines[:275] + lines[344:]

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write("\n".join(new_lines))
