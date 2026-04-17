with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()
text = text.rstrip()
if text.endswith("}"):
    text = text[:-1]
with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)
