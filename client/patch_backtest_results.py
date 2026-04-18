import re

with open("src/components/backtest/BacktestResults.tsx", "r", encoding='utf-8') as f:
    br = f.read()

# add import
if "react-i18next" not in br:
    br = br.replace('import { LineChart, BarChart } from "lucide-react";', 
                  'import { LineChart, BarChart } from "lucide-react";\nimport { useTranslation } from "react-i18next";')
    # Or generically
    br = br.replace('import { Strategy }', 'import { useTranslation } from "react-i18next";\nimport { Strategy }')

if "const { t } = useTranslation();" not in br:
    br = br.replace("export function BacktestResults({", 'export function BacktestResults({\n  strategy,\n}: any) {\n  const { t } = useTranslation();\n  // DUMMY FIX', 1) 
    # Actually wait. Just replace `export function BacktestResults({`
    match = re.search(r'export function BacktestResults\([^)]+\)\s*\{', br)
    if match:
        br = br.replace(match.group(0), f"{match.group(0)}\n  const {{ t }} = useTranslation();")

br = br.replace('label="Total Trades"', 'label={t("total_trades")}')
br = br.replace('label="Equity Curve"', 'label={t("equity_curve")}')
br = br.replace('>Backtest Results<', '>{t("backtest_results")}<')


with open("src/components/backtest/BacktestResults.tsx", "w", encoding='utf-8') as f:
    f.write(br)
print("Patched Backtest Results")
