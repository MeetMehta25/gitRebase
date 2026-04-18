import re

with open("client/src/pages/StrategyBuilderPage.tsx", "r") as f:
    text = f.read()

# Add Rocket import
text = text.replace("  Save,\n  Activity,", "  Save,\n  Rocket,\n  Activity,")

# Add handleDeploy logic
deploy_logic = """
  // ─── Deploy to Paper Trading handler ────────────────────────────────────────
  const [deploying, setDeploying] = useState(false);
  
  const handleDeployToPaperTrading = useCallback(async () => {
    setDeploying(true);
    const strategyId = activeStrategyId || 1;
    const q = STRATEGY_QUESTIONS.find((s) => s.id === strategyId);
    
    try {
      const payload = {
        strategy_id: `strat_${strategyId}`,
        strategy_name: q?.goal || `Strategy ${strategyId}`,
        ticker: q?.ticker || "RELIANCE.NS",
        initial_capital: 100000,
        strategy_from_debate: true, // Just in case backends have older validation
      };

      const response = await fetch("http://localhost:5001/api/paper_trading/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (data.success) {
        alert("Strategy saved & deployed to live paper trading successfully!");
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
  }, [activeStrategyId, navigate]);

  // ─── Run Backtest handler ───────────────────────────────────────────────────"""

text = text.replace("  // ─── Run Backtest handler ───────────────────────────────────────────────────", deploy_logic)

# Replace Save button with Save & Deploy
button_old = """          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/5">
            <Save className="w-4 h-4" /> Save
          </button>"""

button_new = """          <button 
            onClick={handleDeployToPaperTrading}
            disabled={deploying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors text-sm font-medium border border-emerald-500/30"
          >
            <Rocket className="w-4 h-4" /> {deploying ? "Deploying..." : "Save & Deploy"}
          </button>"""

text = text.replace(button_old, button_new)

with open("client/src/pages/StrategyBuilderPage.tsx", "w") as f:
    f.write(text)

print("Done patching.")
