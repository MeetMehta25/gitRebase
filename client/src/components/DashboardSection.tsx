import image1 from '../assets/image1.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';
import { motion } from 'framer-motion';

type ScrollRevealTextProps = {
  text: string;
  alignRight?: boolean;
};

const ScrollRevealText = ({ text, alignRight = false }: ScrollRevealTextProps) => {
  const words = text.split(' ');

  return (
    <motion.p
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.5 }}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.04
          }
        }
      }}
      className={`font-['Geist_Mono'] text-sm md:text-base leading-8 mt-4 flex flex-wrap gap-x-[0.35em] gap-y-1 ${alignRight ? 'md:justify-end max-md:justify-start' : 'justify-start'}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={{
            hidden: { opacity: 0.18, y: 8, color: '#52526a' },
            visible: { opacity: 1, y: 0, color: '#f9fafb' }
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
};

const featureDescription1 =
  'Bring your trading ideas to life with a powerful NLP-powered strategy backtesting environment.Simply describe your strategy in natural language just like you would explain it to another trader and the system transforms it into a fully testable quantitative model. Whether it\'s mean reversion, trend following, or breakout logic, the AI interprets your intent and builds the strategy structure instantly'

const featureDescription2 =
  'Transform complex market data into clear, actionable trading intelligence with your personal AI Quant Coach.This intelligent assistant continuously analyzes market signals, strategy performance, and volatility regimes to provide real-time guidance for traders and quantitative researchers. Through natural language interaction, users can ask questions, test ideas, and refine strategies directly within the platform.';

const featureDescription3 =
  'Design trading strategies with a powerful node-based visual workflow built for traders, quants, and researchers.Instead of writing complex code, you can construct strategies by connecting triggers, indicators, entry rules, exit conditions, and risk management blocks into a structured trading system. Each component represents a part of the strategy logic, allowing you to visually map how decisions are made in the market.';

const featureDescription4 =
  'Experiment, analyze, and validate trading ideas in a powerful interactive quant research environment designed for systematic strategy development,The Strategy Notebook Sandbox provides a cell-based workflow similar to a research notebook, allowing traders and quantitative analysts to build strategies step by step. Each cell represents a stage in the strategy pipeline from loading market data and calculating indicators to defining strategy logic and running backtests.';
const features = [
  { title: 'AI-Driven Strategy Arena', description: featureDescription1, image: image1 },
  { title: 'AI Quant Coach', description: featureDescription2, image: image2 },
  { title: 'Visual Strategy Builder', description: featureDescription3, image: image3 },
  { title: 'Strategy Notebook Sandbox', description: featureDescription4, image: image4 }
];

export function DashboardSection() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 py-24 text-white overflow-hidden">
      <div
        className="absolute left-1/2 top-20 bottom-20 w-0.5 -translate-x-1/2 max-md:hidden z-0"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(250,204,21,0.35) 0 20%, rgba(255,255,255,0) 20% 40%, rgba(250,204,21,0.2) 40% 60%, rgba(255,255,255,0) 60% 100%)',
          backgroundSize: '2px 26px',
          backgroundRepeat: 'repeat-y'
        }}
      />

      <div className="flex flex-col gap-24 md:gap-32 relative z-10">
        {features.map((feature, index) => {
          const isEven = index % 2 === 0;

          return (
            <div
              key={feature.title}
              className="relative grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0.55 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-[#FACC15] shadow-[0_0_25px_6px_rgba(250,204,21,0.35)] -translate-x-1/2 -translate-y-1/2 max-md:hidden z-20"
              />

              {isEven ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -45 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="col-span-1 relative"
                  >
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#181824] p-3 shadow-2xl transition-all duration-500 hover:border-[#FACC15]/35 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] z-10">
                      <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-auto aspect-4/3 object-contain rounded-2xl brightness-95"
                      />
                    </div>
                    <div className="absolute -top-8 -left-8 w-28 h-28 bg-[#FACC15]/10 rounded-full blur-3xl -z-10" />
                  </motion.div>

                  <div className="col-span-1 md:pl-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="px-4 py-1.5 rounded-full bg-[#181824] border border-white/15 text-[11px] font-semibold text-[#FACC15] uppercase tracking-[0.2em]">
                        Feature 0{index + 1}
                      </div>
                      <div className="h-px bg-white/15 flex-1" />
                    </div>
                    <h2 className="font-['Geist_Mono'] text-3xl md:text-4xl font-semibold tracking-tight text-white/95">
                      {feature.title}
                    </h2>
                    <ScrollRevealText text={feature.description} />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1 md:pr-8 flex flex-col justify-center max-md:order-2">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-px bg-white/15 flex-1 max-md:hidden" />
                      <div className="px-4 py-1.5 rounded-full bg-[#181824] border border-white/15 text-[11px] font-semibold text-[#FACC15] uppercase tracking-[0.2em]">
                        Feature 0{index + 1}
                      </div>
                      <div className="h-px bg-white/15 flex-1 md:hidden" />
                    </div>
                    <h2 className="font-['Geist_Mono'] text-3xl md:text-4xl font-semibold tracking-tight text-white/95 md:text-right text-left">
                      {feature.title}
                    </h2>
                    <ScrollRevealText text={feature.description} alignRight />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: 45 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="col-span-1 relative max-md:order-1"
                  >
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#181824] p-3 shadow-2xl transition-all duration-500 hover:border-[#FACC15]/35 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] z-10">
                      <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-auto aspect-4/3 object-contain rounded-2xl brightness-95"
                      />
                    </div>
                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-[#FACC15]/10 rounded-full blur-3xl -z-10" />
                  </motion.div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

