export function StrategyInterpreterPanel() {
  return (
    <div className="bg-[#1e1f24] border border-white/[0.06] rounded-lg p-4 h-full">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#9da1a8] mb-3">
        Strategy Interpreter
      </h3>

      <div className="space-y-3">
        {/* Parsed Indicators */}
        <div className="bg-[#17181c] rounded-md p-3 border border-white/[0.04]">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#9da1a8] block mb-1.5">Indicators</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">RSI(14)</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">SMA(50)</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">SMA(200)</span>
          </div>
        </div>

        {/* Entry Rules */}
        <div className="bg-[#17181c] rounded-md p-3 border border-white/[0.04]">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#00c896] block mb-1.5">Entry Conditions</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-1 h-1 rounded-full bg-[#00c896]" />
              <span className="text-[#f2f2f2] font-mono">RSI(14) &lt; 30</span>
              <span className="text-[#9da1a8] text-[10px]">→ Oversold condition</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-1 h-1 rounded-full bg-[#00c896]" />
              <span className="text-[#f2f2f2] font-mono">SMA(50) &gt; SMA(200)</span>
              <span className="text-[#9da1a8] text-[10px]">→ Uptrend confirmation</span>
            </div>
          </div>
        </div>

        {/* Exit Rules */}
        <div className="bg-[#17181c] rounded-md p-3 border border-white/[0.04]">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#ff5c5c] block mb-1.5">Exit Conditions</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-1 h-1 rounded-full bg-[#ff5c5c]" />
              <span className="text-[#f2f2f2] font-mono">RSI(14) &gt; 70</span>
              <span className="text-[#9da1a8] text-[10px]">→ Overbought signal</span>
            </div>
          </div>
        </div>

        {/* Execution Params */}
        <div className="bg-[#17181c] rounded-md p-3 border border-white/[0.04]">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#9da1a8] block mb-1.5">Execution</span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#9da1a8]">Position Size</span>
              <span className="text-[#f2f2f2] font-mono">10% BP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9da1a8]">Order Type</span>
              <span className="text-[#f2f2f2] font-mono">MKT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9da1a8]">Slippage</span>
              <span className="text-[#f2f2f2] font-mono">0.01%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9da1a8]">Commission</span>
              <span className="text-[#f2f2f2] font-mono">$0.005/sh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
