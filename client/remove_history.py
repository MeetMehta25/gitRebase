with open("src/main.tsx", "r", encoding='utf-8') as f:
    main_ts = f.read()

main_ts = main_ts.replace("import { BacktestHistoryPage } from './pages/BacktestHistoryPage'\n", "")
main_ts = main_ts.replace('          <Route path="/history" element={<BacktestHistoryPage />} />\n', "")

with open("src/main.tsx", "w", encoding='utf-8') as f:
    f.write(main_ts)

with open("src/components/layout/AppLayout.tsx", "r", encoding='utf-8') as f:
    app_layout = f.read()

app_layout = app_layout.replace('  { name: "History", path: "/history", icon: History },\n', "")

# Check if History is imported from lucide-react and remove it if possible, but it's simpler to string replace it or leave it. 
# actually wait, it's safer to remove `History,` from the import list to avoid unused imports
app_layout = app_layout.replace('  History,\n', "")

with open("src/components/layout/AppLayout.tsx", "w", encoding='utf-8') as f:
    f.write(app_layout)

print("Removed Backtest History")
