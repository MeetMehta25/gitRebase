import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { Activity, CheckCircle2, Loader2, Play } from "lucide-react";

export function BacktestProgressPanel({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "completed">("idle");

  const startBacktest = () => {
    setStatus("running");
    setProgress(0);
  };

  useEffect(() => {
    if (status === "running") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus("completed");
            onComplete?.();
            return 100;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status, onComplete]);

  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Backtest Engine
        </h3>
        {status === "idle" && (
          <button
            onClick={startBacktest}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 transition-colors border border-purple-500/30 text-xs font-semibold uppercase tracking-wider"
          >
            <Play className="w-3.5 h-3.5" />
            Run Backtest
          </button>
        )}
        {status === "running" && (
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Running... {progress}%
          </div>
        )}
        {status === "completed" && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </div>
        )}
      </div>

      <div className="relative h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div
          className={cn(
            "absolute top-0 left-0 h-full transition-all duration-300 ease-out",
            status === "completed" ? "bg-emerald-500" : "bg-purple-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Processed</span>
          <span className="text-sm font-medium text-white/80 font-mono">
            {Math.floor((progress / 100) * 15000).toLocaleString()} bars
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Time Elapsed</span>
          <span className="text-sm font-medium text-white/80 font-mono">
            {(progress * 0.05).toFixed(1)}s
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Status</span>
          <span className={cn(
            "text-sm font-medium font-mono",
            status === "completed" ? "text-emerald-400" :
            status === "running" ? "text-purple-400" : "text-white/60"
          )}>
            {status === "idle" ? "Ready" : status === "running" ? "Computing" : "Done"}
          </span>
        </div>
      </div>
    </div>
  );
}
