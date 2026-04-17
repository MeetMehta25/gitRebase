import sys

with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    lines = f.readlines()

start_index = -1
end_index = -1
for i, line in enumerate(lines):
    if "return; // Exit early since we used the backend API" in line:
        start_index = i + 1
    if "} catch (err)" in line and start_index != -1:
        end_index = i
        break

if start_index != -1 and end_index != -1:
    new_lines = lines[:start_index-2] + [
        "            } else {\n",
        "              throw new Error(data.error || \"Backend failed to generate strategy\");\n",
        "            }\n",
        "          } else {\n",
        "            throw new Error(\"API request failed with status: \" + response.status);\n",
        "          }\n"
    ] + lines[end_index:]
    
    with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
        f.writelines(new_lines)
    print("Success")
else:
    print("Could not find start or end index")

