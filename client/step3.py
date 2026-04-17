with open("src/pages/AiAgentsPage.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "  const selectHardcodedConversation =" in line:
        skip = True
    if skip and "  const startDebate =" in line:
        skip = False

    if not skip:
        new_lines.append(line)

text = "".join(new_lines)
with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)
