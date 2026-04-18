with open("src/components/layout/AppLayout.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# insert import
code = code.replace(
    'import { ThemeToggle } from "./ThemeToggle";',
    'import { ThemeToggle } from "./ThemeToggle";\nimport { LanguageToggle } from "./LanguageToggle";'
)

# insert component near the ThemeToggle
code = code.replace(
    '<ThemeToggle />\n            </div>',
    '<ThemeToggle />\n              <LanguageToggle />\n            </div>'
)

# Update nav items with hook. Wait, NAV_ITEMS is outside the component. Let's find it.
code = code.replace(
    'const NAV_ITEMS = [',
    '''import { useTranslation } from "react-i18next";
const NAV_ITEMS = ['''
)

# The NAV_ITEMS is outside so we can't directly translate them there without a hook, 
# instead we will translate their names down where they render but wait, we can just replace 'name' when rendering

with open("src/components/layout/AppLayout.tsx", "w", encoding="utf-8") as f:
    f.write(code)
    
print("Patched AppLayout")
