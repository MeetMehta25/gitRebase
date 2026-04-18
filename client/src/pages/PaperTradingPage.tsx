import { useLocation } from "react-router-dom";
// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts";

const BLUE = "#9ca3af";
const LIGHT_BLUE = "#d1d5db";
const DIM = "rgba(156,163,175,0.18)";
const GREEN = "#00c896";
const RED = "#ff5c5c";

const DEFAULT_POSITIONS = [
  {
    ticker: "RELIANCE.NS",
    name: "Reliance Industries",
    shares: 150,
    avgCost: 2825.5,
    sector: "Energy",
  },
  {
    ticker: "INFY.NS",
    name: "Infosys",
    shares: 400,
    avgCost: 1620.25,
    sector: "Technology",
  },
  {
    ticker: "TCS.NS",
    name: "Tata Consultancy Services",
    shares: 200,
    avgCost: 3880.4,
    sector: "Technology",
  },
  {
    ticker: "HDFCBANK.NS",
    name: "HDFC Bank",
    shares: 350,
    avgCost: 1585.1,
    sector: "Financials",
  },
];

const DEFAULT_HISTORY = [
  {
    id: 1,
    date: "2026-03-12",
    type: "BUY",
    ticker: "RELIANCE.NS",
    qty: 50,
    price: 2942.3,
    note: "Earnings play",
  },
  {
    id: 2,
    date: "2026-03-10",
    type: "SELL",
    ticker: "ICICIBANK.NS",
    qty: 100,
    price: 1128.4,
    note: "Take profit",
  },
  {
    id: 3,
    date: "2026-03-08",
    type: "BUY",
    ticker: "INFY.NS",
    qty: 100,
    price: 1668.2,
    note: "Dip buy",
  },
  {
    id: 4,
    date: "2026-03-05",
    type: "BUY",
    ticker: "TCS.NS",
    qty: 200,
    price: 3920.4,
    note: "Swing trade",
  },
];

const BASE_PRICES = {
  "RELIANCE.NS": 2948.2,
  "INFY.NS": 1674.5,
  "TCS.NS": 4082.2,
  "HDFCBANK.NS": 1612.9,
  "ICICIBANK.NS": 1128.4,
  "SBIN.NS": 822.3,
  "LT.NS": 3742.5,
  "AXISBANK.NS": 1132.2,
};

const PIE_COLORS = [
  "#374151",
  "#4b5563",
  "#6b7280",
  "#9ca3af",
  "#d1d5db",
  "#e5e7eb",
];

/* ── candlestick generator ── */
function genCandles(base, n = 40) {
  const candles = [];
  let price = base;
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.022;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const vol = Math.floor(Math.random() * 8000000 + 2000000);
    candles.push({
      i,
      open: +open.toFixed(2),
      close: +close.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      vol,
      bull: close >= open,
      date: new Date(now - (n - i) * 86400000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });
    price = close;
  }
  return candles;
}

/* ── RSI calculator ── */
function calcRSI(candles, period = 14) {
  const closes = candles.map((c) => c.close);
  const gains = [],
    losses = [];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gains.push(d > 0 ? d : 0);
    losses.push(d < 0 ? -d : 0);
  }
  const rsi = [];
  for (let i = period; i < gains.length; i++) {
    const avgG = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgL =
      losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const rs = avgL === 0 ? 100 : avgG / avgL;
    rsi.push({
      i: i + 1,
      rsi: +(100 - 100 / (1 + rs)).toFixed(1),
      date: candles[i + 1]?.date || "",
    });
  }
  return rsi;
}

/* ── MA calculator ── */
function calcMA(candles, period) {
  return candles.map((c, i) => {
    if (i < period - 1) return { ...c, ma: null };
    const avg =
      candles.slice(i - period + 1, i + 1).reduce((s, x) => s + x.close, 0) /
      period;
    return { ...c, ma: +avg.toFixed(2) };
  });
}

/* ── drawdown series ── */
function calcDrawdown(curve) {
  let peak = -Infinity;
  return curve.map((pt) => {
    if (pt.value > peak) peak = pt.value;
    const dd = peak > 0 ? +(((pt.value - peak) / peak) * 100).toFixed(2) : 0;
    return { ...pt, drawdown: dd };
  });
}

/* ── daily returns ── */
function calcDailyReturns(curve) {
  return curve.slice(1).map((pt, i) => {
    const prev = curve[i].value;
    const ret = prev > 0 ? +(((pt.value - prev) / prev) * 100).toFixed(3) : 0;
    return { day: pt.day, ret, pos: ret >= 0 };
  });
}

/* ─── HOOKS ── */
function useLivePrice(tickers) {
  const [prices, setPrices] = useState(() => {
    const p = {};
    tickers.forEach((t) => {
      p[t] = BASE_PRICES[t] || 100;
    });
    return p;
  });
  const [changes, setChanges] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchPrices = async () => {
      if (!tickers || tickers.length === 0) return;
      try {
        const res = await fetch("http://localhost:5000/api/data/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers }),
        });
        const data = await res.json();
        if (data.success && isMounted) {
          const newPrices = {};
          const newChanges = {};

          Object.entries(data.data).forEach(([t, d]) => {
            newPrices[t] = d.price;
            newChanges[t] = d.change;
          });

          setPrices((prev) => ({ ...prev, ...newPrices }));
          setChanges((prev) => ({ ...prev, ...newChanges }));
        }
      } catch (err) {
        console.error("Failed to fetch live prices", err);
      }
    };

    fetchPrices();
    const iv = setInterval(fetchPrices, 300000);
    return () => {
      isMounted = false;
      clearInterval(iv);
    };
  }, [tickers.join(",")]);

  return { prices, changes };
}

function useEquityCurve(positions, prices) {
  const [curve, setCurve] = useState([]);
  useEffect(() => {
    const days = 60;
    let base = positions.reduce((s, p) => s + p.shares * p.avgCost, 0) + 450111;
    const pts = [];
    for (let i = 0; i < days; i++) {
      const t = i / (days - 1);
      const noise = Math.sin(i * 0.4) * 0.01 + (Math.random() - 0.5) * 0.006;
      const trend = 0.18 * t + noise;
      pts.push({
        day: i + 1,
        value: +(base * (1 + trend)).toFixed(0),
        label: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" },
        ),
      });
    }
    const live =
      positions.reduce(
        (s, p) => s + p.shares * (prices[p.ticker] || p.avgCost),
        0,
      ) + 450111;
    pts[pts.length - 1].value = +live.toFixed(0);
    setCurve(pts);
  }, [JSON.stringify(prices)]);
  return curve;
}

/* ─── UI PRIMITIVES ── */
const G = ({ children, extra = {}, ...rest }) => (
  <div
    style={{
      background: "rgba(24,24,27,0.75)",
      backdropFilter: "blur(20px) saturate(160%)",
      WebkitBackdropFilter: "blur(20px) saturate(160%)",
      border: `1px solid ${DIM}`,
      borderRadius: 16,
      ...extra,
    }}
    {...rest}
  >
    {children}
  </div>
);

const Badge = ({ children, color = BLUE }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: 1,
      color,
      background: `${color}18`,
      border: `1px solid ${color}38`,
      padding: "3px 9px",
      borderRadius: 6,
    }}
  >
    {children}
  </span>
);

const Label = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      letterSpacing: 2,
      color: "rgba(255,255,255,0.28)",
      fontWeight: 700,
      marginBottom: 14,
    }}
  >
    {children}
  </div>
);

const MiniTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(20,20,22,0.97)",
        border: `1px solid ${DIM}`,
        borderRadius: 10,
        padding: "9px 14px",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
        {payload[0]?.payload?.label ||
          payload[0]?.payload?.date ||
          `Day ${payload[0]?.payload?.day}`}
      </div>
      <div style={{ color: LIGHT_BLUE, fontSize: 14, fontWeight: 800 }}>
        ₹{(+(payload[0]?.value || 0)).toLocaleString()}
      </div>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value || 0);
  return (
    <div
      style={{
        background: "rgba(20,20,22,0.97)",
        border: `1px solid ${DIM}`,
        borderRadius: 10,
        padding: "9px 14px",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
        {label || payload[0]?.payload?.name || "Position"}
      </div>
      <div style={{ color: LIGHT_BLUE, fontSize: 14, fontWeight: 800 }}>
        ₹{value.toLocaleString()}
      </div>
    </div>
  );
};

const PriceFlash = ({ v, prev }) => {
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (prev !== undefined && v !== prev) {
      setFlash(v > prev ? "up" : "dn");
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [v]);
  return (
    <span
      style={{
        transition: "color 0.3s",
        color: flash === "up" ? "#d1d5db" : flash === "dn" ? "#ff5c5c" : "#fff",
        fontWeight: 800,
      }}
    >
      ₹{v?.toFixed(2)}
    </span>
  );
};

/* ─── CANDLESTICK using SVG inside recharts ── */
const CandleBar = (props) => {
  const { x, y, width, height, open, close, high, low, bull } = props;
  if (!x || !y || !width || !height) return null;
  const color = bull ? GREEN : RED;
  const cx = x + width / 2;
  // map price to pixel using the chart's coordinate system
  return (
    <g>
      <rect
        x={x + width * 0.15}
        y={y}
        width={width * 0.7}
        height={Math.max(1, Math.abs(height))}
        fill={color}
        fillOpacity={0.9}
        rx={1}
      />
    </g>
  );
};

/* Custom candlestick chart using pure SVG */
const CandleChart = ({ data, height = 240 }) => {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  if (!data.length) return null;

  const padL = 52,
    padR = 10,
    padT = 10,
    padB = 28;
  const W = "100%";

  const prices = data.flatMap((d) => [d.high, d.low]);
  const minP = Math.min(...prices) * 0.9985;
  const maxP = Math.max(...prices) * 1.0015;
  const priceRange = maxP - minP;

  const toY = (p, h) => padT + ((maxP - p) / priceRange) * (h - padT - padB);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ display: "block" }}
      >
        <defs>
          <clipPath id="cclip">
            <rect
              x={padL}
              y={padT}
              width="100%"
              height={height - padT - padB}
            />
          </clipPath>
        </defs>
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const price = minP + t * priceRange;
          return (
            <g key={i}>
              <line
                x1={padL}
                x2="99%"
                y1={toY(price, height)}
                y2={toY(price, height)}
                stroke="rgba(156,163,175,0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={padL - 4}
                y={toY(price, height) + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.2)"
                fontSize={9}
                fontFamily="'Geist Mono',monospace"
              >
                {price >= 1000
                  ? `₹${(price / 1000).toFixed(1)}k`
                  : `₹${price.toFixed(0)}`}
              </text>
            </g>
          );
        })}
        {/* candles group */}
        <g clipPath="url(#cclip)">
          <CandlesSVG
            data={data}
            minP={minP}
            maxP={maxP}
            padL={padL}
            padR={padR}
            padT={padT}
            padB={padB}
            height={height}
            onHover={setTooltip}
          />
        </g>
        {/* x-axis labels */}
        {data
          .filter((_, i) => i % 8 === 0)
          .map((d) => {
            const n = data.length;
            const slotW = (800 - padL - padR) / n;
            const xpos = padL + d.i * slotW + slotW / 2;
            return (
              <text
                key={d.i}
                x={`${((d.i / n) * 100).toFixed(1)}%`}
                y={height - 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.2)"
                fontSize={9}
                fontFamily="'Geist Mono',monospace"
              >
                {d.date}
              </text>
            );
          })}
      </svg>
      {tooltip && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: padL + 8,
            background: "rgba(20,20,22,0.95)",
            border: `1px solid ${DIM}`,
            borderRadius: 10,
            padding: "8px 12px",
            pointerEvents: "none",
            zIndex: 10,
            fontSize: 11,
            fontFamily: "'Geist Mono',monospace",
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
            {tooltip.date}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px 12px",
            }}
          >
            {[
              ["O", tooltip.open],
              ["H", tooltip.high],
              ["L", tooltip.low],
              ["C", tooltip.close],
            ].map(([k, v]) => (
              <div key={k}>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>{k} </span>
                <span style={{ color: tooltip.bull ? GREEN : RED }}>
                  ₹{v?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            Vol {(tooltip.vol / 1e6).toFixed(1)}M
          </div>
        </div>
      )}
    </div>
  );
};

const CandlesSVG = ({
  data,
  minP,
  maxP,
  padL,
  padR,
  padT,
  padB,
  height,
  onHover,
}) => {
  const n = data.length;
  const priceRange = maxP - minP;
  const toY = (p) => padT + ((maxP - p) / priceRange) * (height - padT - padB);

  // We use relative percentages for x so SVG scales
  return (
    <g>
      {data.map((d, idx) => {
        const xPct = ((idx + 0.5) / n) * 100;
        const slotPct = (0.8 / n) * 100;
        const bodyTop = toY(Math.max(d.open, d.close));
        const bodyBot = toY(Math.min(d.open, d.close));
        const bodyH = Math.max(1, bodyBot - bodyTop);
        const color = d.bull ? GREEN : RED;
        return (
          <g
            key={idx}
            onMouseEnter={() => onHover(d)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "crosshair" }}
          >
            {/* wick */}
            <line
              x1={`${xPct}%`}
              x2={`${xPct}%`}
              y1={toY(d.high)}
              y2={toY(d.low)}
              stroke={color}
              strokeWidth={0.8}
              strokeOpacity={0.7}
            />
            {/* body */}
            <rect
              x={`${xPct - slotPct / 2}%`}
              y={bodyTop}
              width={`${slotPct}%`}
              height={bodyH}
              fill={color}
              fillOpacity={0.88}
              rx={0.5}
            />
          </g>
        );
      })}
    </g>
  );
};

/* ─── MODALS ── */
const ImportModal = ({ onClose, onImport }) => {
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState("csv");
  const [err, setErr] = useState("");
  const tmpl = {
    csv: `ticker,shares,avgCost,sector\nRELIANCE.NS,150,2825.50,Energy`,
    json: `[{"ticker":"RELIANCE.NS","shares":150,"avgCost":2825.50,"sector":"Energy"}]`,
  };
  const parse = () => {
    setErr("");
    try {
      if (!raw || !raw.trim()) throw new Error("Please enter data");

      if (mode === "json") {
        const d = JSON.parse(raw);
        const arr = Array.isArray(d) ? d : [d];
        const pos = arr
          .map((r) => ({
            ticker: (r.ticker || r.symbol || "").toUpperCase(),
            name: r.name || r.ticker || r.symbol || "Unknown",
            shares: +(r.shares || r.qty || 0),
            avgCost: +(r.avgCost ?? r.avg_cost ?? r.cost ?? r.price ?? 0),
            sector: r.sector || "Equity",
          }))
          .filter((p) => p.ticker && p.shares > 0);

        if (!pos.length) throw new Error("No valid JSON rows found");
        onImport(pos);
        onClose();
      } else {
        const lines = raw.trim().split("\n").filter(Boolean);
        if (lines.length < 2)
          throw new Error("Need a header and at least one data row");

        const hdr = lines[0]
          .toLowerCase()
          .split(",")
          .map((s) => s.trim());
        const pos = lines
          .slice(1)
          .map((l) => {
            const v = l.split(",").map((s) => s.trim());
            const o = {};
            hdr.forEach((h, i) => {
              o[h] = v[i];
            });
            return {
              ticker: (o.ticker || o.symbol || "").toUpperCase(),
              name: o.name || o.ticker || o.symbol || "Unknown",
              shares: +(o.shares || o.qty || 0),
              avgCost: +(o.avgcost || o.avg_cost || o.cost || o.price || 0),
              sector: o.sector || "Equity",
            };
          })
          .filter((p) => p.ticker && p.shares > 0);

        if (!pos.length) throw new Error("No valid CSV rows found");
        onImport(pos);
        onClose();
      }
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,12,0.88)",
        backdropFilter: "blur(10px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <G extra={{ padding: 32, width: 520, position: "relative" }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        <div
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          Import Portfolio
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 18,
          }}
        >
          Paste CSV or JSON of your holdings
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["csv", "json"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                background: mode === m ? `${BLUE}22` : "transparent",
                border: `1px solid ${mode === m ? BLUE : DIM}`,
                borderRadius: 8,
                padding: "5px 16px",
                color: mode === m ? "#d1d5db" : "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => setRaw(tmpl[mode])}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: `1px solid ${DIM}`,
              borderRadius: 8,
              padding: "5px 14px",
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Template
          </button>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={tmpl[mode]}
          style={{
            width: "100%",
            height: 160,
            background: `${BLUE}08`,
            border: `1px solid ${DIM}`,
            borderRadius: 10,
            padding: 12,
            color: "#e2e8f0",
            fontSize: 12,
            fontFamily: "'Geist Mono',monospace",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            lineHeight: 1.6,
          }}
          onFocus={(e) => (e.target.style.border = `1px solid ${BLUE}88`)}
          onBlur={(e) => (e.target.style.border = `1px solid ${DIM}`)}
        />
        {err && (
          <div
            style={{
              color: RED,
              fontSize: 12,
              marginTop: 8,
              padding: "7px 12px",
              background: "rgba(255,92,92,0.08)",
              borderRadius: 8,
            }}
          >
            ⚠ {err}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${DIM}`,
              borderRadius: 12,
              padding: 11,
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={parse}
            style={{
              flex: 2,
              background: `linear-gradient(135deg,#374151,#6b7280)`,
              border: "none",
              borderRadius: 12,
              padding: 11,
              color: "#fff",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: `0 0 22px ${BLUE}44`,
            }}
          >
            Import
          </button>
        </div>
      </G>
    </div>
  );
};

const AddTradeModal = ({ onClose, onAdd }) => {
  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "BUY",
    ticker: "",
    qty: "",
    price: "",
    note: "",
  });
  const [err, setErr] = useState("");
  const s = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const submit = () => {
    if (!f.ticker || !f.qty || !f.price) {
      setErr("Ticker, qty and price required");
      return;
    }
    onAdd({
      id: Date.now(),
      ...f,
      ticker: f.ticker.toUpperCase(),
      qty: +f.qty,
      price: +f.price,
    });
    onClose();
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,12,0.88)",
        backdropFilter: "blur(10px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <G extra={{ padding: 32, width: 420, position: "relative" }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        <div
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          Log Trade
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 18,
          }}
        >
          Add buy or sell to your history
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["BUY", "SELL"].map((t) => (
            <button
              key={t}
              onClick={() => s("type", t)}
              style={{
                flex: 1,
                background:
                  f.type === t
                    ? t === "BUY"
                      ? `${BLUE}22`
                      : "rgba(255,92,92,0.12)"
                    : "transparent",
                border: `1px solid ${f.type === t ? (t === "BUY" ? GREEN : RED) : DIM}`,
                borderRadius: 9,
                padding: 9,
                color:
                  f.type === t
                    ? t === "BUY"
                      ? GREEN
                      : RED
                    : "rgba(255,255,255,0.3)",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          {[
            { l: "DATE", k: "date", t: "date" },
            { l: "TICKER", k: "ticker", t: "text", ph: "RELIANCE.NS" },
            { l: "QTY", k: "qty", t: "number", ph: "100" },
            { l: "PRICE", k: "price", t: "number", ph: "2948.50" },
          ].map((x) => (
            <div key={x.k}>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.28)",
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  marginBottom: 6,
                }}
              >
                {x.l}
              </div>
              <input
                type={x.t}
                value={f[x.k]}
                onChange={(e) => s(x.k, e.target.value)}
                placeholder={x.ph || ""}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: `${BLUE}08`,
                  border: `1px solid ${DIM}`,
                  borderRadius: 9,
                  padding: "9px 11px",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "'Geist Mono',monospace",
                  outline: "none",
                  transition: "border 0.2s",
                }}
                onFocus={(e) => (e.target.style.border = `1px solid ${BLUE}88`)}
                onBlur={(e) => (e.target.style.border = `1px solid ${DIM}`)}
              />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.28)",
              fontWeight: 700,
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            NOTE
          </div>
          <input
            value={f.note}
            onChange={(e) => s("note", e.target.value)}
            placeholder="e.g. Earnings play"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: `${BLUE}08`,
              border: `1px solid ${DIM}`,
              borderRadius: 9,
              padding: "9px 11px",
              color: "#fff",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.border = `1px solid ${BLUE}88`)}
            onBlur={(e) => (e.target.style.border = `1px solid ${DIM}`)}
          />
        </div>
        {err && (
          <div style={{ color: RED, fontSize: 12, marginBottom: 10 }}>
            ⚠ {err}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${DIM}`,
              borderRadius: 12,
              padding: 11,
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              flex: 2,
              background: `linear-gradient(135deg,#374151,#6b7280)`,
              border: "none",
              borderRadius: 12,
              padding: 11,
              color: "#fff",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Add Trade
          </button>
        </div>
      </G>
    </div>
  );
};

const Marquee = ({ prices, changes }) => {
  const tickers = Object.keys(prices);
  return (
    <div
      style={{
        overflow: "hidden",
        borderTop: `1px solid ${DIM}`,
        borderBottom: `1px solid ${DIM}`,
        padding: "7px 0",
        marginBottom: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 36,
          animation: "marquee 28s linear infinite",
          whiteSpace: "nowrap",
        }}
      >
        {[...tickers, ...tickers].map((t, i) => {
          const ch = changes[t] || 0;
          return (
            <span
              key={i}
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontFamily: "'Geist Mono',monospace",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.45)", marginRight: 5 }}>
                {t}
              </span>
              <span style={{ color: "#fff", marginRight: 4 }}>
                ₹{(prices[t] || 0).toFixed(2)}
              </span>
              <span style={{ color: ch >= 0 ? GREEN : RED }}>
                {ch >= 0 ? "+" : ""}
                {ch}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════ MAIN ══════════════ */

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

export function PaperTradingPage() {
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [trades, setTrades] = useState(DEFAULT_HISTORY);
  const location = useLocation();
  const [view, setView] = useState(location.state?.tab || "dashboard");
  const [showImport, setShowImport] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [orderTicker, setOrderTicker] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderType, setOrderType] = useState("Market");
  const [orderSide, setOrderSide] = useState("BUY");
  const [orderFlash, setOrderFlash] = useState(null);
  const [prevPrices, setPrevPrices] = useState({});
  const [candleTicker, setCandleTicker] = useState("RELIANCE.NS");

  const allTickers = [
    ...new Set([
      ...positions.map((p) => p.ticker),
      ...Object.keys(BASE_PRICES),
    ]),
  ];
  const { prices, changes } = useLivePrice(allTickers);
  const curve = useEquityCurve(positions, prices);

  // pre-generate candle data per ticker (stable ref)
  const [candleData] = useState(() => {
    const d = {};
    Object.keys(BASE_PRICES).forEach((t) => {
      d[t] = genCandles(BASE_PRICES[t]);
    });
    return d;
  });

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
  }, []);
  useEffect(() => {
    setPrevPrices((p) => ({ ...p, ...prices }));
  }, [JSON.stringify(prices)]);

  const portfolioValue = positions.reduce(
    (s, p) => s + p.shares * (prices[p.ticker] || p.avgCost),
    0,
  );
  const costBasis = positions.reduce((s, p) => s + p.shares * p.avgCost, 0);
  const totalPnL = portfolioValue - costBasis;
  const totalPct = costBasis ? (totalPnL / costBasis) * 100 : 0;
  const accountValue = portfolioValue + 450111;
  const todayPnL = positions.reduce((s, p) => {
    const ch = (changes[p.ticker] || 0) / 100;
    return s + p.shares * (prices[p.ticker] || p.avgCost) * ch;
  }, 0);

  const sectorMap = {};
  positions.forEach((p) => {
    const v = p.shares * (prices[p.ticker] || p.avgCost);
    sectorMap[p.sector] = (sectorMap[p.sector] || 0) + v;
  });
  const pieData = Object.entries(sectorMap).map(([name, value]) => ({
    name,
    value: +value.toFixed(0),
  }));
  const barData = positions.map((p) => ({
    name: p.ticker,
    value: +(p.shares * (prices[p.ticker] || p.avgCost)).toFixed(0),
    pnl: +(p.shares * ((prices[p.ticker] || p.avgCost) - p.avgCost)).toFixed(0),
  }));

  const drawdown = calcDrawdown(curve);
  const dailyRet = calcDailyReturns(curve);
  const activeCdl = candleData[candleTicker] || [];
  const withMA20 = calcMA(activeCdl, 20);
  const withMA50 = calcMA(activeCdl, 50);
  const candleWithMA = activeCdl.map((c, i) => ({
    ...c,
    ma20: withMA20[i]?.ma,
    ma50: withMA50[i]?.ma,
  }));
  const rsiData = calcRSI(activeCdl);

  const placeOrder = () => {
    if (!orderTicker || !orderQty) return;
    const t = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: orderSide,
      ticker: orderTicker.toUpperCase(),
      qty: +orderQty,
      price: +(orderPrice || prices[orderTicker.toUpperCase()] || 0),
      note: `${orderType} order`,
    };
    setTrades((x) => [t, ...x]);
    setPositions((prev) => {
      const ex = prev.find((p) => p.ticker === t.ticker);
      if (orderSide === "BUY") {
        if (ex) {
          const ns = ex.shares + t.qty;
          return prev.map((p) =>
            p.ticker === t.ticker
              ? {
                  ...p,
                  shares: ns,
                  avgCost: +(
                    (ex.shares * ex.avgCost + t.qty * t.price) /
                    ns
                  ).toFixed(2),
                }
              : p,
          );
        }
        return [
          ...prev,
          {
            ticker: t.ticker,
            name: t.ticker,
            shares: t.qty,
            avgCost: t.price,
            sector: "Equity",
          },
        ];
      } else {
        if (ex) {
          const r = ex.shares - t.qty;
          return r <= 0
            ? prev.filter((p) => p.ticker !== t.ticker)
            : prev.map((p) =>
                p.ticker === t.ticker ? { ...p, shares: r } : p,
              );
        }
        return prev;
      }
    });
    setOrderFlash(orderSide);
    setTimeout(() => setOrderFlash(null), 1800);
    setOrderTicker("");
    setOrderQty("");
    setOrderPrice("");
  };

  const fd = (n, d = 2) => (typeof n === "number" ? n.toFixed(d) : n);
  const nav = [
    { key: "dashboard", l: "Dashboard" },
    { key: "analytics", l: "Analytics" },
    { key: "history", l: "Trade History" }, { key: "deploy", l: "Deployments" },
  ];

  const tipStyle = {
    background: "rgba(8,2,20,0.97)",
    border: `1px solid ${DIM}`,
    borderRadius: 10,
    fontSize: 11,
    padding: "8px 12px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'Geist','Outfit',sans-serif",
        color: "#fff",
      }}
    >
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={(p) => setPositions(p)}
        />
      )}
      {showAddTrade && (
        <AddTradeModal
          onClose={() => setShowAddTrade(false)}
          onAdd={(t) => setTrades((p) => [t, ...p])}
        />
      )}

      <div
        style={{
          maxWidth: "100%",
          margin: "0 auto",
          padding: "10px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* NAV */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-12px)",
            transition: "all 0.45s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 3,
              background: `${BLUE}08`,
              border: `1px solid ${DIM}`,
              borderRadius: 11,
              padding: 3,
            }}
          >
            {nav.map((n) => (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                style={{
                  background:
                    view === n.key
                      ? `linear-gradient(135deg,#374151,#6b7280)`
                      : "transparent",
                  color: view === n.key ? "#fff" : "rgba(255,255,255,0.3)",
                  border: "none",
                  borderRadius: 9,
                  padding: "6px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 0.3,
                  transition: "all 0.2s",
                  boxShadow: view === n.key ? `0 0 14px ${BLUE}44` : "none",
                }}
              >
                {n.l}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowImport(true)}
              style={{
                background: "transparent",
                border: `1px solid ${DIM}`,
                borderRadius: 9,
                padding: "7px 14px",
                color: "rgba(255,255,255,0.45)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⬆ Import CSV
            </button>
            <button
              onClick={() => setShowAddTrade(true)}
              style={{
                background: `linear-gradient(135deg,#374151,#6b7280)`,
                border: "none",
                borderRadius: 9,
                padding: "7px 16px",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: `0 0 18px ${BLUE}44`,
              }}
            >
              + Log Trade
            </button>
          </div>
        </nav>

        <Marquee prices={prices} changes={changes} />

        {/* ══ DASHBOARD ══ */}
        {view === "dashboard" && (
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease 0.1s",
            }}
          >
            {/* stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                marginBottom: 14,
              }}
            >
              {[
                {
                  l: "ACCOUNT VALUE",
                  v: `₹${accountValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  sub: `${totalPct >= 0 ? "+" : ""}${fd(totalPct)}% total return`,
                  c: BLUE,
                },
                {
                  l: "PORTFOLIO",
                  v: `₹${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  sub: `${positions.length} open positions`,
                  c: "#d1d5db",
                },
                {
                  l: "UNREALIZED P&L",
                  v: `${totalPnL >= 0 ? "+" : "-"}₹${Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  sub: `cost ₹${costBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  c: totalPnL >= 0 ? GREEN : RED,
                },
                {
                  l: "TODAY",
                  v: `${todayPnL >= 0 ? "+" : "-"}₹${Math.abs(todayPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  sub: "live estimate",
                  c: todayPnL >= 0 ? GREEN : RED,
                },
              ].map((c, i) => (
                <G
                  key={i}
                  extra={{
                    padding: "20px 22px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "default",
                    transition: "transform 0.2s,box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = `0 18px 48px rgba(0,0,0,0.4),0 0 0 1px ${c.c}33`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: `linear-gradient(90deg,transparent,${c.c}77,transparent)`,
                    }}
                  />
                  <Label>{c.l}</Label>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      letterSpacing: "-1px",
                      color: "#fff",
                      marginBottom: 5,
                      fontFamily: "'Geist Mono','Fira Code',monospace",
                    }}
                  >
                    {c.v}
                  </div>
                  <div style={{ fontSize: 11, color: c.c, fontWeight: 600 }}>
                    {c.sub}
                  </div>
                </G>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 290px 220px",
                gap: 12,
                marginBottom: 12,
              }}
            >
              {/* equity */}
              <G extra={{ padding: "20px 22px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <Label>EQUITY CURVE · 60D</Label>
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 900,
                        letterSpacing: "-1.2px",
                        fontFamily: "'Geist Mono',monospace",
                      }}
                    >
                      ₹{(accountValue / 1e6).toFixed(3)}M
                    </div>
                  </div>
                  <Badge color={totalPct >= 0 ? GREEN : RED}>
                    {totalPct >= 0 ? "+" : ""}
                    {fd(totalPct)}%
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart
                    data={curve}
                    margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BLUE} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={`${BLUE}09`}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={9}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      content={<MiniTip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={BLUE}
                      strokeWidth={2}
                      fill="url(#eq)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: LIGHT_BLUE,
                        stroke: "#17181c",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </G>

              {/* quick order */}
              <G
                extra={{
                  padding: "20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Label>QUICK ORDER</Label>
                <div style={{ display: "flex", gap: 5 }}>
                  {["BUY", "SELL"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderSide(s)}
                      style={{
                        flex: 1,
                        background:
                          orderSide === s
                            ? s === "BUY"
                              ? `${BLUE}22`
                              : "rgba(255,92,92,0.12)"
                            : "transparent",
                        border: `1px solid ${orderSide === s ? (s === "BUY" ? GREEN : RED) : DIM}`,
                        borderRadius: 9,
                        padding: "8px 0",
                        fontSize: 11,
                        fontWeight: 900,
                        color:
                          orderSide === s
                            ? s === "BUY"
                              ? GREEN
                              : RED
                            : "rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        letterSpacing: 1,
                        transition: "all 0.2s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {[
                  { ph: "Symbol", v: orderTicker, s: setOrderTicker, up: true },
                  { ph: "Qty", v: orderQty, s: setOrderQty, t: "number" },
                  {
                    ph: "Price (blank=market)",
                    v: orderPrice,
                    s: setOrderPrice,
                    t: "number",
                  },
                ].map((f, i) => (
                  <input
                    key={i}
                    type={f.t || "text"}
                    value={f.v}
                    onChange={(e) =>
                      f.s(f.up ? e.target.value.toUpperCase() : e.target.value)
                    }
                    placeholder={f.ph}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: `${BLUE}08`,
                      border: `1px solid ${DIM}`,
                      borderRadius: 9,
                      padding: "9px 11px",
                      color: "#fff",
                      fontSize: 13,
                      fontFamily: "'Geist Mono',monospace",
                      outline: "none",
                      transition: "border 0.2s",
                    }}
                    onFocus={(e) =>
                      (e.target.style.border = `1px solid ${BLUE}88`)
                    }
                    onBlur={(e) => (e.target.style.border = `1px solid ${DIM}`)}
                  />
                ))}
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  style={{
                    background: `${BLUE}08`,
                    border: `1px solid ${DIM}`,
                    borderRadius: 9,
                    padding: "9px 11px",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 12,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    fontFamily: "inherit",
                  }}
                >
                  {["Market", "Limit", "Stop", "Stop Limit"].map((o) => (
                    <option key={o} style={{ background: "#0f0f10" }}>
                      {o}
                    </option>
                  ))}
                </select>
                {orderFlash && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "8px",
                      borderRadius: 9,
                      background: `${BLUE}1a`,
                      border: `1px solid ${BLUE}33`,
                      color: "#d1d5db",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1,
                      animation: "fadeIn 0.3s ease",
                    }}
                  >
                    ✦ {orderFlash} PLACED
                  </div>
                )}
                <button
                  onClick={placeOrder}
                  style={{
                    marginTop: "auto",
                    background: `linear-gradient(135deg,#374151,#6b7280)`,
                    border: "none",
                    borderRadius: 11,
                    padding: "12px",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: "pointer",
                    letterSpacing: 1.5,
                    boxShadow: `0 0 24px ${BLUE}44`,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.filter = "brightness(1.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.filter = "brightness(1)")
                  }
                >
                  EXECUTE
                </button>
              </G>

              {/* movers */}
              <G extra={{ padding: "20px 18px" }}>
                <Label>LIVE MOVERS</Label>
                {positions.map((p, i) => {
                  const ch = changes[p.ticker] || 0;
                  return (
                    <div
                      key={p.ticker}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 0",
                        borderBottom:
                          i < positions.length - 1
                            ? `1px solid ${BLUE}10`
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: `${BLUE}28`,
                            border: `1px solid ${BLUE}22`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            fontWeight: 900,
                            color: "#d1d5db",
                            fontFamily: "'Geist Mono',monospace",
                          }}
                        >
                          {p.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              fontFamily: "'Geist Mono',monospace",
                            }}
                          >
                            {p.ticker}
                          </div>
                          <PriceFlash
                            v={prices[p.ticker] || p.avgCost}
                            prev={prevPrices[p.ticker]}
                          />
                        </div>
                      </div>
                      <Badge color={ch >= 0 ? GREEN : RED}>
                        {ch >= 0 ? "+" : ""}
                        {fd(ch)}%
                      </Badge>
                    </div>
                  );
                })}
              </G>
            </div>

            {/* positions table */}
            <G extra={{ padding: "20px 22px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Label>OPEN POSITIONS</Label>
                <div
                  style={{
                    fontSize: 12,
                    color: totalPnL >= 0 ? GREEN : RED,
                    fontWeight: 800,
                  }}
                >
                  Total P&L: {totalPnL >= 0 ? "+" : "-"}₹
                  {Math.abs(totalPnL).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 0.7fr 1fr 1fr 0.9fr 1fr 1fr",
                  padding: "0 12px 10px",
                  borderBottom: `1px solid ${BLUE}12`,
                  fontSize: 10,
                  color: "rgba(255,255,255,0.18)",
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                {[
                  "ASSET",
                  "SHARES",
                  "AVG COST",
                  "LIVE",
                  "CHG",
                  "RETURN",
                  "P&L",
                ].map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>
              {positions.map((p, i) => {
                const lp = prices[p.ticker] || p.avgCost;
                const ret = ((lp - p.avgCost) / p.avgCost) * 100;
                const pnl = p.shares * (lp - p.avgCost);
                const ch = changes[p.ticker] || 0;
                return (
                  <div
                    key={p.ticker}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 0.7fr 1fr 1fr 0.9fr 1fr 1fr",
                      padding: "14px 12px",
                      borderBottom:
                        i < positions.length - 1
                          ? `1px solid ${BLUE}08`
                          : "none",
                      borderRadius: 11,
                      transition: "background 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = `${BLUE}08`)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 9 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: `${BLUE}28`,
                          border: `1px solid ${BLUE}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 900,
                          color: "#d1d5db",
                          fontFamily: "'Geist Mono',monospace",
                        }}
                      >
                        {p.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 12,
                            fontFamily: "'Geist Mono',monospace",
                          }}
                        >
                          {p.ticker}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.2)",
                            marginTop: 1,
                          }}
                        >
                          {p.name}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.45)",
                        alignSelf: "center",
                        fontFamily: "'Geist Mono',monospace",
                      }}
                    >
                      {p.shares}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.45)",
                        alignSelf: "center",
                        fontFamily: "'Geist Mono',monospace",
                      }}
                    >
                      ₹{p.avgCost.toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        alignSelf: "center",
                        fontFamily: "'Geist Mono',monospace",
                      }}
                    >
                      <PriceFlash v={lp} prev={prevPrices[p.ticker]} />
                    </div>
                    <div style={{ alignSelf: "center" }}>
                      <Badge color={ch >= 0 ? GREEN : RED}>
                        {ch >= 0 ? "+" : ""}
                        {fd(ch)}%
                      </Badge>
                    </div>
                    <div style={{ alignSelf: "center" }}>
                      <Badge color={ret >= 0 ? "#9ca3af" : RED}>
                        {ret >= 0 ? "+" : ""}
                        {fd(ret)}%
                      </Badge>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        alignSelf: "center",
                        color: pnl >= 0 ? "#9ca3af" : RED,
                        fontFamily: "'Geist Mono',monospace",
                      }}
                    >
                      {pnl >= 0 ? "+" : "-"}₹
                      {Math.abs(pnl).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                );
              })}
            </G>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {view === "analytics" && (
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            {/* Row 1: Candlestick full-width */}
            <G extra={{ padding: "20px 22px", marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <Label>CANDLESTICK CHART · 40D</Label>
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 10 }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        fontFamily: "'Geist Mono',monospace",
                      }}
                    >
                      {candleTicker}
                    </span>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        fontFamily: "'Geist Mono',monospace",
                        color: "#fff",
                      }}
                    >
                      ₹
                      {(
                        prices[candleTicker] ||
                        BASE_PRICES[candleTicker] ||
                        0
                      ).toFixed(2)}
                    </span>
                    <Badge color={changes[candleTicker] >= 0 ? GREEN : RED}>
                      {changes[candleTicker] >= 0 ? "+" : ""}
                      {fd(changes[candleTicker])}%
                    </Badge>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 8,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>
                      MA20{" "}
                      <span style={{ color: "#60a5fa" }}>
                        ₹
                        {candleWithMA[candleWithMA.length - 1]?.ma20?.toFixed(
                          2,
                        ) || "—"}
                      </span>
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>
                      MA50{" "}
                      <span style={{ color: "#f59e0b" }}>
                        ₹
                        {candleWithMA[candleWithMA.length - 1]?.ma50?.toFixed(
                          2,
                        ) || "—"}
                      </span>
                    </span>
                    <span style={{ color: GREEN, fontSize: 10 }}>■ Bull</span>
                    <span style={{ color: RED, fontSize: 10 }}>■ Bear</span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {Object.keys(BASE_PRICES).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCandleTicker(t)}
                      style={{
                        background:
                          candleTicker === t ? `${BLUE}28` : "transparent",
                        border: `1px solid ${candleTicker === t ? BLUE : DIM}`,
                        borderRadius: 7,
                        padding: "4px 11px",
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          candleTicker === t
                            ? "#d1d5db"
                            : "rgba(255,255,255,0.3)",
                        cursor: "pointer",
                        fontFamily: "'Geist Mono',monospace",
                        letterSpacing: 0.5,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* candles */}
              <CandleChart data={activeCdl} height={260} />

              {/* MA overlay using recharts line on top */}
              <div style={{ marginTop: 4 }}>
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart
                    data={candleWithMA}
                    margin={{ top: 0, right: 0, bottom: 0, left: 44 }}
                  >
                    <XAxis dataKey="date" hide />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                      tickFormatter={(v) => `₹${v.toFixed(0)}`}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={tipStyle}
                      itemStyle={{ color: "#d1d5db" }}
                      formatter={(v) => [`₹${v?.toFixed(2)}`]}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma20"
                      stroke="#60a5fa"
                      strokeWidth={1.5}
                      dot={false}
                      name="MA20"
                    />
                    <Line
                      type="monotone"
                      dataKey="ma50"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                      name="MA50"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    paddingLeft: 44,
                    marginTop: 2,
                  }}
                >
                  Moving Averages
                </div>
              </div>

              {/* volume bars */}
              <div style={{ marginTop: 8 }}>
                <ResponsiveContainer width="100%" height={60}>
                  <BarChart
                    data={activeCdl}
                    margin={{ top: 0, right: 0, bottom: 0, left: 44 }}
                  >
                    <XAxis dataKey="date" hide />
                    <YAxis
                      tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={tipStyle}
                      formatter={(v) => [`${(v / 1e6).toFixed(2)}M`, "Volume"]}
                    />
                    <Bar dataKey="vol" radius={[2, 2, 0, 0]}>
                      {activeCdl.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.bull ? `${BLUE}88` : `${RED}88`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    paddingLeft: 44,
                    marginTop: 2,
                  }}
                >
                  Volume
                </div>
              </div>
            </G>

            {/* Row 2: RSI + Drawdown */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              {/* RSI */}
              <G extra={{ padding: "20px 22px" }}>
                <Label>RSI (14) · {candleTicker}</Label>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart
                    data={rsiData}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={`${BLUE}09`}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <ReferenceLine
                      y={70}
                      stroke={RED}
                      strokeDasharray="4 3"
                      strokeOpacity={0.5}
                    />
                    <ReferenceLine
                      y={30}
                      stroke={GREEN}
                      strokeDasharray="4 3"
                      strokeOpacity={0.5}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="4 3"
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={tipStyle}
                      formatter={(v) => [`${v}`, `RSI`]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rsi"
                      stroke={BLUE}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: LIGHT_BLUE }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    marginTop: 8,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  <span style={{ color: RED }}>─ Overbought (70)</span>
                  <span style={{ color: GREEN }}>─ Oversold (30)</span>
                </div>
              </G>

              {/* Drawdown */}
              <G extra={{ padding: "20px 22px" }}>
                <Label>PORTFOLIO DRAWDOWN</Label>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart
                    data={drawdown}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={RED} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={RED} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={`${BLUE}09`}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={9}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={tipStyle}
                      formatter={(v) => [`${v}%`, "Drawdown"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke={RED}
                      strokeWidth={1.5}
                      fill="url(#ddGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </G>
            </div>

            {/* Row 3: Daily returns + Sector Pie + P&L bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 0.8fr 0.8fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              {/* daily returns histogram */}
              <G extra={{ padding: "20px 22px" }}>
                <Label>DAILY RETURNS DISTRIBUTION</Label>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={dailyRet}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={`${BLUE}09`}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={9}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={tipStyle}
                      formatter={(v) => [`${v}%`, "Return"]}
                    />
                    <Bar dataKey="ret" radius={[2, 2, 0, 0]}>
                      {dailyRet.map((d, i) => (
                        <Cell key={i} fill={d.pos ? GREEN : RED} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </G>

              {/* Sector pie */}
              <G extra={{ padding: "20px 22px" }}>
                <Label>SECTOR ALLOCATION</Label>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="48%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      formatter={(v) => [`₹${v.toLocaleString()}`, "Value"]}
                      contentStyle={tipStyle}
                    />
                    <Legend
                      formatter={(v) => (
                        <span
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 10,
                          }}
                        >
                          {v}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </G>

              {/* P&L by position */}
              <G extra={{ padding: "20px 22px" }}>
                <Label>P&L BY POSITION</Label>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 0, right: 12, bottom: 0, left: 10 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{
                        fill: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                        fontFamily: "'Geist Mono',monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                    />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={tipStyle}
                      formatter={(v) => [
                        `${v >= 0 ? "+" : "-"}₹${Math.abs(v).toLocaleString()}`,
                        "P&L",
                      ]}
                    />
                    <Bar dataKey="pnl" radius={[0, 5, 5, 0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.pnl >= 0 ? GREEN : RED} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </G>
            </div>

            {/* Row 4: Position value + Per-stock sparklines */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {/* Position value bar */}
              <G extra={{ padding: "20px 22px" }}>
                <Label>POSITION VALUE BREAKDOWN</Label>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={barData}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      {barData.map((_, i) => (
                        <linearGradient
                          key={i}
                          id={`bv${i}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={BLUE}
                            stopOpacity={0.9 - i * 0.1}
                          />
                          <stop
                            offset="100%"
                            stopColor="#4c1d95"
                            stopOpacity={0.4}
                          />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={`${BLUE}09`}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "rgba(255,255,255,0.3)",
                        fontSize: 11,
                        fontFamily: "'Geist Mono',monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      content={<BarTooltip />}
                      cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                      contentStyle={tipStyle}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={`url(#bv${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </G>

              {/* Per-stock line momentum */}
              <G extra={{ padding: "20px 22px" }}>
                <Label>PER-STOCK MOMENTUM</Label>
                {positions.map((p, i) => {
                  const ch = changes[p.ticker] || 0;
                  const base = prices[p.ticker] || p.avgCost;
                  const pts = Array.from({ length: 20 }, (_, j) => ({
                    v:
                      base *
                      (1 + ((Math.random() - 0.499) * 0.006 * (20 - j)) / 20),
                  }));
                  pts[19].v = base;
                  return (
                    <div
                      key={p.ticker}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: i < positions.length - 1 ? 12 : 0,
                        paddingBottom: i < positions.length - 1 ? 12 : 0,
                        borderBottom:
                          i < positions.length - 1
                            ? `1px solid ${BLUE}0a`
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: `${BLUE}22`,
                          border: `1px solid ${BLUE}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 900,
                          color: "#d1d5db",
                          flexShrink: 0,
                          fontFamily: "'Geist Mono',monospace",
                        }}
                      >
                        {p.ticker.slice(0, 2)}
                      </div>
                      <div style={{ width: 52, flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            fontFamily: "'Geist Mono',monospace",
                          }}
                        >
                          {p.ticker}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.28)",
                          }}
                        >
                          ₹{base.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ flex: 1, height: 34 }}>
                        <ResponsiveContainer width="100%" height={34}>
                          <LineChart data={pts}>
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke={ch >= 0 ? GREEN : RED}
                              strokeWidth={1.5}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <Badge color={ch >= 0 ? GREEN : RED}>
                        {ch >= 0 ? "+" : ""}
                        {fd(ch)}%
                      </Badge>
                    </div>
                  );
                })}
              </G>
            </div>
          </div>
        )}

        {/* ══ HISTORY ══ */}

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

        {view === "history" && (
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    letterSpacing: "-0.4px",
                  }}
                >
                  Trade History
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.28)",
                    marginTop: 2,
                  }}
                >
                  {trades.length} trades · Import CSV or add manually
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowImport(true)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${DIM}`,
                    borderRadius: 9,
                    padding: "7px 14px",
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ⬆ Import CSV
                </button>
                <button
                  onClick={() => setShowAddTrade(true)}
                  style={{
                    background: `linear-gradient(135deg,#374151,#6b7280)`,
                    border: "none",
                    borderRadius: 9,
                    padding: "7px 16px",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  + Add Trade
                </button>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                marginBottom: 14,
              }}
            >
              {[
                { l: "TOTAL TRADES", v: trades.length, c: BLUE },
                {
                  l: "BUY ORDERS",
                  v: trades.filter((t) => t.type === "BUY").length,
                  c: "#d1d5db",
                },
                {
                  l: "SELL ORDERS",
                  v: trades.filter((t) => t.type === "SELL").length,
                  c: RED,
                },
                {
                  l: "TOTAL VOLUME",
                  v: `₹${trades.reduce((s, t) => s + t.qty * t.price, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  c: LIGHT_BLUE,
                },
              ].map((c, i) => (
                <G key={i} extra={{ padding: "16px 20px" }}>
                  <Label>{c.l}</Label>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: c.c,
                      fontFamily: "'Geist Mono',monospace",
                    }}
                  >
                    {c.v}
                  </div>
                </G>
              ))}
            </div>
            <G extra={{ padding: "20px 22px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 0.6fr 0.8fr 0.7fr 0.8fr 1fr 1.5fr",
                  padding: "0 10px 10px",
                  borderBottom: `1px solid ${BLUE}12`,
                  fontSize: 10,
                  color: "rgba(255,255,255,0.18)",
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                {[
                  "DATE",
                  "TYPE",
                  "SYMBOL",
                  "QTY",
                  "PRICE",
                  "TOTAL",
                  "NOTE",
                ].map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>
              {trades.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 0.6fr 0.8fr 0.7fr 0.8fr 1fr 1.5fr",
                    padding: "13px 10px",
                    borderBottom:
                      i < trades.length - 1 ? `1px solid ${BLUE}08` : "none",
                    borderRadius: 10,
                    transition: "background 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = `${BLUE}08`)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "'Geist Mono',monospace",
                      alignSelf: "center",
                    }}
                  >
                    {t.date}
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <Badge color={t.type === "BUY" ? GREEN : RED}>
                      {t.type}
                    </Badge>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      fontFamily: "'Geist Mono',monospace",
                      alignSelf: "center",
                    }}
                  >
                    {t.ticker}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "'Geist Mono',monospace",
                      alignSelf: "center",
                    }}
                  >
                    {t.qty}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "'Geist Mono',monospace",
                      alignSelf: "center",
                    }}
                  >
                    ₹{t.price?.toFixed?.(2)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#d1d5db",
                      fontFamily: "'Geist Mono',monospace",
                      alignSelf: "center",
                    }}
                  >
                    ₹
                    {(t.qty * t.price).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.28)",
                      alignSelf: "center",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.note || "—"}
                  </div>
                </div>
              ))}
            </G>
            <div
              style={{
                marginTop: 12,
                padding: "13px 16px",
                background: `${BLUE}09`,
                border: `1px solid ${BLUE}1a`,
                borderRadius: 12,
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: BLUE }}>CSV format:</strong>{" "}
              <code
                style={{
                  color: "#d1d5db",
                  background: `${BLUE}14`,
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                date, type, ticker, qty, price, note
              </code>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; }
        input::placeholder { color:rgba(156,163,175,0.28); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        select option { background:#0f0f10; color:#fff; }
        input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.6) sepia(1) hue-rotate(240deg); }
        @keyframes marquee { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.2;} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px);} to{opacity:1;transform:translateY(0);} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(156,163,175,0.25);border-radius:4px; }
      `}</style>
    </div>
  );
}
