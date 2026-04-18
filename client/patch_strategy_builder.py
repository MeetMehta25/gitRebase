import re

with open("src/pages/StrategyBuilderPage.tsx", "r", encoding='utf-8') as f:
    sb = f.read()

# add import
if "react-i18next" not in sb:
    sb = sb.replace('import { useState, useRef, useEffect, useCallback } from "react";', 
                  'import { useState, useRef, useEffect, useCallback } from "react";\nimport { useTranslation } from "react-i18next";')

# add useTranslation inside the component
if "const { t } = useTranslation();" not in sb:
    sb = sb.replace("export function StrategyBuilderPage() {", 'export function StrategyBuilderPage() {\n  const { t } = useTranslation();')

# replace 'Run Backtest' button text
sb = sb.replace('<Play className="w-4 h-4" /> Run Backtest', '<Play className="w-4 h-4" /> {t("run_backtest")}')
# replace Strategy Builder in header
sb = sb.replace('        <h1 className="text-2xl font-bold text-white">Strategy Builder</h1>', '        <h1 className="text-2xl font-bold text-white">{t("strategy_builder")}</h1>')

with open("src/pages/StrategyBuilderPage.tsx", "w", encoding='utf-8') as f:
    f.write(sb)
print("Patched Strategy Builder")

with open("src/pages/StrategyResultsPage.tsx", "r", encoding='utf-8') as f:
    sr = f.read()

# add import
if "react-i18next" not in sr:
    sr = sr.replace('import { useState, useEffect } from "react";', 
                  'import { useState, useEffect } from "react";\nimport { useTranslation } from "react-i18next";')

if "const { t } = useTranslation();" not in sr:
    sr = sr.replace("export function StrategyResultsPage() {", 'export function StrategyResultsPage() {\n  const { t } = useTranslation();')

sr = sr.replace('                          Total Trades', '                          {t("total_trades")}')

with open("src/pages/StrategyResultsPage.tsx", "w", encoding='utf-8') as f:
    f.write(sr)
print("Patched Strategy Results")
