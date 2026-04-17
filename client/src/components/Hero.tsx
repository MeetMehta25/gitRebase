import { ArrowUpRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-25 pb-20 px-4 text-center max-w-5xl mx-auto relative z-10">
      <h1 className="font-sans text-5xl md:text-7xl lg:text-[6rem] font-medium tracking-tighter mb-8 leading-[1.05] text-gray-200">
        Smarter Strategies, <br />
        Simpler Trading Research <span className="italic font-light text-white">Interface</span>
      </h1>
      
      <p className="text-gray-400 text-sm md:text-base font-sans max-w-2xl mx-auto mb-12 leading-relaxed">
        Experiment with trading ideas, simulate strategies, and analyze  <br className="hidden md:block" />
        performance using an intelligent backtesting sandbox.
      </p>
      
      <div className="flex items-center justify-center gap-4">
        <button className="flex items-center gap-2 bg-[#11111A]/80 border border-white/10 text-[#FACC15] font-sans text-sm px-6 py-2.5 rounded-full hover:bg-white/5 transition-all">
          Get Started <ArrowUpRight size={16} />
        </button>
        <button className="flex items-center gap-2 bg-[#11111A]/80 border border-white/10 text-white font-sans text-sm px-6 py-2.5 rounded-full hover:bg-white/5 transition-all">
          Go To Dashboard <ArrowUpRight size={16} />
        </button>
      </div>
    </section>
  );
}
