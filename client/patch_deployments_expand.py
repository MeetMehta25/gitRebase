import re

with open("client/src/pages/PaperTradingPage.tsx", "r") as f:
    text = f.read()

# I will replace the DeploymentsView entirely
old_deployments_view = text[text.find("function DeploymentsView() {"):text.find("export function PaperTradingPage() {")]

new_deployments_view = """function DeploymentsView() {
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedSession, setExpandedSession] = React.useState<string | null>(null);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sessions.map(s => {
        const isExpanded = expandedSession === s.session_id;
        const p = s.payload || {};
        
        return (
        <div key={s.session_id} 
             onClick={() => setExpandedSession(isExpanded ? null : s.session_id)}
             style={{
          background: "rgba(255,255,255,0.02)",
          border: isExpanded ? "1px solid rgba(147,51,234,0.3)" : "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          transition: "all 0.2s"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{s.strategy_name || s.ticker}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Ticker: {s.ticker} • Capital: ₹{s.capital?.toLocaleString()}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <span style={{ 
                  background: s.status === "active" ? "rgba(16, 185, 129, 0.15)" : s.status === "paused" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)", 
                  color: s.status === "active" ? "#10b981" : s.status === "paused" ? "#f59e0b" : "#ef4444", 
                  padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase" 
                }}>
                  {s.status}
                </span>
                <span style={{ 
                  color: s.pnl >= 0 ? "#10b981" : "#ef4444", 
                  fontSize: 13, fontWeight: 600 
                }}>
                  PnL: {s.pnl >= 0 ? "+" : ""}₹{(s.pnl || 0).toLocaleString()} ({parseFloat(s.pnl_percent || 0).toFixed(2)}%)
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {s.status === "active" ? (
                <button onClick={(e) => handleUpdateStatus(s.session_id, "paused", e)} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Pause</button>
              ) : s.status === "paused" ? (
                <button onClick={(e) => handleUpdateStatus(s.session_id, "active", e)} style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Resume</button>
              ) : null}
              <button onClick={(e) => handleDelete(s.session_id, e)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
          
          {isExpanded && (
            <div style={{ 
              marginTop: 20, 
              paddingTop: 16, 
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Strategy Rules</div>
                {p.strategy_from_debate?.entry_rules ? (
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                    {p.strategy_from_debate.entry_rules.map((rule: string, i: number) => <li key={`er-${i}`}>{rule}</li>)}
                    {p.strategy_from_debate.exit_rules?.map((rule: string, i: number) => <li key={`ex-${i}`}>{rule}</li>)}
                  </ul>
                ) : (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Standard strategy parameters without specified natural language rules.</div>
                )}
              </div>
              
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Configuration</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Initial Capital</span>
                    <span>₹{s.initial_capital?.toLocaleString() || p.initial_capital?.toLocaleString() || "100,000"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Timeframe</span>
                    <span>{p.timeframe || "1d"}</span>
                  </div>
                  {p.parameters?.position_size_pct !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Position Size</span>
                      <span>{p.parameters.position_size_pct}%</span>
                    </div>
                  )}
                  {p.parameters?.stop_loss_pct !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Stop Loss</span>
                      <span>{p.parameters.stop_loss_pct}%</span>
                    </div>
                  )}
                  {p.parameters?.take_profit_pct !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Take Profit</span>
                      <span>{p.parameters.take_profit_pct}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )})}
    </div>
  );
}
"""

text = text.replace(old_deployments_view, new_deployments_view)

with open("client/src/pages/PaperTradingPage.tsx", "w") as f:
    f.write(text)

