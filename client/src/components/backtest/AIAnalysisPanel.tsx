import { motion } from "framer-motion";
import { Brain, ShieldAlert, FlaskConical, AlertTriangle, Award } from "lucide-react";
import { AI_ANALYSIS } from "../../data/backtestRunData";

export function AIAnalysisPanel({ suiteId }: { suiteId: string }) {
  const analysis = AI_ANALYSIS[suiteId] || AI_ANALYSIS["walk-forward"];

  const sections = [
    { icon: Brain, title: "Summary", content: analysis.summary, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { icon: ShieldAlert, title: "Risk Diagnostics", items: analysis.risk, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { icon: FlaskConical, title: "Robustness Analysis", items: analysis.robustness, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { icon: AlertTriangle, title: "Warnings", items: analysis.warnings, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  ];

  const verdictColors = {
    positive: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300", icon: "text-emerald-400" },
    neutral: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", icon: "text-amber-400" },
    negative: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-300", icon: "text-red-400" },
  };
  const vc = verdictColors[analysis.verdictType];

  return (
    <div className="h-full flex flex-col bg-[#0a0b0e] border-l border-white/[0.06]">
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9da1a8] font-mono">
            AI Quant Analysis
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {sections.map((sec, i) => (
          <motion.div
            key={sec.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.15 }}
            className={`p-3 rounded-lg border ${sec.border} bg-white/[0.02]`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-md ${sec.bg} flex items-center justify-center`}>
                <sec.icon className={`w-3.5 h-3.5 ${sec.color}`} />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${sec.color}`}>
                {sec.title}
              </span>
            </div>
            {sec.content ? (
              <p className="text-[12px] text-[#b0b5bd] leading-relaxed">{sec.content}</p>
            ) : (
              <ul className="space-y-1.5">
                {sec.items?.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${sec.color.replace("text-", "bg-")}`} />
                    <span className="text-[11.5px] text-[#9da1a8] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}

        {/* Verdict */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className={`p-3 rounded-lg border ${vc.border} ${vc.bg}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className={`w-4 h-4 ${vc.icon}`} />
            <span className={`text-[11px] font-bold uppercase tracking-widest ${vc.text}`}>
              Final Verdict
            </span>
          </div>
          <p className={`text-[12px] ${vc.text} leading-relaxed font-medium italic`}>
            "{analysis.verdict}"
          </p>
        </motion.div>
      </div>
    </div>
  );
}
