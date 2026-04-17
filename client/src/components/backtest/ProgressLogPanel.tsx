import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { PROGRESS_STEPS } from "../../data/backtestRunData";

export function ProgressLogPanel({
  suiteTitle,
  onAllComplete,
}: {
  suiteTitle: string;
  onAllComplete?: () => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    if (completedSteps >= PROGRESS_STEPS.length) {
      onAllComplete?.();
      return;
    }
    const delay = 1200 + Math.random() * 1800;
    const timer = setTimeout(() => {
      setCompletedSteps((p) => p + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [completedSteps, onAllComplete]);

  const steps = PROGRESS_STEPS.map((s, i) => ({
    ...s,
    label: i === 4 ? `Executing ${suiteTitle}` : s.label,
  }));

  return (
    <div className="h-full flex flex-col bg-[#0a0b0e] border-r border-white/6">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary font-mono">
            Backtest Progress
          </span>
        </div>
        <div className="mt-2 h-1 bg-white/6 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400"
            animate={{ width: `${(completedSteps / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-[10px] text-text-muted font-mono mt-1 block">
          {completedSteps}/{steps.length} steps completed
        </span>
      </div>

      {/* Timeline */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-2.75 top-0 bottom-0 w-px bg-white/8" />

          {steps.map((step, i) => {
            const isDone = i < completedSteps;
            const isActive = i === completedSteps;
            const isExpanded = expandedStep === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: isDone ? 0 : 0.1, duration: 0.3 }}
                className="relative mb-1"
              >
                {/* Step row */}
                <button
                  onClick={() =>
                    isDone && setExpandedStep(isExpanded ? null : i)
                  }
                  className={`w-full flex items-start gap-3 py-2.5 px-1 rounded-lg transition-all text-left ${
                    isDone
                      ? "cursor-pointer hover:bg-white/3"
                      : "cursor-default"
                  }`}
                >
                  {/* Icon */}
                  <div className="relative z-10 shrink-0 mt-0.5">
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="w-5.5 h-5.5 text-blue-400" />
                      </motion.div>
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-full border-2 border-white/15 bg-[#0d0e12]" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] font-semibold ${
                        isDone
                          ? "text-emerald-300"
                          : isActive
                            ? "text-blue-300"
                            : "text-[#4b5563]"
                      }`}
                    >
                      {step.label}
                    </div>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-[11px] text-blue-400/70 font-mono"
                      >
                        Processing...
                      </motion.span>
                    )}
                  </div>

                  {/* Expand arrow */}
                  {isDone && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-text-muted shrink-0 mt-1 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {/* Expanded thinking */}
                <AnimatePresence>
                  {isExpanded && isDone && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-8.5 mb-3 p-3 rounded-lg bg-white/3 border border-white/6">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 mb-2 font-mono">
                          Thinking Process
                        </div>
                        <p className="text-[11.5px] text-text-secondary leading-relaxed font-mono whitespace-pre-wrap">
                          {step.thinking}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
