import re

with open('client/src/pages/PaperTradingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    return match.group(0).replace('₹{', '${')

new_content = re.sub(r'`[^`]*`', replacer, content)

with open('client/src/pages/PaperTradingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed template strings in PaperTradingPage.tsx")
