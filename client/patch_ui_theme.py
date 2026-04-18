import re

with open("/Users/shauryakitavat/Desktop/biteraser/client/src/pages/PaperTradingPage.tsx", "r") as f:
    text = f.read()

start_idx = text.find("function DeploymentsView() {")
end_idx = text.find("export function PaperTradingPage() {")

if start_idx != -1 and end_idx != -1:
    new_deployments = """function DeploymentsView() {
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/paper_trading/sessions");
      const data = await res.json();
      if (data.success) setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:5000/api/paper_trading/sessions/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to stop and delete this deployed strategy?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/paper_trading/sessions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) return <div className="text-gray-400 opacity-60 text-sm">Loading deployments...</div>;
  if (sessions.length === 0) return <div className="text-gray-400 opacity-50 text-sm text-center p-10">No strategies currently deployed.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {sessions.map(s => {
        const p = s.payload || {};
        
        return (
        <div key={s.session_id} 
             className="bg-white dark:bg-[#18181b] rounded-xl p-6 flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border dark:border-[#27272a]">
          {/* Header Row */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{s.strategy_name || s.ticker}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">By Live Trading Engine</div>
            </div>
            {/* Top Right Dots */}
            <div className="text-slate-400 dark:text-slate-500 cursor-pointer p-1">⋮</div>
          </div>
          
          {/* 2x2 Grid Stats */}
          <div className="grid grid-cols-2 gap-4 my-6">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.timeframe || "1d"}</div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Timeframe</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">₹{(s.capital || 100000).toLocaleString()}</div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Capital Allocation</div>
            </div>
            <div>
              <div style={{ color: s.status === 'active' ? '#10b981' : s.status === 'paused' ? '#f59e0b' : '#ef4444' }} className="text-sm font-semibold">
                {s.status.toUpperCase()}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Status</div>
            </div>
            <div>
              <div style={{ color: s.pnl >= 0 ? '#10b981' : '#ef4444' }} className="text-sm font-semibold">
                {s.pnl >= 0 ? "+" : ""}₹{(s.pnl || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Realized PnL</div>
            </div>
          </div>

          {/* Rules List / Positions list style */}
          <div className="flex flex-col gap-3 flex-grow">
            {p.strategy_from_debate?.entry_rules && p.strategy_from_debate.entry_rules.length > 0 && (
              <div className="bg-slate-100 dark:bg-[#27272a] rounded-lg px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 flex justify-between">
                <span className="truncate mr-2">ENTRY: {p.strategy_from_debate.entry_rules[0]}</span>
                <span className="text-slate-400 whitespace-nowrap">Pct: {p.parameters?.position_size_pct || 10}%</span>
              </div>
            )}
            
            {p.strategy_from_debate?.exit_rules && p.strategy_from_debate.exit_rules.length > 0 && (
              <div className="bg-slate-100 dark:bg-[#27272a] rounded-lg px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 flex justify-between">
                <span className="truncate mr-2">EXIT: {p.strategy_from_debate.exit_rules[0]}</span>
                <span className="text-slate-400 whitespace-nowrap">SL: {p.parameters?.stop_loss_pct || 2}%</span>
              </div>
            )}
            
            {(!p.strategy_from_debate || (!p.strategy_from_debate.entry_rules && !p.strategy_from_debate.exit_rules)) && (
               <div className="bg-slate-100 dark:bg-[#27272a] rounded-lg px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">
                 Standard Template Active
               </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-6">
            <button 
              onClick={(e) => handleDelete(s.session_id, e)}
              className="flex-1 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#3f3f46] text-slate-500 dark:text-slate-400 py-2.5 rounded-md text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-[#27272a] transition-colors"
            >
              Delete
            </button>
            <button 
              onClick={(e) => handleUpdateStatus(s.session_id, s.status === 'active' ? 'paused' : 'active', e)}
              className="flex-1 text-white py-2.5 rounded-md text-[13px] font-semibold transition-colors"
              style={{ background: s.status === 'active' ? "#f59e0b" : "#2563eb" }}
            >
              {s.status === 'active' ? "Pause" : "Resume"}
            </button>
          </div>

        </div>
      )})}
    </div>
  );
}

"""
    text = text[:start_idx] + new_deployments + text[end_idx:]
    with open("/Users/shauryakitavat/Desktop/biteraser/client/src/pages/PaperTradingPage.tsx", "w") as f:
        f.write(text)
    print("Patched with responsive dark/light tailwind!")
else:
    print("Indexes not found!")
