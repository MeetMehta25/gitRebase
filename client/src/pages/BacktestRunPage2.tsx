import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressLogPanel } from "../components/backtest/ProgressLogPanel";
import { ChartsPanel } from "../components/backtest/ChartsPanel";
import { AIAnalysisPanel } from "../components/backtest/AIAnalysisPanel";

const SUITE_TITLES: Record<string, string> = {
  "walk-forward": "Walk-forward Analysis",
  "monte-carlo": "Monte Carlo Simulation",
  "kupiec": "Kupiec / Christoffersen Test",
  "regime": "Regime Segmentation",
  "overfitting": "Overfitting Score",
  "parallel": "Parallel Universes",
  "sharpe": "Sharpe Distribution",
  "longevity": "Longevity Forecast",
};

export function BacktestRunPage2() {
  const navigate = useNavigate();
  const location = useLocation();
  const suiteId: string = location.state?.suiteId || "walk-forward";
  const suiteTitle: string = location.state?.suiteTitle || SUITE_TITLES[suiteId] || "Walk-forward Analysis";

  const [allDone, setAllDone] = useState(false);

  const handleAllComplete = useCallback(() => {
    setAllDone(true);
  }, []);

  return (
    <div className="h-full w-full flex flex-col -m-4 bg-[#08090c]">
      {/* Top bar */}
      <header className="h-12 shrink-0 border-b border-white/[0.06] bg-[#0a0b0e] flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/playground")}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-[#9da1a8] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-6 h-6 rounded-md bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Backtest Run</span>
          <div className="w-px h-4 bg-white/[0.1]" />
          <span className="text-xs text-[#9da1a8] font-mono">{suiteTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${allDone ? "bg-emerald-500" : "bg-emerald-500 animate-pulse"}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${allDone ? "text-emerald-400" : "text-emerald-400"}`}>
            {allDone ? "Complete" : "Processing"}
          </span>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left — Progress panel: full width when loading, 28% when done */}
        <motion.div
          className="shrink-0 overflow-hidden"
          animate={{ width: allDone ? "28%" : "100%" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <ProgressLogPanel suiteTitle={suiteTitle} onAllComplete={handleAllComplete} />
        </motion.div>

        {/* Center — Charts (45%) — shown after completion */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "45%" }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
              className="overflow-hidden"
            >
              <ChartsPanel suiteId={suiteId} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right — AI Analysis (27%) — shown after completion */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "27%" }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.25 }}
              className="shrink-0 overflow-hidden"
            >
              <AIAnalysisPanel suiteId={suiteId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
