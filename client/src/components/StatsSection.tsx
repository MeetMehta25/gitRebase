export function StatsSection() {
  return (
    <section className="py-20 relative z-10 px-4">
      <div className="max-w-7xl mx-auto rounded-[2.5rem] border border-purple-400/20 bg-white/5 bg-gradient-to-b from-purple-500/10 to-transparent backdrop-blur-3xl p-8 md:p-16 relative overflow-hidden shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)]">
        {/* Subtle grid and background glow */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4c1d95]/30 via-[#4c1d95]/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-[40%] left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-purple-900/5 to-transparent opacity-60 blur-2xl pointer-events-none" />
        
        <p className="text-gray-300 text-center text-lg md:text-xl leading-relaxed max-w-4xl mx-auto mb-16 font-light relative z-10">
          Our platform stands at the forefront of quantitative trading solutions, offering a comprehensive and intuitive environment designed to elevate traders' interaction with the markets. With a user-friendly interface and powerful features,
        </p>

        <div className="relative z-10">
          {/* Top row - 3 items */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10 pb-12 mb-12 gap-y-12 md:gap-y-0">
            <div className="text-center md:border-r border-white/10 flex flex-col items-center justify-center px-4">
              <h3 className="text-5xl md:text-6xl font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-3 tracking-tight">
                5K+
              </h3>
              <p className="text-sm text-white/60">
                User Strategies
              </p>
            </div>
            <div className="text-center md:border-r border-white/10 flex flex-col items-center justify-center px-4">
              <h3 className="text-5xl md:text-6xl font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-3 tracking-tight">
                10B+
              </h3>
              <p className="text-sm text-white/60">
                Data Points Analyzed
              </p>
            </div>
            <div className="text-center flex flex-col items-center justify-center px-4">
              <h3 className="text-5xl md:text-6xl font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-3 tracking-tight">
                95%
              </h3>
              <p className="text-sm text-white/60">
                Parser Accuracy
              </p>
            </div>
          </div>

          {/* Bottom row - 2 items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 md:gap-y-0">
            <div className="text-center md:border-r border-white/10 flex flex-col items-center justify-center px-4">
              <h3 className="text-5xl md:text-6xl font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-3 tracking-tight">
                15M+
              </h3>
              <p className="text-sm text-white/60">
                Sim Trades
              </p>
            </div>
            <div className="text-center flex flex-col items-center justify-center px-4">
              <h3 className="text-5xl md:text-6xl font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-3 tracking-tight">
                4 Years
              </h3>
              <p className="text-sm text-white/60">
                System Development
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
