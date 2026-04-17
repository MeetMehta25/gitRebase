with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# remove last two "}"
parts = text.rsplit("}", 2)
new_text = parts[0]

with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(new_text)
