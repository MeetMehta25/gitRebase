import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAgentColor(role: string): string {
  const colors: Record<string, string> = {
    quant: "border-blue-400 text-blue-400",
    risk: "border-red-400 text-red-400",
    macro: "border-amber-400 text-amber-400",
    liquidity: "border-cyan-400 text-cyan-400",
    volatility: "border-purple-400 text-purple-400",
    trend: "border-emerald-400 text-emerald-400",
    brand: "border-pink-400 text-pink-400",
    engagement: "border-orange-400 text-orange-400",
    arbitrator: "border-yellow-400 text-yellow-400",
    adversarial: "border-red-500 text-red-500",
  };
  return colors[role] || "border-gray-400 text-gray-400";
}

export function getAgentBg(role: string): string {
  const colors: Record<string, string> = {
    quant: "bg-blue-500/10",
    risk: "bg-red-500/10",
    macro: "bg-amber-500/10",
    liquidity: "bg-cyan-500/10",
    volatility: "bg-purple-500/10",
    trend: "bg-emerald-500/10",
    brand: "bg-pink-500/10",
    engagement: "bg-orange-500/10",
    arbitrator: "bg-yellow-500/10",
    adversarial: "bg-red-500/10",
  };
  return colors[role] || "bg-gray-500/10";
}
