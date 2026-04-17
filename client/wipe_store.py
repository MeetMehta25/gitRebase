with open("src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

text = text.replace('import { useNavigate, useLocation } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";')

text = text.replace("""  // Strategy sources: location state, Zustand store
  const { currentStrategy } = useStrategyStore();
""", "  // Strategy sources: location state, Zustand store")

with open("src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)
