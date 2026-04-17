export interface Market {
  id: string;
  name: string;
  symbol: string;
  coordinates: [number, number]; // [longitude, latitude]
  country: string;
}

export const MARKETS: Market[] = [
  {
    id: "in",
    name: "Mumbai (NSE NIFTY 50)",
    symbol: "^NSEI",
    coordinates: [72.8777, 19.076],
    country: "India",
  },
  {
    id: "uk",
    name: "London (FTSE 100)",
    symbol: "^FTSE",
    coordinates: [-0.1276, 51.5074],
    country: "United Kingdom",
  },
  {
    id: "jp",
    name: "Tokyo (Nikkei 225)",
    symbol: "^N225",
    coordinates: [139.6917, 35.6895],
    country: "Japan",
  },
  {
    id: "cn",
    name: "Shanghai (SSE Composite)",
    symbol: "000001.SS",
    coordinates: [121.4737, 31.2304],
    country: "China",
  },
  {
    id: "hk",
    name: "Hong Kong (Hang Seng)",
    symbol: "^HSI",
    coordinates: [114.1694, 22.3193],
    country: "Hong Kong",
  },
  {
    id: "au",
    name: "Sydney (ASX 200)",
    symbol: "^AXJO",
    coordinates: [151.2093, -33.8688],
    country: "Australia",
  },
  {
    id: "de",
    name: "Frankfurt (DAX)",
    symbol: "^GDAXI",
    coordinates: [8.6821, 50.1109],
    country: "Germany",
  },
  {
    id: "in-bse",
    name: "Mumbai (BSE SENSEX)",
    symbol: "^BSESN",
    coordinates: [72.8777, 19.076],
    country: "India",
  },
  {
    id: "br",
    name: "Sao Paulo (Bovespa)",
    symbol: "^BVSP",
    coordinates: [-46.6333, -23.5505],
    country: "Brazil",
  },
  {
    id: "ca",
    name: "Toronto (S&P/TSX)",
    symbol: "^GSPTSE",
    coordinates: [-79.3832, 43.6532],
    country: "Canada",
  },
];
