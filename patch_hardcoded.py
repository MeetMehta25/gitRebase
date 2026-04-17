import sys

with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    lines = f.readlines()

start = -1
end = -1

for i, line in enumerate(lines):
    if "const HARDCODED_CONVERSATIONS = {" in line:
        start = i
    if "const handleIntroSubmit =" in line and start != -1:
        end = i
        break

if start != -1 and end != -1:
    new_lines = lines[:start] + lines[end:]
    
    with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
        f.writelines(new_lines)
    print("Success")
else:
    print(f"Failed. Start: {start}, End: {end}")

