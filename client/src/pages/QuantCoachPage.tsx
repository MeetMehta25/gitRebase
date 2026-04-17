import { Bot, Shield, User, BarChart3, Send, Sparkles, Cpu, Network } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { motion } from "framer-motion";

export function QuantCoachPage() {
  const transcript = [
    { role: 'user', time: '10:42 AM', content: 'What is the current market regime indicating for momentum strategies?' },
    { role: 'ai', time: '10:42 AM', content: 'We are currently transitioning into a high-volatility regime. Momentum strategies are showing degraded performance. I suggest reducing exposure and tightening trailing stops.' },
    { role: 'user', time: '10:44 AM', content: 'Can we backtest adjusting the stops to 1.5 ATR?' },
    { role: 'ai', time: '10:45 AM', content: 'Running simulation... Adjusting to 1.5 ATR improves the Sharpe ratio to 2.14 and reduces Max Drawdown to -12.3%. The win rate drops slightly to 68.4%, but overall risk-adjusted returns are better.' },
    { role: 'user', time: '10:46 AM', content: 'Deploy that configuration to the active paper trading session.' },
    { role: 'ai', time: '10:46 AM', content: 'Configuration deployed successfully. Your paper trading session is now running with 1.5 ATR trailing stops.' },
  ];

  return (
    <div className="flex flex-col h-full w-full gap-6 overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Bot className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f2f2f2] tracking-tight">Quant Coach</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
              <p className="text-xs text-[#9da1a8] font-medium uppercase tracking-widest leading-none">
                AI Trading Advisor • Online
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassCard className="py-1.5 px-3 flex items-center gap-2 border-white/5 bg-[#11111a]">
            <Shield className="h-3 w-3 text-purple-400" />
            <span className="text-[10px] font-mono font-medium text-[#9da1a8]">SECURED CHANNEL</span>
          </GlassCard>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-6">
        {/* Left: AI Avatar Channel */}
        <div className="flex-1 flex flex-col gap-4">
          <GlassCard className="flex-1 p-0 overflow-hidden bg-[#0A0A0F]/60 border-white/5 relative shadow-2xl rounded-2xl">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
            
{/* <iframe src="https://embed.liveavatar.com/v1/92c85e63-a6de-4a5d-af4f-dd0ac379e324" allow="microphone" title="LiveAvatar Embed" style="aspect-ratio: 16/9;"></iframe> */}

            <iframe 
              src="https://embed.liveavatar.com/v1/92c85e63-a6de-4a5d-af4f-dd0ac379e324"
              allow="microphone" 
              title="Quant Coach - LiveAvatar" 
              className="w-full h-full border-none"
              style={{ backgroundColor: 'transparent' }}
            />
          </GlassCard>

          {/* Replaced 3 cards with Agent Context / Telemetry */}
          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="bg-[#11111a]/90 border-white/5 p-4 flex flex-col gap-4 hover:border-purple-500/20 transition-colors rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Core Telemetry
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[11px]"><span className="text-[#a1a1aa] font-medium">Latency</span><span className="font-mono text-purple-300">24ms</span></div>
                <div className="flex justify-between items-center text-[11px]"><span className="text-[#a1a1aa] font-medium">Data Streams</span><span className="font-mono text-[#f472b6]">12 Active</span></div>
                <div className="flex justify-between items-center text-[11px]"><span className="text-[#a1a1aa] font-medium">Model Params</span><span className="font-mono text-[#f2f2f2]">405B Opt</span></div>
              </div>
            </GlassCard>
            <GlassCard className="bg-[#11111a]/90 border-white/5 p-4 flex flex-col gap-4 hover:border-purple-500/20 transition-colors rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                <Network className="w-3.5 h-3.5 text-[#f472b6]" /> Market Context
              </div>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">High Volatility</span>
                <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">Bearish Bias</span>
                <span className="px-2 py-1 rounded bg-[#f472b6]/10 text-[#f472b6] border border-[#f472b6]/20 font-medium">VIX &gt; 25</span>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right: Transcripts, Live Metrics, Chat Input */}
        <div className="w-[380px] flex flex-col gap-5 shrink-0 px-1 pb-1">
          {/* Layer 1: Live Metrics (Animated Card matched to screenshot) */}
          <motion.div
            initial={{ opacity: 0, x: 45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative shrink-0"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-[#0A0A0F] p-5 shadow-2xl transition-all duration-500 hover:border-purple-500/30 z-10 w-full">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#f2f2f2] flex items-center gap-2 relative z-10">
                  <BarChart3 className="w-4 h-4 text-purple-500" /> Live Target Metrics
                </span>
                <span className="flex h-2 w-2 rounded-full bg-[#c084fc] shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              </div>
              <div className="grid grid-cols-3 gap-y-6 gap-x-2 relative z-10">
                 <div>
                   <p className="text-[11px] text-[#a1a1aa] mb-2 font-medium">Win Rate</p>
                   <p className="text-[15px] font-mono font-semibold text-[#f472b6]">68.4%</p>
                 </div>
                 <div>
                   <p className="text-[11px] text-[#a1a1aa] mb-2 font-medium">Sharpe</p>
                   <p className="text-[15px] font-mono font-semibold text-[#f472b6]">2.14</p>
                 </div>
                 <div>
                   <p className="text-[11px] text-[#a1a1aa] mb-2 font-medium">Max DD</p>
                   <p className="text-[15px] font-mono font-semibold text-red-400">-12.3%</p>
                 </div>
                 <div>
                   <p className="text-[11px] text-[#a1a1aa] mb-2 font-medium">Avg Hold</p>
                   <p className="text-[15px] font-mono font-semibold text-[#f2f2f2]">4.2h</p>
                 </div>
                 <div>
                   <p className="text-[11px] text-[#a1a1aa] mb-2 font-medium">Trades</p>
                   <p className="text-[15px] font-mono font-semibold text-[#f2f2f2]">142</p>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Layer 2: Transcript */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {transcript.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 45 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 px-1">
                  {msg.role === 'ai' ? (
                    <>
                      <Bot className="h-3 w-3 text-purple-400" />
                      <span className="text-[9px] font-mono text-[#9da1a8]">{msg.time}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] font-mono text-[#9da1a8]">{msg.time}</span>
                      <User className="h-3 w-3 text-white/40" />
                    </>
                  )}
                </div>
                <div className={`p-3.5 rounded-2xl max-w-[85%] text-[11.5px] leading-relaxed border shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#11111a] border-white/5 text-[#d4d4d8] rounded-tr-sm' 
                    : 'bg-purple-900/10 border-purple-500/10 text-purple-100/90 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Layer 3: Chat Input */}
          <motion.div
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="shrink-0"
          >
             <div className="p-1.5 rounded-2xl border border-white/5 bg-[#11111a] flex items-center gap-2 focus-within:border-purple-500/30 transition-colors shadow-lg">
               <button className="p-2.5 text-white/30 hover:text-purple-400 transition-colors">
                 <Sparkles className="h-4 w-4" />
               </button>
               <input 
                 type="text"
                 placeholder="Message Quant Coach..."
                 className="flex-1 bg-transparent border-none outline-none text-xs text-white/90 placeholder:text-white/30 font-medium"
               />
               <button className="px-4 py-2.5 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-100 transition-colors flex items-center gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Send</span>
                 <Send className="h-3.5 w-3.5" />
               </button>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
