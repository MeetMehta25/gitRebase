import re

path = 'client/src/pages/PaperTradingPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace $ -> ₹ generically
text = text.replace('$', '₹')

# Find the useLivePrice hook and replace it entirely
import re
new_hook = '''function useLivePrice(tickers) {
  const [prices, setPrices] = useState(() => {
    const p = {};
    tickers.forEach((t) => { p[t] = BASE_PRICES[t] || 100; });
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
          body: JSON.stringify({ tickers })
        });
        const data = await res.json();
        if (data.success && isMounted) {
          const newPrices = {};
          const newChanges = {};

          Object.entries(data.data).forEach(([t, d]) => {
            newPrices[t] = d.price;
            newChanges[t] = d.change;
          });

          setPrices(prev => ({ ...prev, ...newPrices }));
          setChanges(prev => ({ ...prev, ...newChanges }));
        }
      } catch (err) {
        console.error("Failed to fetch live prices", err);
      }
    };
    
    fetchPrices();
    const iv = setInterval(fetchPrices, 300000);
    return () => { isMounted = false; clearInterval(iv); };
  }, [tickers.join(",")]);
  
  return { prices, changes };
}'''

# Replace from function useLivePrice down to its closing right before function useEquityCurve
old_hook_regex = re.compile(r'function useLivePrice\(tickers\).*?return \{ prices, changes \};\n\}', re.DOTALL)
text = old_hook_regex.sub(new_hook, text)

# Update equity curve format string which had \$
# and other formats

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch applied to PaperTradingPage.tsx")
