with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    content = f.read()

target = """                  });
              } else {
                throw new Error"""

replacement = """                  });
              }, 1500);
            } else {
                throw new Error"""

if target in content:
    content = content.replace(target, replacement)
    with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Could not replace!")

