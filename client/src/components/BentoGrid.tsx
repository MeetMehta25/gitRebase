import { useEffect, useRef } from "react";

export function BentoGrid() {
  const sparklineRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (sparklineRef.current) {
      const pts = [
        10, 16, 13, 22, 18, 27, 23, 31, 26, 25, 34, 30, 37, 33, 42, 38, 46, 43,
        49, 45, 51, 47, 54,
      ];
      const W = 200,
        H = 72,
        pad = 3,
        mn = Math.min(...pts),
        mx = Math.max(...pts),
        rng = mx - mn;
      const xs = pts.map(
        (_, i) => pad + (i * (W - 2 * pad)) / (pts.length - 1),
      );
      const ys = pts.map((p) => H - pad - ((p - mn) / rng) * (H - 2 * pad));
      const line = xs
        .map((x, i) => (i ? "L" : "M") + x.toFixed(1) + " " + ys[i].toFixed(1))
        .join(" ");
      const area =
        line +
        ` L${xs[xs.length - 1].toFixed(1)} ${H} L${xs[0].toFixed(1)} ${H} Z`;

      sparklineRef.current.innerHTML = `
        <defs>
          <linearGradient id="g-spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a87aff" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#a87aff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#g-spark)"/>
        <path d="${line}" fill="none" stroke="#a87aff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${xs[xs.length - 1].toFixed(1)}" cy="${ys[ys.length - 1].toFixed(1)}" r="3.5" fill="#a87aff"/>
        <circle cx="${xs[xs.length - 1].toFixed(1)}" cy="${ys[ys.length - 1].toFixed(1)}" r="6" fill="none" stroke="#a87aff" stroke-opacity="0.28" stroke-width="1.5"/>
      `;
    }
  }, []);

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const pal = [
    "#0d1117",
    "#2c2602",
    "#5b4e04",
    "#a38b07",
    "#d8b809",
    "#FACC15",
  ];

  const getPalIndex = (i: number) => {
    const r = (((Math.sin(i * 123.456) * 10000) % 1) + 1) / 2;
    return r < 0.12
      ? 0
      : r < 0.28
        ? 1
        : r < 0.48
          ? 2
          : r < 0.68
            ? 3
            : r < 0.86
              ? 4
              : 5;
  };

  const stocks = [
    { sym: "RELIANCE.NS", val: "2948.20", chg: "+1.8%", pct: 72, up: true },
    { sym: "INFY.NS", val: "1674.22", chg: "-1.4%", pct: 38, up: false },
    { sym: "TCS.NS", val: "4082.50", chg: "+0.9%", pct: 88, up: true },
  ];

  const winRates = [
    18, 24, 16, 32, 20, 30, 26, 34, 22, 36, 28, 38, 49, 43, 45, 40, 48, 42, 46,
    44, 50,
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-20 relative font-mono">
      <div className="flex flex-col lg:grid gap-2.5 w-full lg:grid-cols-[1.55fr_1fr_1fr] lg:grid-rows-[220px_210px_170px]">
        {/* K1: NLP Engine */}
        <div className="bg-[#0d1117] border border-[#FACC15]/15 rounded-2xl p-8 flex flex-col justify-between group hover:-translate-y-1 transition-transform lg:col-span-1 lg:row-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#FACC15]/10 border border-[#FACC15]/20 rounded-full px-3 py-1 mb-6 text-[10px] text-[#FACC15] tracking-widest uppercase w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse"></div>
              NLP Engine
            </div>
            <h2 className="font-sans font-extrabold text-[42px] leading-tight text-white tracking-tight mb-2">
              Speak.
              <br />
              Trade.
            </h2>
            <p className="text-[11px] text-white/30 leading-relaxed mb-6">
              Plain English to trading rules.
              <br />
              Describe it, we build it.
            </p>
          </div>
          <div className="bg-black/55 border border-[#FACC15]/10 rounded-xl p-4 relative z-10">
            <div className="text-[10px] text-[#FACC15]/40 mb-1.5">
              // user prompt
            </div>
            <div className="text-xs text-[#c9d1d9] mb-3">
              Buy when 20-period RSI &lt; 30
            </div>
            <div className="text-xs text-[#FACC15] pt-3 border-t border-[#FACC15]/10 flex items-center">
              rule=rsi(20)&lt;30 &rarr; action=buy
              <span className="inline-block w-1.75 h-3.25 bg-[#FACC15] ml-1.5 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* K2: Stat */}
        <div className="bg-[#FACC15] rounded-2xl p-7 flex flex-col justify-between hover:-translate-y-1 transition-transform lg:col-span-1 lg:row-span-1">
          <div>
            <div className="font-sans text-[60px] font-extrabold text-[#080a10] leading-none mb-1">
              5K+
            </div>
            <div className="text-[10px] tracking-widest text-[#080a10]/45 uppercase font-bold mt-1">
              Strategies tested
            </div>
          </div>
          <div className="flex -space-x-2 mt-4 lg:mt-0">
            {["A", "K", "J", "+99"].map((txt, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[#FACC15] flex items-center justify-center text-[9px] font-bold text-white z-10"
                style={{
                  backgroundColor: ["#1a1a2e", "#16213e", "#0f3460", "#533483"][
                    i
                  ],
                  fontSize: i === 3 ? "8px" : "9px",
                }}
              >
                {txt}
              </div>
            ))}
          </div>
        </div>

        {/* K3: Sparkline */}
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform lg:col-span-1 lg:row-span-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] tracking-widest text-white/30 uppercase mb-1">
                Portfolio return
              </div>
              <div className="text-[11px] text-white/50">Golden Cross</div>
            </div>
            <div className="font-sans text-[22px] font-extrabold text-[#a87aff]">
              +31.4%
            </div>
          </div>
          <svg
            ref={sparklineRef}
            viewBox="0 0 200 72"
            preserveAspectRatio="none"
            className="w-full h-18 my-2"
          ></svg>
          <div className="flex gap-[1.2rem]">
            <div className="text-[10px] text-white/30">
              Sharpe
              <span className="block text-xs font-bold text-white mt-px">
                1.84
              </span>
            </div>
            <div className="text-[10px] text-white/30">
              Max DD
              <span className="block text-xs font-bold text-[#ff4d6d] mt-px">
                -8.2%
              </span>
            </div>
            <div className="text-[10px] text-white/30">
              Trades
              <span className="block text-xs font-bold text-white mt-px">
                142
              </span>
            </div>
          </div>
        </div>

        {/* K4: Backtests */}
        <div className="bg-[#0d1117] border border-[#7850ff]/20 rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-transform lg:col-span-1 lg:row-span-1">
          <div className="text-[10px] tracking-widest text-white/25 uppercase mb-[0.9rem]">
            Recent backtests
          </div>
          <div className="flex flex-col gap-1.5 grow">
            {[
              { name: "Golden Cross Crossover", badge: "+24%" },
              { name: "RSI Oversold Reversal", badge: "+18%" },
              { name: "MACD Divergence", badge: "+31%" },
            ].map((bt, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-[7px_10px] rounded-[10px] bg-white/5 border border-white/5 cursor-pointer hover:border-[#FACC15]/20 transition-colors group"
              >
                <span className="text-[10px] text-white/65">{bt.name}</span>
                <div className="flex items-center gap-1.75">
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/15">
                    {bt.badge}
                  </span>
                  <span className="text-[11px] text-white/15 group-hover:text-[#FACC15] transition-colors">
                    &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* K5: Heatmap */}
        <div className="bg-[#0a0c14] border border-white/5 rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-transform lg:col-span-1 lg:row-span-2">
          <div className="text-[10px] tracking-widest text-white/25 uppercase mb-[0.7rem]">
            Win / loss heatmap
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {days.map((d, i) => (
              <div key={i} className="text-[9px] text-white/20 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 56 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm aspect-square cursor-pointer hover:scale-125 transition-transform"
                style={{ backgroundColor: pal[getPalIndex(i)] }}
              ></div>
            ))}
          </div>
        </div>

        {/* K6: Live Market */}
        <div className="bg-[#0d1117] border border-[#FACC15]/15 rounded-2xl p-[1.4rem_1.6rem] flex flex-col justify-between hover:-translate-y-1 transition-transform lg:col-span-1 lg:row-span-1">
          <div className="flex items-center justify-between mb-[0.9rem]">
            <div className="text-[10px] tracking-widest text-[#FACC15]/50 uppercase">
              Live market
            </div>
            <div className="flex items-center gap-1.25 text-[9px] text-[#FACC15]/40 tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse"></div>
              LIVE
            </div>
          </div>
          <div className="flex flex-col gap-1.75 justify-center grow">
            {stocks.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[60px_1fr_70px_50px] items-center p-[7px_10px] bg-white/5 border border-white/5 rounded-[10px] hover:border-[#FACC15]/20 cursor-default transition-colors"
              >
                <span className="text-[11px] font-bold text-white tracking-wider">
                  {s.sym}
                </span>
                <div className="px-2">
                  <div className="h-0.75 bg-white/5 rounded-full relative">
                    <div
                      className="h-0.75 rounded-full absolute top-0 left-0"
                      style={{
                        width: s.pct + "%",
                        backgroundColor: s.up ? "#FACC15" : "#ff4d6d",
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-white/80 text-right">
                  {s.val}
                </span>
                <span
                  className={`text-[11px] font-bold text-right ${s.up ? "text-[#FACC15]" : "text-[#ff4d6d]"}`}
                >
                  {s.chg}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* K7: Win rate */}
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform lg:col-span-1 lg:row-span-1">
          <div>
            <div className="text-[10px] tracking-widest text-white/25 uppercase">
              Avg win rate
            </div>
            <div className="font-sans text-[38px] font-extrabold text-white leading-none mt-[0.3rem]">
              68<span className="text-[18px] text-white/25">%</span>
              <span className="text-xs text-[#FACC15] ml-1.5">&uarr;4.2</span>
            </div>
          </div>
          <div className="flex gap-0.75 items-end h-8 mt-[0.6rem]">
            {winRates.map((h, i) => (
              <div
                key={i}
                className="w-2.25 rounded-[3px] bg-[#FACC15]/65"
                style={{ height: h + "px" }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
