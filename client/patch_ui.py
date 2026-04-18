import re

with open("client/src/pages/PaperTradingPage.tsx", "r") as f:
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

  if (loading) return <div style={{ color: "#fff", opacity: 0.6, fontSize: 14 }}>Loading deployments...</div>;
  if (sessions.length === 0) return <div style={{ color: "#fff", opacity: 0.5, fontSize: 14, textAlign: "center", padding: 40 }}>No strategies currently deployed.</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 }}>
      {sessions.map(s => {
        const p = s.payload || {};
        
        return (
        <div key={s.session_id} 
             style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          color: "#212529"
        }}>
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{s.strategy_name || s.ticker}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>By Live Trading Engine</div>
            </div>
            {/* Top Right Dots */}
            <div style={{ color: "#94a3b8", cursor: "pointer", padding: 4 }}>⋮</div>
          </div>
          
          {/* 2x2 Grid Stats */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: 16, 
            marginTop: 24,
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{p.timeframe || "1d"}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>Timeframe</div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>₹{(s.capital || 100000).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>Capital Allocation</div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: s.status === 'active' ? '#10b981' : s.status === 'paused' ? '#f59e0b' : '#ef4444' }}>
                {s.status.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>Status</div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: s.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                {s.pnl >= 0 ? "+" : ""}₹{(s.pnl || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>Realized PnL</div>
            </div>
          </div>

          {/* Rules List / Positions list style */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flexGrow: 1 }}>
            {p.strategy_from_debate?.entry_rules && p.strategy_from_debate.entry_rules.length > 0 && (
              <div style={{ background: "#f1f5f9", borderRadius: 8, padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", justifyContent: "space-between" }}>
                <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>ENTRY: {p.strategy_from_debate.entry_rules[0]}</span>
                <span style={{ color: "#94a3b8", marginLeft: 8 }}>Pct: {p.parameters?.position_size_pct || 10}%</span>
              </div>
            )}
            
            {p.strategy_from_debate?.exit_rules && p.strategy_from_debate.exit_rules.length > 0 && (
              <div style={{ background: "#f1f5f9", borderRadius: 8, padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", justifyContent: "space-between" }}>
                <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>EXIT: {p.strategy_from_debate.exit_rules[0]}</span>
                <span style={{ color: "#94a3b8", marginLeft: 8 }}>SL: {p.parameters?.stop_loss_pct || 2}%</span>
              </div>
            )}
            
            {(!p.strategy_from_debate || (!p.strategy_from_debate.entry_rules && !p.strategy_from_debate.exit_rules)) && (
               <div style={{ background: "#f1f5f9", borderRadius: 8, padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#475569", textAlign: "center" }}>
                 Standard Template Active
               </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button 
              onClick={(e) => handleDelete(s.session_id, e)}
              style={{
                flex: 1, border: "1px solid #e2e8f0", background: "#fff", 
                color: "#64748b", padding: "10px 0", borderRadius: 6,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Delete
            </button>
            <button 
              onClick={(e) => handleUpdateStatus(s.session_id, s.status === 'active' ? 'paused' : 'active', e)}
              style={{
                flex: 1, border: "none", background: s.status === 'active' ? "#f59e0b" : "#2563eb", 
                color: "#fff", padding: "10px 0", borderRadius: 6,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s"
              }}
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
    with open("client/src/pages/PaperTradingPage.tsx", "w") as f:
        f.write(text)
    print("UI Layout successfully patched to match the light theme grid!")
else:
    print("Indexes not found!")
