import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ title, value, trend, trendValue, icon, className }: MetricCardProps) {
  return (
    <div className={cn("p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-white/50">
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        {icon && <div className="text-white/40">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-white tracking-tight">{value}</span>
        {trend && trendValue && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md",
            trend === "up" ? "text-emerald-400 bg-emerald-500/10" :
            trend === "down" ? "text-rose-400 bg-rose-500/10" :
            "text-white/50 bg-white/5"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> :
             trend === "down" ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
