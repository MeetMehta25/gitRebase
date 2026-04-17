import { cn } from "../../lib/utils";
import { User, Bot } from "lucide-react";

interface AgentChatBubbleProps {
  message: string;
  isUser?: boolean;
  timestamp?: string;
  children?: React.ReactNode;
}

export function AgentChatBubble({ message, isUser, timestamp, children }: AgentChatBubbleProps) {
  return (
    <div className={cn("flex w-full gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          isUser
            ? "bg-[#1e1f24] border-white/[0.1] text-[#9da1a8]"
            : "bg-[#00c896]/10 border-[#00c896]/30 text-[#00c896]"
        )}
      >
        {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
      </div>

      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-[12px] leading-relaxed",
            isUser
              ? "bg-[#4a9eff] text-white rounded-tr-sm"
              : "bg-[#1e1f24] text-[#f2f2f2]/90 rounded-tl-sm border border-white/[0.06]"
          )}
        >
          {message}
        </div>

        {children && <div className="w-full mt-1">{children}</div>}

        {timestamp && (
          <span className="text-[9px] text-[#9da1a8]/60 font-mono px-0.5">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
