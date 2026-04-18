import re

with open("client/src/pages/StrategyResultsPage.tsx", "r") as f:
    text = f.read()

deploy_button_start = """                  <span className="text-emerald-400">Ready to Deploy</span>
                </div>"""

deploy_button_end = """                  <span className="text-emerald-400">Ready to Deploy</span>
                </div>
                <button 
                  onClick={handleDeployToPaperTrading}
                  disabled={deploying}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors text-sm font-medium border border-emerald-500/30 w-full justify-center"
                >
                  <Rocket className="w-4 h-4" /> {deploying ? "Deploying..." : "Deploy to Paper Trading"}
                </button>"""

text = text.replace(deploy_button_start, deploy_button_end)

# Add Rocket import if not exists
if "Rocket" not in text:
    text = text.replace("  CheckCircle2,\n", "  CheckCircle2,\n  Rocket,\n")
    if "  Rocket,\n" not in text:
      text = text.replace("import {", "import {\n  Rocket,")

# Add Logic
logic_start = "  const navigate = useNavigate();\n"
logic_end = """  const navigate = useNavigate();
  const [deploying, setDeploying] = useState(false);

  const handleDeployToPaperTrading = async () => {
    setDeploying(true);
    try {
      const payload = {
        strategy_id: strategy?.strategy_id || `strat_${Date.now()}`,
        strategy_name: strategy?.goal || strategy?.ticker + " Strategy",
        ticker: strategy?.ticker || "UNKNOWN",
        initial_capital: strategy?.backtest_result?.metrics?.returns?.total_return_pct ? 100000 : 100000,
        strategy_from_debate: true, 
      };

      const response = await fetch("http://localhost:5001/api/paper_trading/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (data.success) {
        alert("Strategy deployed to live paper trading successfully!");
        navigate("/paper-trading");
      } else {
        alert(`Deploy failed: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to deploy to Paper Trading Engine.");
    } finally {
      setDeploying(false);
    }
  };
"""

text = text.replace(logic_start, logic_end)

with open("client/src/pages/StrategyResultsPage.tsx", "w") as f:
    f.write(text)

print("Done patching.")
