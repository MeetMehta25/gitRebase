/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DynamicsSection } from './components/DynamicsSection';
import { DashboardSection } from './components/DashboardSection';
import { StatsSection } from './components/StatsSection';
import { Footer } from './components/Footer';
import { BentoGrid } from './components/BentoGrid';

export default function App() {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden flex flex-col relative bg-[#05050A]">
      {/* Global background from Image 1 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base gradient matching the dark space look */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(42,27,61,0.4)_0%,rgba(11,10,20,1)_60%)]"></div>
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[60px_60px] mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        
        {/* Glowing stars/nodes scattered like in the image */}
        <div className="absolute top-[10%] left-[30%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_20px_3px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute bottom-[40%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute top-[60%] right-[35%] w-2 h-2 bg-white/50 rounded-full shadow-[0_0_30px_5px_rgba(255,255,255,0.4)] blur-[1px]"></div>
      </div>

      <Navbar />
      
      <main className="grow pt-24 relative z-10">
        <Hero />
        <BentoGrid/>
        <DashboardSection />
        <DynamicsSection />
        <StatsSection />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

