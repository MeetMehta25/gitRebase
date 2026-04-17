import re

with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# remove trailing whitespace
text = text.rstrip()

# remove the last character if it's a bracket and the second to last isn't
while text.endswith("}"):
    text = text[:-1]

with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)

