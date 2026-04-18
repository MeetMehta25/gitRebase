import re

with open("client/src/pages/PaperTradingPage.tsx", "r") as f:
    text = f.read()

insert_point = "        {view === \"history\" && ("

deployments_code = """
        {view === "deploy" && (
          <div
            style={{
              padding: "24px 34px",
              background: "rgba(10,12,18,0.72)",
              border: `1px solid ${"rgba(255,255,255,0.06)"}`,
              borderRadius: 22,
              backdropFilter: "blur(18px)",
              marginTop: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "#fff", fontWeight: 700, letterSpacing: -0.3 }}>
                Live Deployments
              </h2>
            </div>
            
            <DeploymentsView />
          </div>
        )}
"""

if "<DeploymentsView />" not in text:
    text = text.replace(insert_point, deployments_code + "\n" + insert_point)

import_insert = "export function PaperTradingPage() {"
deployments_cmp = """
import React from 'react';

function DeploymentsView() {
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/paper_trading/sessions/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to stop and delete this deployed strategy?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/paper_trading/sessions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) return <div style={{ color: "#fff", opacity: 0.6, fontSize: 14 }}>Loading deployments...</div>;
  if (sessions.length === 0) return <div style={{ color: "#fff", opacity: 0.5, fontSize: 14, textAlign: "center", padding: 40 }}>No strategies currently deployed.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sessions.map(s => (
        <div key={s.session_id} style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
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
              <button onClick={() => handleUpdateStatus(s.session_id, "paused")} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Pause</button>
            ) : s.status === "paused" ? (
              <button onClick={() => handleUpdateStatus(s.session_id, "active")} style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Resume</button>
            ) : null}
            <button onClick={() => handleDelete(s.session_id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
"""

if "function DeploymentsView()" not in text:
    text = text.replace(import_insert, deployments_cmp + "\n" + import_insert)

with open("/Users/shauryakitavat/Desktop/biteraser/client/src/pages/PaperTradingPage.tsx", "w") as f:
    f.write(text)

print("Deployments patched")
