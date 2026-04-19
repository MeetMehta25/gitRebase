import re

with open('client/src/pages/PlaygroundPage.tsx', 'r') as f:
    content = f.read()

new_validationSuites = """const validationSuites = [
  {
    id: "walk-forward",
    title: "Walk-forward test",
    sub: "Train / test splits to ensure strategy robustness across different market conditions.",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.1)",
    border: "rgba(168, 85, 247, 0.3)",
    icon: Calendar,
    enabled: true
  },
  { 
    id: "overfitting", 
    title: "Overfitting score", 
    sub: "Analyze rules vs. data length to prevent curve-fitting and false signals.", 
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.1)",
    border: "rgba(236, 72, 153, 0.3)",
    icon: Settings2,
    enabled: true 
  },
  { 
    id: "monte-carlo", 
    title: "Monte Carlo", 
    sub: "1000 path simulation to simulate equity curves and drawdowns under uncertainty.", 
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.3)",
    icon: Globe,
    enabled: true 
  },
];"""

content = re.sub(
    r'const validationSuites = \[.*?\];', 
    new_validationSuites, 
    content, 
    flags=re.DOTALL
)

new_map = """{validationSuites.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className={`pg-suite-card ${!s.enabled ? 'disabled' : ''}`}
                  onClick={() => s.enabled && selectSuite(s)}
                  style={!s.enabled ? { opacity: 0.5, cursor: 'not-allowed' } : { borderColor: s.border }}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                      <Icon size={24} style={{ color: s.color }} />
                    </div>
                    <div>
                      <div className="pg-suite-title text-xl font-semibold" style={{ color: '#eae6f8' }}>{s.title}</div>
                      <div className="pg-suite-sub text-sm mt-1" style={{ color: '#b8b0d8', lineHeight: '1.4' }}>{s.sub}</div>
                    </div>
                  </div>
                </div>
              );
            })}"""

content = re.sub(
    r'\{validationSuites\.map\(\(s\) => \(\s*<div\s*key=\{s\.id\}\s*className={`pg-suite-card \$\{!\s*s\.enabled \?.*?</style>\s*</div>\s*</div>\s*</div>\s*\);\s*\}', # This regex is too strict
    r'1234567890', # placeholder
    content, 
    flags=re.DOTALL
)
