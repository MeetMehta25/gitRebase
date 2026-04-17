const fs = require('fs');

const path = 'client/src/pages/PaperTradingPage.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replacements for USD to INR formats
content = content.replace(/\$(?=\{)/g, '₹');
content = content.replace(/\$(?=\d)/g, '₹');
content = content.replace(/\$([A-Za-z])/g, '₹$1');
// specific formatting replacements
content = content.replace(/\$\$/g, '₹$');
// replace any bare strings where P&L is displayed
content = content.replace(/Total P&L: \{([^\}]+)\}\$/g, 'Total P&L: {$1}₹');
content = content.replace(/\{pnl >= 0 \? "\+" : "-"\}\$/g, '{pnl >= 0 ? "+" : "-"}₹');
// The single solitary $ instances in jsx like `$ \n`
content = content.replace(/>\s*\$\s*</g, '>₹<');
content = content.replace(/\> \$\s*\</g, '> ₹ <');
content = content.replace(/'\$'/g, "'₹'");
content = content.replace(/"\$"/g, '"₹"');

// Fix `tickFormatter`s and `formatter`s that might have escaped our simple regex
content = content.replace(/tickFormatter=\{\(v\) => `\$([^{]+)\{([^}]+)\}`\}/g, "tickFormatter={(v) => `₹$1{$2}`}");
content = content.replace(/`\$([^{`]+)?\{/g, "`₹$1{");
content = content.replace(/`-\$([^{`]+)?\{/g, "`-₹$1{");
content = content.replace(/`\+\$([^{`]+)?\{/g, "`+₹$1{");


// Remove old useLivePrice and replace with new fetch logic
const oldHookRegex = /function useLivePrice\(tickers(: string\[\])?\) \{[\s\S]+?return \{ prices, changes \};\n\s*\}/m;

const newHook = `function useLivePrice(tickers: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    tickers.forEach((t) => {
      p[t] = BASE_PRICES[t] || 100;
    });
    return p;
  });
  const [changes, setChanges] = useState<Record<string, number>>({});

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
          const newPrices: Record<string, number> = {};
          const newChanges: Record<string, number> = {};
          
          Object.entries(data.data).forEach(([t, d]: [string, any]) => {
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
    
    // Initial fetch
    fetchPrices();
    
    // Poll every 5 minutes (300000 ms) to save API limits
    const iv = setInterval(fetchPrices, 300000);
    return () => {
      isMounted = false;
      clearInterval(iv);
    };
  }, [tickers.join(",")]);
  
  return { prices, changes };
}`;

content = content.replace(oldHookRegex, newHook);

// Remove the Math.random logic in equity curve and set to 0.05 trend
const oldEquityRegex = /const noise = Math\.sin\(i \* 0\.4\) \* 0\.01 \+ \(Math\.random\(\) - 0\.5\) \* 0\.006;\n\s*const trend = 0\.18 \* t \+ noise;/g;
const newEquity = `const noise = Math.sin(i * 0.4) * 0.01;\n        const trend = 0.05 * t + noise;`;
content = content.replace(oldEquityRegex, newEquity);

fs.writeFileSync(path, content, 'utf-8');
console.log("Patched PaperTradingPage.tsx");
