import { cn } from "../../lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowEffect?: boolean;
  noPadding?: boolean;
}

export function GlassCard({
  className,
  children,
  glowEffect = false,
  noPadding = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/[0.06] bg-[#1e1f24]/70 backdrop-blur-md transition-all duration-200",
        "hover:border-white/[0.1]",
        !noPadding && "p-4",
        glowEffect && "shadow-[0_0_20px_rgba(74,158,255,0.06)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
