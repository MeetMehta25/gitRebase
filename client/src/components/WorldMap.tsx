import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { type Market, MARKETS } from "../data/markets";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface WorldMapProps {
  selectedMarket: Market | null;
  onSelectMarket: (market: Market) => void;
}

export function WorldMap({ selectedMarket, onSelectMarket }: WorldMapProps) {
  return (
    <div className="w-full h-full bg-[#0a0a0f] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#1e1e24] relative">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight drop-shadow-md">
          Global Markets
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Select a hub to view real-time news
        </p>
      </div>

      <ComposableMap
        projectionConfig={{
          scale: 140,
          center: [0, 20],
        }}
        className="w-full h-full"
      >
        <ZoomableGroup zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: "#15151e",
                      stroke: "rgba(255, 255, 255, 0.05)",
                      strokeWidth: 0.8,
                      outline: "none",
                      transition: "all 250ms",
                    },
                    hover: {
                      fill: "rgba(168, 85, 247, 0.15)",
                      stroke: "rgba(168, 85, 247, 0.4)",
                      strokeWidth: 1,
                      outline: "none",
                      transition: "all 250ms",
                    },
                    pressed: {
                      fill: "#15151e",
                      stroke: "rgba(255, 255, 255, 0.1)",
                      strokeWidth: 0.8,
                      outline: "none",
                    },
                  }}
                />
              ))
            }
          </Geographies>

          {MARKETS.map((market) => {
            const isSelected = selectedMarket?.id === market.id;
            return (
              <Marker
                key={market.id}
                coordinates={market.coordinates}
                onClick={() => onSelectMarket(market)}
                className="cursor-pointer group"
              >
                <circle
                  r={isSelected ? 8 : 5}
                  fill={isSelected ? "#a855f7" : "#3d3560"}
                  stroke={isSelected ? "#fff" : "transparent"}
                  strokeWidth={isSelected ? 2 : 0}
                  className="transition-all duration-300 ease-in-out"
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0 0 10px rgba(168, 85, 247, 0.9))"
                      : "drop-shadow(0 0 4px rgba(168, 85, 247, 0.2))",
                  }}
                />
                {/* Ping animation behind selected marker */}
                {isSelected && (
                  <circle
                    r={12}
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth={1}
                    className="animate-ping opacity-75 origin-center"
                    style={{ transformBox: "fill-box" }}
                  />
                )}
                <text
                  textAnchor="middle"
                  y={isSelected ? -18 : -12}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fill: isSelected ? "#fff" : "#6b5fa0",
                    fontSize: isSelected ? "13px" : "11px",
                    fontWeight: isSelected ? 700 : 500,
                    pointerEvents: "none",
                    transition: "all 0.3s ease",
                    textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                  }}
                >
                  {market.country}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
