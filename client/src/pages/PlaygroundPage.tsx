import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Play,
  Wand2,
  Calendar,
  Settings2,
  Globe,
  ChevronDown,
  Zap,
  ArrowLeft,
  FlaskConical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SAMPLE_STRATEGIES } from "../data/sampleStrategies";

const validationSuites = [
  {
    id: "walk-forward",
    title: "Walk-forward test",
    sub: "Train / test splits",
    enabled: true
  },
  { id: "overfitting", title: "Overfitting score", sub: "Rules vs. data length", enabled: true },
  { id: "monte-carlo", title: "Monte Carlo", sub: "1000 path simulation", enabled: true },
];

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — purple / near-black, flat & refined, zero glow
   bg:          #080610
   surface:     #0d0b1a
   surface-hi:  #121025
   border:      #1c1830
   border-hi:   #2a2545
   muted:       #3d3560
   mid:         #6b5fa0
   accent:      #9d87f5   (purple, used sparingly)
   text-lo:     #5a5180
   text-mid:    #b8b0d8
   text-hi:     #eae6f8
   ───────────────────────────────────────────────────────────────────────────── */

const injectCSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap');

.pg { font-family: 'Plus Jakarta Sans', sans-serif; }
.pg-display { font-family: 'Bricolage Grotesque', sans-serif; }
.pg-mono { font-family: 'JetBrains Mono', monospace; }

/* Noise grain for depth */
.pg-grain::after {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none; z-index: 999;
  opacity: 0.028;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Scrollbar hidden */
.pg-scroll { overflow-y: auto; scrollbar-width: none; }
.pg-scroll::-webkit-scrollbar { display: none; }

/* Staggered fade-up */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.anim-1 { animation: fadeUp 0.35s ease both 0.04s; }
.anim-2 { animation: fadeUp 0.35s ease both 0.10s; }
.anim-3 { animation: fadeUp 0.35s ease both 0.16s; }
.anim-4 { animation: fadeUp 0.35s ease both 0.22s; }

/* Card */
.pg-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.2);
}
.pg-card:hover { 
  border-color: rgba(255, 255, 255, 0.15); 
  background: rgba(255, 255, 255, 0.04);
}

/* Input / textarea / select base */
.pg-field {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  outline: none;
  transition: all 0.2s ease;
  -webkit-appearance: none; appearance: none;
}
.pg-field:hover { border-color: rgba(255, 255, 255, 0.2); }
.pg-field:focus { 
  border-color: #a855f7; 
  background: rgba(0, 0, 0, 0.3); 
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.15);
}
.pg-field::placeholder { color: #64748b; }
input[type=date].pg-field { color-scheme: dark; }
textarea.pg-field { resize: none; line-height: 1.65; }
select.pg-field { padding-right: 32px; cursor: pointer; }

/* Hide number spinners */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }

/* Pill toggle */
.pg-pill {
  display: flex; gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 4px;
}
.pg-pill-btn {
  flex: 1; padding: 8px 0;
  font-size: 12px; font-weight: 600; letter-spacing: 0.01em;
  font-family: 'Plus Jakarta Sans', sans-serif;
  border: none; background: transparent; color: #94a3b8;
  cursor: pointer; border-radius: 8px;
  transition: all 0.2s ease;
}
.pg-pill-btn:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
.pg-pill-btn.on {
  background: #a855f7;
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(168, 85, 247, 0.3);
}

/* Run button — flat purple */
.pg-run {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700; font-size: 13.5px; letter-spacing: 0.02em;
  border: none; border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
}
.pg-run:hover { 
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
}
.pg-run:active { transform: scale(0.975); }

/* Section header label */
.pg-label {
  display: block;
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: #cbd5e1;
  margin-bottom: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Card header */
.pg-ch { display: flex; align-items: flex-start; gap: 14px; }
.pg-ch-icon {
  width: 36px; height: 36px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(168, 85, 247, 0.1); 
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 10px;
  color: #c084fc;
}
.pg-ch-title { font-size: 15px; font-weight: 600; color: #f8fafc; line-height: 1.3; }
.pg-ch-sub   { font-size: 12px; color: #94a3b8; margin-top: 3px; }

/* Divider */
.pg-div { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 6px 0; }

/* Select chevron */
.pg-sel { position: relative; }
.pg-sel-arrow { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #94a3b8; }

/* Suffix input */
.pg-suf { position: relative; }
.pg-suf-label { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 500; color: #94a3b8; pointer-events: none; font-family: 'JetBrains Mono', monospace; }

/* Header stat */
.pg-hstat { display: flex; flex-direction: column; gap: 2px; }
.pg-hstat-l { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
.pg-hstat-v { font-size: 13.5px; font-weight: 600; color: #f8fafc; font-family: 'JetBrains Mono', monospace; }

/* Horizontal rule with label */
.pg-section-sep {
  display: flex; align-items: center; gap: 10px;
  font-size: 9px; font-weight: 700; letter-spacing: 0.14em;
  text-transform: uppercase; color: #2e2850;
  font-family: 'JetBrains Mono', monospace;
}
.pg-section-sep::before,
.pg-section-sep::after { content: ''; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.08); }

/* Suite Cards */
.pg-suite-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.2);
}
.pg-suite-card:hover { 
  border-color: #a855f7; 
  background: rgba(168, 85, 247, 0.08);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 30px rgba(168, 85, 247, 0.2);
}
.pg-suite-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1.2;
}
.pg-suite-sub {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.pg-back:hover { background: rgba(255, 255, 255, 0.08) !important; color: #fff !important; }

/* Sample Strategy button */
.pg-sample-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  color: #c084fc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pg-sample-btn:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.5);
  color: #d8b4fe;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
}
.pg-sample-btn:active { transform: scale(0.97); }

/* Filled indicator */
@keyframes sampleFill {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
}
.pg-filled { animation: sampleFill 0.3s ease both; }
`;

/* ── helpers ── */

function Label({ children }: { children: React.ReactNode }) {
  return <span className="pg-label">{children}</span>;
}

function SelControlled({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pg-sel">
      <select
        className="pg-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <ChevronDown size={14} strokeWidth={2.5} className="pg-sel-arrow" />
    </div>
  );
}

function NumControlled({
  value,
  onChange,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="pg-suf">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="pg-field"
        style={{ paddingRight: suffix ? 44 : 14 }}
      />
      {suffix && <span className="pg-suf-label">{suffix}</span>}
    </div>
  );
}

function CH({
  icon: Icon,
  title,
  sub,
}: {
  icon: any;
  title: string;
  sub: string;
}) {
  return (
    <div className="pg-ch">
      <div className="pg-ch-icon">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <div className="pg-ch-title">{title}</div>
        <div className="pg-ch-sub">{sub}</div>
      </div>
    </div>
  );
}

/* ── Page ── */

export function PlaygroundPage() {
  const [selectedSuite, setSelectedSuite] = useState<any>(null);
  const navigate = useNavigate();

  // Controlled form state
  const [strategyDesc, setStrategyDesc] = useState("");
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2025-01-01");
  const [timeframe, setTimeframe] = useState("1-Day");
  const [asset, setAsset] = useState("Stock");
  const [universe, setUniverse] = useState("NIFTY 50");
  const [entryTiming, setEntryTiming] = useState("At Market Open");
  const [maxHolding, setMaxHolding] = useState(30);
  const [maxPositions, setMaxPositions] = useState(5);
  const [initialCapital, setInitialCapital] = useState(1000000);
  const [stopLoss, setStopLoss] = useState(10);
  const [commission, setCommission] = useState(0);
  const [buyOrderPriority, setBuyOrderPriority] = useState(
    "Market Cap ↓ — Large cap first",
  );
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const loadSampleStrategy = () => {
    if (!selectedSuite) return;
    const sample = SAMPLE_STRATEGIES[selectedSuite.id];
    if (!sample) return;

    setStrategyDesc(sample.strategyDescription);
    setDateFrom(sample.dateFrom);
    setDateTo(sample.dateTo);
    setTimeframe(sample.timeframe);
    setAsset(sample.assetClass);
    setUniverse(sample.universe);
    setEntryTiming(sample.entryTiming);
    setMaxHolding(sample.maxHolding);
    setMaxPositions(sample.maxPositions);
    setInitialCapital(sample.initialCapital);
    setStopLoss(sample.stopLoss);
    setCommission(sample.commission);
    setBuyOrderPriority(sample.buyOrderPriority);
    setSampleLoaded(true);
    setTimeout(() => setSampleLoaded(false), 600);
  };

  // Reset form when switching suites
  const selectSuite = (suite: any) => {
    setSelectedSuite(suite);
    setStrategyDesc("");
    setDateFrom("2024-01-01");
    setDateTo("2025-01-01");
    setTimeframe("1-Day");
    setAsset("Stock");
    setUniverse("NIFTY 50");
    setEntryTiming("At Market Open");
    setMaxHolding(30);
    setMaxPositions(5);
    setInitialCapital(1000000);
    setStopLoss(10);
    setCommission(0);
    setBuyOrderPriority("Market Cap ↓ — Large cap first");
    setSampleLoaded(false);
  };

  if (!selectedSuite) {
    return (
      <div
        className="pg"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <style>{injectCSS}</style>

        <div
          className="pg-scroll"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
          }}
        >
          <div style={{ margin: "auto", maxWidth: 1000, width: "100%" }}>
            <div
              style={{ textAlign: "center", marginBottom: 48 }}
              className="anim-1"
            >
              <h1
                className="pg-display"
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#f8fafc",
                  marginBottom: 16,
                }}
              >
                Quantitative Validation Suite
              </h1>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 16,
                  maxWidth: 600,
                  margin: "0 auto",
                  lineHeight: 1.6,
                }}
              >
                Select a robust testing method to configure and validate your
                strategy simulation before execution.
              </p>
            </div>

            <div
              className="anim-2 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {validationSuites.map((s) => (
                <div
                  key={s.id}
                  className={`pg-suite-card ${!s.enabled ? 'disabled' : ''}`}
                  onClick={() => s.enabled && selectSuite(s)}
                  style={!s.enabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <div className="pg-suite-title">{s.title}</div>
                  <div className="pg-suite-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pg"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <style>{injectCSS}</style>

      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          height: 50,
          zIndex: 20,
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          background: "transparent",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setSelectedSuite(null)}
              className="pg-back"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#94a3b8",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Back to Suite Selection"
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              <Zap size={15} style={{ color: "#c084fc" }} strokeWidth={2} />
            </div>
            <span
              className="pg-display"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#f8fafc",
                letterSpacing: "-0.02em",
              }}
            >
              Playground
            </span>
            <div
              style={{
                width: 1,
                height: 16,
                background: "rgba(255, 255, 255, 0.15)",
              }}
            />
            <span
              className="pg-mono"
              style={{ fontSize: 12, color: "#94a3b8" }}
            >
              {selectedSuite.title}
            </span>
          </div>
          {/* Right — Sample Strategy button + stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="pg-sample-btn" onClick={loadSampleStrategy}>
              <FlaskConical size={14} strokeWidth={2} />
              Sample Strategy
            </button>
            <div
              style={{
                width: 1,
                height: 20,
                background: "rgba(255, 255, 255, 0.1)",
              }}
            />
            {[
              ["Last run", "—"],
              ["Sharpe", "—"],
              ["CAGR", "—"],
            ].map(([l, v]) => (
              <div key={l} className="pg-hstat">
                <span className="pg-hstat-l">{l}</span>
                <span className="pg-hstat-v">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="pg-scroll" style={{ flex: 1, position: "relative" }}>
        <div
          className={sampleLoaded ? "pg-filled" : ""}
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            margin: "0 auto",
            padding: "20px 24px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* ── Strategy Logic ── */}
          <div
            className="pg-card anim-1"
            style={{
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <CH
              icon={Wand2}
              title="Strategy Logic"
              sub="Describe your entry & exit conditions in plain language"
            />
            <div className="pg-div" />
            <div>
              <Label>Entry &amp; exit description</Label>
              <textarea
                rows={4}
                className="pg-field pg-mono"
                style={{ fontSize: 12 }}
                value={strategyDesc}
                onChange={(e) => setStrategyDesc(e.target.value)}
                placeholder={
                  "e.g. Go long when price closes above the upper Keltner Channel (10, 10).\nExit when price drops below the lower band, or after 30 days."
                }
              />
            </div>
          </div>

          {/* ── Period + Universe ── */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div
              className="pg-card anim-2"
              style={{
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <CH
                icon={Calendar}
                title={`${selectedSuite.title} Period`}
                sub="Set the date range for simulation"
              />
              <div className="pg-div" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <Label>From</Label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pg-field"
                  />
                </div>
                <div>
                  <Label>To</Label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pg-field"
                  />
                </div>
              </div>
              <div>
                <Label>Timeframe</Label>
                <SelControlled value={timeframe} onChange={setTimeframe}>
                  <option>1-Day</option>
                  <option>1-Hour</option>
                  <option>15-Min</option>
                  <option>5-Min</option>
                  <option>1-Min</option>
                </SelControlled>
              </div>
            </div>

            <div
              className="pg-card anim-2"
              style={{
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <CH
                icon={Globe}
                title="Universe &amp; Asset"
                sub="Choose instruments to trade"
              />
              <div className="pg-div" />
              <div>
                <Label>Asset class</Label>
                <div className="pg-pill">
                  {["Stock", "Crypto", "Forex", "ETF"].map((o) => (
                    <button
                      key={o}
                      className={cn("pg-pill-btn", asset === o && "on")}
                      onClick={() => setAsset(o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Universe</Label>
                <SelControlled value={universe} onChange={setUniverse}>
                  <option>NIFTY 50</option>
                  <option>NIFTY NEXT 50</option>
                  <option>NIFTY MIDCAP 100</option>
                  <option>Watchlist</option>
                  <option>Single Ticker</option>
                </SelControlled>
              </div>
            </div>
          </div>

          {/* ── Trading Model ── */}
          <div
            className="pg-card anim-3"
            style={{
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <CH
              icon={Settings2}
              title="Trading Model"
              sub="Execution timing, position sizing &amp; risk management"
            />
            <div className="pg-div" />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px 20px",
              }}
            >
              <div>
                <Label>Entry timing</Label>
                <SelControlled value={entryTiming} onChange={setEntryTiming}>
                  <option>At Market Open</option>
                  <option>At Market Close</option>
                  <option>Intraday</option>
                </SelControlled>
              </div>
              <div>
                <Label>Max holding</Label>
                <NumControlled
                  value={maxHolding}
                  onChange={setMaxHolding}
                  suffix="days"
                />
              </div>
              <div>
                <Label>Max positions</Label>
                <NumControlled
                  value={maxPositions}
                  onChange={setMaxPositions}
                />
              </div>
              <div>
                <Label>Initial capital</Label>
                <NumControlled
                  value={initialCapital}
                  onChange={setInitialCapital}
                />
              </div>
              <div>
                <Label>Stop loss</Label>
                <NumControlled
                  value={stopLoss}
                  onChange={setStopLoss}
                  suffix="%"
                />
              </div>
              <div>
                <Label>Commission</Label>
                <NumControlled
                  value={commission}
                  onChange={setCommission}
                  suffix="%"
                />
              </div>
            </div>

            <div className="pg-div" />

            <div style={{ maxWidth: 360 }}>
              <Label>Buy order priority</Label>
              <SelControlled
                value={buyOrderPriority}
                onChange={setBuyOrderPriority}
              >
                <option>Market Cap ↓ — Large cap first</option>
                <option>Market Cap ↑ — Small cap first</option>
                <option>Volume ↓ — High liquidity first</option>
                <option>Price ↓ — High price first</option>
              </SelControlled>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <footer
        style={{
          flexShrink: 0,
          zIndex: 30,
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          background: "transparent",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "11px 24px",
        }}
      >
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span className="pg-mono" style={{ fontSize: 12, color: "#cbd5e1" }}>
            Configure all fields · then run your simulation
          </span>
          <button
            onClick={() =>
              navigate("/backtest-run-2", {
                state: {
                  suiteId: selectedSuite.id,
                  suiteTitle: selectedSuite.title,
                },
              })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-sm font-medium shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          >
            <Play className="w-4 h-4" /> Run {selectedSuite.title}
          </button>
        </div>
      </footer>
    </div>
  );
}
