with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "} else {" in line and "throw new Error(data.error" in lines[i+1]:
        lines[i] = "              }, 1500);\n            } else {\n"

with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
    f.writelines(lines)
    
