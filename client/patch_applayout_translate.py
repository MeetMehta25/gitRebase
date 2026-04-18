with open("src/components/layout/AppLayout.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Inside AppLayout component
code = code.replace(
    'export function AppLayout() {',
    'export function AppLayout() {\n  const { t } = useTranslation();'
)

# Translate nav items
# The original code has <span>{item.name}</span>
code = code.replace(
    '<span>{item.name}</span>',
    '<span>{t(`nav.${item.name.toLowerCase().replace(" ", "_").replace("ai_agents", "ai_agents")}`)}</span>'
)
# It's better to explicitly check the keys for safety or just use lowercase with underscores: Dashboard -> dashboard, Strategy Builder -> strategy_builder, AI Agents -> ai_agents.
# `nav.${item.name.toLowerCase().replace(" ", "_")}`

with open("src/components/layout/AppLayout.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Translated nav items")
