import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  const containerId = useRef(`tv_chart_${Date.now()}`);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget if any
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== "undefined") {
        new window.TradingView.widget({
          autosize: true,
          symbol: "BSE:RELIANCE",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "in",
          enable_publishing: false,
          allow_symbol_change: true,
          backgroundColor: "rgba(0, 0, 0, 0)",
          gridColor: "rgba(255, 255, 255, 0.05)",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerId.current,
        });
      }
    };
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="w-full h-full bg-black/20 rounded-xl border border-white/5 overflow-hidden">
      <div
        id={containerId.current}
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}
