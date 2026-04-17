import { Layers, Database, Lock } from 'lucide-react';

export function DynamicsSection() {
  return (
    <section className="py-32 px-4 relative overflow-hidden flex flex-col items-center min-h-[800px]">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-3 px-1.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 z-10 backdrop-blur-md">
        <span className="bg-[#FACC15] text-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase">Hello!</span>
        <span className="text-[#a1a1aa] pr-3 text-[13px] font-medium tracking-wide">Ready to growth?</span>
      </div>

      {/* Main Title */}
      <div className="text-center mb-24 z-10 relative">
        <h2 className="text-4xl md:text-5xl lg:text-[64px] font-medium tracking-tight text-white mb-2 leading-tight">
          The Dynamics
        </h2>
        <h2 className="text-4xl md:text-5xl lg:text-[64px] font-serif italic text-white/90 font-light leading-tight">
          of Alpha Quant
        </h2>
      </div>

      {/* Central Visual Area */}
      <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center z-10">
        
        {/* CSS/SVG Background Circuits & Connections */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
           {/* Center Radial subtle glow */}
           <div className="absolute w-[800px] h-[800px] bg-purple-900/5 rounded-full blur-[100px]"></div>
           
           <svg className="w-full h-[800px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 1000 800" fill="none" xmlns="http://www.w3.org/2000/svg">
             {/* Circular radiating circuit lines */}
             <g opacity="0.08" stroke="white" strokeWidth="1">
                {/* Radiating branches */}
                <path d="M500,400 L500,200 L450,150 L400,150" fill="none" />
                <path d="M500,400 L500,200 L550,150 L600,150" fill="none" />
                <path d="M500,400 L500,600 L450,650 L400,650" fill="none" />
                <path d="M500,400 L500,600 L550,650 L600,650" fill="none" />
                
                <path d="M500,400 L300,400 L250,350 L200,350" fill="none" />
                <path d="M500,400 L700,400 L750,450 L800,450" fill="none" />

                <path d="M500,400 L350,550 L300,550" fill="none" />
                <path d="M500,400 L650,550 L700,550" fill="none" />
                
                <path d="M500,400 L250,250 L200,250" fill="none" />
                <path d="M500,400 L750,250 L800,250" fill="none" />

                {/* Subtle Concentric Arcs */}
                <path d="M400,300 A141,141 0 0,0 350,350" />
                <path d="M600,300 A141,141 0 0,1 650,350" />
                <path d="M400,500 A141,141 0 0,1 350,450" />
                <path d="M600,500 A141,141 0 0,0 650,450" />

                <path d="M300,200 A282,282 0 0,0 200,300" />
                <path d="M700,200 A282,282 0 0,1 800,300" />
                <path d="M300,600 A282,282 0 0,1 200,500" />
                <path d="M700,600 A282,282 0 0,0 800,500" />
             </g>

             {/* Dotted Connections to Satellite Nodes */}
             <g stroke="white" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.15">
                {/* To Bottom Left node */}
                <path d="M500 400 L280 400 L280 550" />
                {/* To Top Right node */}
                <path d="M500 400 L720 400 L720 250" />
                {/* Horizontal extensions from the connection points */}
                <path d="M280 400 L180 400" />
                <path d="M720 400 L820 400" />
             </g>
             
             {/* Highlight Connection Nodes */}
             <circle cx="280" cy="400" r="3" fill="#A855F7" />
             <circle cx="280" cy="400" r="6" fill="none" stroke="#A855F7" opacity="0.5" />
             
             <circle cx="720" cy="400" r="3" fill="#A855F7" />
             <circle cx="720" cy="400" r="6" fill="none" stroke="#A855F7" opacity="0.5" />
           </svg>
        </div>

        {/* Small floating decorative dark shapes behind elements */}
        {/* Top Left Shape */}
        <div className="absolute top-[5%] left-[15%] w-24 h-24 -z-10 opacity-30 md:block hidden">
           <div className="absolute top-0 right-0 w-12 h-12 bg-[#1a1a24] rounded-2xl border border-white/5"></div>
           <div className="absolute bottom-0 left-0 w-12 h-12 bg-[#1a1a24] rounded-2xl border border-white/5"></div>
        </div>
        {/* Bottom Right Shape */}
        <div className="absolute bottom-[5%] right-[10%] w-32 h-32 -z-10 opacity-30 md:block hidden">
           <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#1a1a24] rounded-2xl border border-white/5"></div>
           <div className="absolute top-0 right-0 w-16 h-16 bg-[#1a1a24] rounded-2xl border border-white/5"></div>
           <div className="absolute bottom-[-16px] right-[16px] w-16 h-16 bg-[#1a1a24] rounded-2xl border border-white/5"></div>
        </div>

        {/* Left Satellite Node */}
        <div className="absolute left-[10%] md:left-[18%] top-[70%] md:top-[68%] -translate-y-1/2 z-10 w-14 h-14 md:w-16 md:h-16 bg-[#0a0a0f]/80 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <Database size={22} className="text-gray-400" />
        </div>

        {/* Right Satellite Node */}
        <div className="absolute right-[10%] md:right-[18%] top-[30%] md:top-[28%] -translate-y-1/2 z-10 w-14 h-14 md:w-16 md:h-16 bg-[#0a0a0f]/80 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <Lock size={22} className="text-gray-400" />
        </div>

        {/* Central Card */}
        <div className="relative z-10 w-52 h-52 md:w-72 md:h-72 bg-[#09090b] rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-16 shadow-[0_0_80px_-15px_rgba(168,85,247,0.25)] group mt-10">
          {/* Subtle gradient border effect */}
          <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] p-[1.5px] bg-gradient-to-tr from-indigo-600/70 via-purple-500/20 to-pink-500/70 [mask-image:linear-gradient(white,white)] -z-10 transition-all duration-500 opacity-90"></div>
          {/* Inner dark area */}
          <div className="absolute inset-[1.5px] bg-[#05050A] rounded-[calc(2rem-1.5px)] md:rounded-[calc(2.5rem-1.5px)] -z-10"></div>
          
          <Layers 
            size={84} 
            className="text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] group-hover:scale-105 transition-transform duration-500" 
            style={{ 
              stroke: 'url(#brand-gradient)', 
              strokeWidth: 1.5,
              fill: 'url(#brand-gradient)',
              fillOpacity: 0.05
            }} 
          />
          <svg width="0" height="0">
            <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop stopColor="#3B82F6" offset="0%" />
              <stop stopColor="#A855F7" offset="50%" />
              <stop stopColor="#EC4899" offset="100%" />
            </linearGradient>
          </svg>
        </div>

        {/* Bottom Text */}
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h3 className="text-white font-medium text-lg leading-relaxed mb-3">The realm of Alpha Quant</h3>
          <p className="text-[#71717a] text-sm md:text-base leading-relaxed font-light">
            The realm of Alpha Quant, providing strategic insights and practical<br className="hidden md:block"/> wisdom to steer your trading towards sustainable expansion.
          </p>
        </div>
      </div>
    </section>
  );
}
