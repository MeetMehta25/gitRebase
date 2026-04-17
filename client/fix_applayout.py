with open("src/components/layout/AppLayout.tsx", "r") as f:
    text = f.read()

text = text.replace("import { useProfile, UserLevel }", "import { useProfile, type UserLevel }")
text = text.replace("import { Star, Trophy, ThumbsUp }", "import { Trophy, ThumbsUp }")

import re

# Remove duplicate decls
lines = text.split('\n')
new_lines = []
found_decl = False
for line in lines:
    if "const { profile, updateProfile, showGamificationToast } = useProfile();" in line:
        if not found_decl:
            found_decl = True
            new_lines.append(line)
    else:
        new_lines.append(line)

with open("src/components/layout/AppLayout.tsx", "w") as f:
    f.write('\n'.join(new_lines))

with open("src/components/ThemeToggle.tsx", "r") as f:
    tt = f.read()
text = tt.replace('import { motion } from "framer-motion";\n', '')
with open("src/components/ThemeToggle.tsx", "w") as f:
    f.write(text)

