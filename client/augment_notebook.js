const fs = require('fs');

let content = fs.readFileSync('src/pages/StrategyNotebookSandbox.tsx', 'utf8');

if (!content.includes('recharts')) {
  content = content.replace(
    /import \{ motion, AnimatePresence \} from 'framer-motion';/,
    \import { motion, AnimatePresence } from 'framer-motion';\nimport { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, ComposedChart } from 'recharts';\
  );
}

const mockDataCode = \
const MOCK_EQUITY_DATA = Array.from({ length: 40 }).map((_, i) => ({
  date: new Date(2023, 2 + i, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
  strategy: 10 + i * 1.5 + Math.random() * 5 - 2.5,
  sp500: 10 + i * 0.8 + Math.random() * 3 - 1.5,
}));

const MOCK_MONTHLY_RETURNS = Array.from({ length: 24 }).map((_, i) => ({
  date: new Date(2024, i, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
  value: Math.random() * 12 - 4.5
}));

const MOCK_DISTRIBUTION = [
  { range: '<= -10.43%', count: 7 },
  { range: '-5.42%~-2.91%', count: 13 },
  { range: '2.11%~4.62%', count: 11 },
  { range: '9.64%~12.15%', count: 9 },
  { range: '17.16%~19.67%', count: 7 },
  { range: '24.69%~27.20%', count: 2 },
  { range: '32.22%~34.73%', count: 2 },
  { range: '> 34.73%', count: 7 },
];

const MOCK_DRAWDOWN = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(2023, 2 + i, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
  value: -(Math.random() * 9 + 1)
}));

const MOCK_TRADES = [
  { symbol: 'GOOGL', trades: 6, winRate: '50.00%', avgReturn: '+7.52%', bestReturn: '+36.04%', worstLoss: '-9.78%' },
  { symbol: 'NVDA', trades: 6, winRate: '66.67%', avgReturn: '+18.73%', bestReturn: '+77.85%', worstLoss: '-10.12%' },
  { symbol: 'AAPL', trades: 5, winRate: '40.00%', avgReturn: '+4.51%', bestReturn: '+31.44%', worstLoss: '-8.37%' },
  { symbol: 'GOOG', trades: 5, winRate: '20.00%', avgReturn: '-1.83%', bestReturn: '+12.65%', worstLoss: '-11.43%' },
  { symbol: 'ABBV', trades: 4, winRate: '25.00%', avgReturn: '-4.74%', bestReturn: '+1.60%', worstLoss: '-10.56%' },
  { symbol: 'AMZN', trades: 4, winRate: '50.00%', avgReturn: '+4.93%', bestReturn: '+24.50%', worstLoss: '-13.25%' },
  { symbol: 'JNJ', trades: 4, winRate: '50.00%', avgReturn: '+0.36%', bestReturn: '+3.72%', worstLoss: '-2.86%' },
  { symbol: 'META', trades: 4, winRate: '25.00%', avgReturn: '+2.51%', bestReturn: '+27.87%', worstLoss: '-10.11%' },
  { symbol: 'MU', trades: 4, winRate: '75.00%', avgReturn: '+35.54%', bestReturn: '+87.22%', worstLoss: '-3.89%' },
  { symbol: 'NFLX', trades: 4, winRate: '75.00%', avgReturn: '+7.20%', bestReturn: '+27.89%', worstLoss: '-3.18%' },
];

\nexport default function StrategyNotebookSandbox() {\n\;

content = content.replace(/export default function StrategyNotebookSandbox\(\) \{/, mockDataCode);

const oldResultsOutputBlock = \  const ResultsOutputCard = ({ data }: { data: any }) => (\;

const newResultsOutputBlock = \  const ResultsOutputCard = ({ data }: { data: any }) => {
    const [activeTab, setActiveTab] = useState('overview');
    return (\;

content = content.replace(oldResultsOutputBlock, newResultsOutputBlock);

const oldEndResultsOutputBlock = \          Optimal version's Backtest Raw Input: {data.aiReview.rawInput}
        </div>
      </div>
    </div>
  );\;

const newEndResultsOutputBlock = \          Optimal version's Backtest Raw Input: {data.aiReview.rawInput}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-8 mb-4">
        <div className="flex items-center gap-2 mb-6 bg-[#1a1a1a] w-fit p-1 rounded-full border border-gray-800">
          <button 
            onClick={() => setActiveTab('overview')}
            className={\px-5 py-2 rounded-full text-sm font-medium transition-all \\}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('trades')}
            className={\px-5 py-2 rounded-full text-sm font-medium transition-all \\}
          >
            Trades
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 bg-[#111] p-6 rounded-xl border border-gray-800">
            <div>
              <div className="flex items-center gap-6 mb-4">
                <h4 className="text-white font-bold">Equity curve (Strategy vs. S&P 500)</h4>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2"><span className="w-6 h-2 bg-[#2dd4bf] rounded-full"></span>Strategy 61.07%</div>
                  <div className="flex items-center gap-2"><span className="w-6 h-2 bg-[#3b82f6] rounded-full border border-dashed border-blue-400"></span>S&P 500 48.51%</div>
                </div>
              </div>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={MOCK_EQUITY_DATA}>
                    <defs>
                      <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="date" stroke="#555" tick={{fill: '#777'}} dy={10} />
                    <YAxis stroke="#555" tick={{fill: '#777'}} tickFormatter={(val) => \\%\} dx={-10} />
                    <RechartsTooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                    <Area type="monotone" dataKey="strategy" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorStrategy)" strokeWidth={2} />
                    <Line type="monotone" dataKey="sp500" stroke="#3b82f6" dot={false} strokeWidth={2} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Monthly returns heatmap</h4>
              <div className="h-48 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_MONTHLY_RETURNS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="date" stroke="#555" tick={{fill: '#777'}} dy={10} />
                    <YAxis stroke="#555" tick={{fill: '#777'}} tickFormatter={(val) => \\%\} dx={-10} />
                    <RechartsTooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                    <Bar dataKey="value">
                      {MOCK_MONTHLY_RETURNS.map((entry, index) => (
                        <Cell key={\cell-\\} fill={entry.value > 0 ? '#2dd4bf' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Return distribution</h4>
              <div className="h-48 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_DISTRIBUTION}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="range" stroke="#555" tick={{fill: '#777'}} dy={10} />
                    <YAxis stroke="#555" tick={{fill: '#777'}} dx={-10} />
                    <RechartsTooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                    <Bar dataKey="count" fill="#2dd4bf" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Drawdown</h4>
              <div className="h-48 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_DRAWDOWN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="date" stroke="#555" tick={{fill: '#777'}} dy={10} />
                    <YAxis stroke="#555" tick={{fill: '#777'}} tickFormatter={(val) => \\%\} dx={-10} />
                    <RechartsTooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-4 border-t border-gray-800 pt-4">Disclaimer: Results are hypothetical and for research only; not investment advice.</div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="bg-[#111] p-6 rounded-xl border border-gray-800 overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
              <input type="text" placeholder="Search by symbol" className="bg-[#1a1a1a] border border-gray-800 text-sm px-4 py-2 rounded-md focus:outline-none focus:border-indigo-500 text-gray-300 w-64" />
              <div className="text-sm text-gray-500">71 tickers total</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="pb-3 px-4 font-medium">Symbol</th>
                    <th className="pb-3 px-4 font-medium">Trades <span className="opacity-50 text-[10px]">▼</span></th>
                    <th className="pb-3 px-4 font-medium">Win rate <span className="opacity-50 text-[10px]">▼</span></th>
                    <th className="pb-3 px-4 font-medium">Average return <span className="opacity-50 text-[10px]">▼</span></th>
                    <th className="pb-3 px-4 font-medium">Best trade return <span className="opacity-50 text-[10px]">▼</span></th>
                    <th className="pb-3 px-4 font-medium">Worst trade loss <span className="opacity-50 text-[10px]">▼</span></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRADES.map((t, idx) => (
                    <tr key={idx} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-medium text-[#2dd4bf]">{t.symbol}</td>
                      <td className="py-4 px-4 text-gray-300">{t.trades}</td>
                      <td className="py-4 px-4 text-gray-300">{t.winRate}</td>
                      <td className={\py-4 px-4 \\}>{t.avgReturn}</td>
                      <td className={\py-4 px-4 \\}>{t.bestReturn}</td>
                      <td className={\py-4 px-4 \\}>{t.worstLoss}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }\;

content = content.replace(oldEndResultsOutputBlock, newEndResultsOutputBlock);

fs.writeFileSync('src/pages/StrategyNotebookSandbox.tsx', content);
console.log('Script completed.');
