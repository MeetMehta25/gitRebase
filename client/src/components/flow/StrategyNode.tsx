import { memo } from "react";
import { Handle, Position } from "reactflow";
import { cn } from "../../lib/utils";

export const StrategyNode = memo(({ data, selected }: any) => {
  const Icon = data.icon;
  
  // Determine colors based on type
  let colorClass = "text-white";
  let bgClass = "bg-white/5";
  let borderClass = "border-white/10";
  let shadowClass = "";

  if (data.type === "trigger") {
    colorClass = "text-emerald-400";
    bgClass = "bg-emerald-500/10";
    borderClass = "border-emerald-500/20";
    if (selected) shadowClass = "shadow-[0_0_20px_rgba(16,185,129,0.2)]";
  } else if (data.type === "condition") {
    colorClass = "text-amber-400";
    bgClass = "bg-amber-500/10";
    borderClass = "border-amber-500/20";
    if (selected) shadowClass = "shadow-[0_0_20px_rgba(245,158,11,0.2)]";
  } else if (data.type === "action") {
    colorClass = "text-blue-400";
    bgClass = "bg-blue-500/10";
    borderClass = "border-blue-500/20";
    if (selected) shadowClass = "shadow-[0_0_20px_rgba(59,130,246,0.2)]";
  }

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border backdrop-blur-md min-w-[180px] transition-all duration-200",
        bgClass,
        borderClass,
        shadowClass,
        selected ? "ring-2 ring-white/20 scale-105" : "hover:border-white/20"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[#0f0f10] border-2 border-white/20"
      />
      
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-black/40 border border-white/5", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", colorClass)}>
            {data.type}
          </div>
          <div className="text-sm font-medium text-white/90">
            {data.label}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-[#0f0f10] border-2 border-white/20"
      />
    </div>
  );
});
