import { useState } from "react";
import { Search, ChevronLeft, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock Brokers Data
const BROKERS = [
  { id: "stoxkart", name: "STOXKART", logo: "https://www.google.com/s2/favicons?domain=stoxkart.com&sz=128", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  { id: "upstox", name: "Upstox", logo: "https://www.google.com/s2/favicons?domain=upstox.com&sz=128", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "finvasia", name: "FINVASIA", logo: "https://www.google.com/s2/favicons?domain=finvasia.com&sz=128", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "fyers", name: "FYERS", logo: "https://www.google.com/s2/favicons?domain=fyers.in&sz=128", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "dhan", name: "Dhan", logo: "https://www.google.com/s2/favicons?domain=dhan.co&sz=128", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "groww", name: "Groww", logo: "https://www.google.com/s2/favicons?domain=groww.in&sz=128", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "zerodha", name: "Zerodha", logo: "https://www.google.com/s2/favicons?domain=zerodha.com&sz=128", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  { id: "alice", name: "Alice", logo: "https://www.google.com/s2/favicons?domain=aliceblueonline.com&sz=128", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { id: "angel", name: "Angel", logo: "https://www.google.com/s2/favicons?domain=angelone.in&sz=128", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  { id: "master_trust", name: "Master Trust", logo: "https://www.google.com/s2/favicons?domain=mastertrust.co.in&sz=128", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
];

export function ConnectBrokerPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedBroker, setSelectedBroker] = useState(BROKERS[0]);
  const [brokerId, setBrokerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const filteredBrokers = BROKERS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const handleCopy = () => {
    navigator.clipboard.writeText("https://web.alphaquant.com/connect-broker");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/brokers/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerName: selectedBroker.name,
          brokerId,
          apiKey,
          apiSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to connect broker");
      }

      setSuccess(true);
      setTimeout(() => navigate(-1), 2000); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      {/* Top action bar */}
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-gray-300"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full">
        
        {/* Left Column - List */}
        <div className="flex-1 w-full lg:w-2/3">
          <h1 className="text-2xl font-bold text-white mb-2">Add Your Broker</h1>
          <p className="text-gray-400 mb-1 font-medium">
            Browse the partner list and pick the broker you want to connect with Alpha Quant.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Broker logo rights are completely of broker itself. We do not claim any right on broker logo.
          </p>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              placeholder="Search broker"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#141415] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#a855f7] transition-colors"
            />
          </div>

          <h3 className="text-lg font-semibold text-white mb-4">Popular Brokers</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredBrokers.map(broker => (
              <button
                key={broker.id}
                onClick={() => setSelectedBroker(broker)}
                className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-200 ${
                  selectedBroker.id === broker.id 
                    ? "border-[#a855f7] bg-[#a855f7]/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                    : "border-white/5 bg-[#141415]/50 hover:bg-[#141415] hover:border-white/10"
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/5 border-white/10 border overflow-hidden p-2`}>
                  <img 
                    src={broker.logo} 
                    alt={broker.name} 
                    className="w-full h-full object-contain rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${broker.name}&background=random&color=fff`;
                    }}
                  />
                </div>
                <span className="font-semibold text-gray-200">{broker.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Details Form */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[#141415] border border-white/10 rounded-2xl p-6 sticky top-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Add Your Broker Detail</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Enter the login information or tokens required by your broker so we can finish the setup.
            </p>

            <div className="border border-white/10 bg-black/20 rounded-xl p-4 flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-white/5 border-white/10 border p-1.5 overflow-hidden`}>
                <img 
                  src={selectedBroker.logo} 
                  alt={selectedBroker.name} 
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedBroker.name}&background=random&color=fff`;
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-white tracking-wide uppercase">{selectedBroker.name}</h4>
                <a href="#" className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 mt-1">
                  How to add {selectedBroker.name.toUpperCase()}?
                  <span className="bg-red-500 text-white rounded px-1 text-[10px] ml-1">▶</span>
                </a>
              </div>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-sm">
                  Broker connected successfully! Redirecting...
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Broker ID</label>
                <input 
                  type="text"
                  placeholder="Enter Broker ID"
                  value={brokerId}
                  onChange={e => setBrokerId(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#a855f7] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <input 
                  type="text"
                  placeholder="API Key"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#a855f7] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Secret Key</label>
                <input 
                  type="password"
                  placeholder="API Secret Key"
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#a855f7] transition-colors"
                />
              </div>

              <div className="mt-2 text-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <span>Redirect Url:</span>
                  <div className="w-4 h-4 rounded-full bg-gray-700 text-[10px] text-white flex items-center justify-center">i</div>
                </div>
                <div className="flex items-center justify-between text-[#a855f7] cursor-pointer hover:text-[#9333ea] transition-colors break-all pr-2" onClick={handleCopy}>
                  https://web.alphaquant.com/connect-broker
                  <Copy className="w-4 h-4 ml-2 shrink-0" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading || success}
                className="w-full mt-4 bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Connecting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
