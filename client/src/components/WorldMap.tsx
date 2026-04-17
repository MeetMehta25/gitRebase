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
    <div className="w-full h-full bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative">
      <div className="absolute top-6 left-6 z-10">
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
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
                      fill: "#1a1a1a",
                      stroke: "#333333",
                      strokeWidth: 0.5,
                      outline: "none",
                      transition: "all 250ms",
                    },
                    hover: {
                      fill: "#2a2a2a",
                      stroke: "#666666",
                      strokeWidth: 1,
                      outline: "none",
                      transition: "all 250ms",
                    },
                    pressed: {
                      fill: "#1a1a1a",
                      stroke: "#333333",
                      strokeWidth: 0.5,
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
                className="cursor-pointer"
              >
                <circle
                  r={isSelected ? 8 : 5}
                  fill={isSelected ? "#10b981" : "#3b82f6"}
                  stroke="#fff"
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all duration-300 ease-in-out"
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))"
                      : "none",
                  }}
                />
                <text
                  textAnchor="middle"
                  y={isSelected ? -15 : -12}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fill: isSelected ? "#fff" : "#9ca3af",
                    fontSize: isSelected ? "12px" : "10px",
                    fontWeight: isSelected ? 600 : 400,
                    pointerEvents: "none",
                    transition: "all 0.3s ease",
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
