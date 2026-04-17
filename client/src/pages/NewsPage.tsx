import { useState } from "react";
import { Newspaper } from "lucide-react";
import { WorldMap } from "../components/WorldMap";
import { NewsFeed } from "../components/NewsFeed";
import { MARKETS, type Market } from "../data/markets";

export function NewsPage() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(MARKETS[0]);

  return (
    <div className="h-full flex flex-col max-w-350 mx-auto px-2 md:px-4">
      <div className="mb-4 flex items-center gap-2 shrink-0">
        <Newspaper className="w-5 h-5 text-accent-blue" />
        <h1 className="text-lg font-semibold text-text-primary">
          Global Market Intelligence
        </h1>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-4">
        <div className="h-105 xl:h-full min-h-90">
          <WorldMap
            selectedMarket={selectedMarket}
            onSelectMarket={setSelectedMarket}
          />
        </div>
        <div className="h-130 xl:h-full min-h-90">
          <NewsFeed market={selectedMarket} />
        </div>
      </div>
    </div>
  );
}
