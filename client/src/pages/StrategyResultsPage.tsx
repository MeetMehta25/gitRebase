import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Target,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle2,
  Rocket,
  Copy,
  Share2,
  Code,
  Layers,
  Settings,
  MoreVertical,
  Sparkles,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useStrategyStore } from "../store/strategyStore";
import { getStrategyByPrompt } from "../data/strategyData";

interface StrategyResponse {
  success?: boolean;
  strategy_id?: string;
  ticker?: string;
  timeframe?: string;
  strategy_from_debate?: {
    entry_rules?: string[];
    exit_rules?: string[];
    filters?: string[];
    indicators?: string[];
    risk_management?: {
      position_size?: string;
      stop_loss?: string;
      take_profit?: string;
    };
    notes?: string;
  };
  backtest_result?: {
    metrics?: {
      capital?: {
        initial_capital?: number;
        final_equity?: number;
        total_pnl?: number;
        total_fees_paid?: number;
      };
      returns?: {
        total_return_pct?: number;
        cagr_pct?: number;
        annualised_volatility_pct?: number;
      };
      risk_adjusted?: {
        sharpe_ratio?: number;
        sortino_ratio?: number;
        calmar_ratio?: number;
      };
      drawdown?: { max_drawdown_pct?: number; avg_drawdown_pct?: number };
      trade_stats?: {
        total_trades?: number;
        winning_trades?: number;
        losing_trades?: number;
        win_rate_pct?: number;
        profit_factor?: number;
      };
    };
    summary?: any;
    status?: string;
  };
  backtest_payload?: any;
  debate_agents_used?: string[];
  [key: string]: any;
}

export function StrategyResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [deploying, setDeploying] = useState(false);

  const handleDeployToPaperTrading = async () => {
    setDeploying(true);
    try {
      const payload = {
        strategy_id: strategy?.strategy_id || `strat_${Date.now()}`,
        strategy_name: strategy?.goal || strategy?.ticker + " Strategy",
        ticker: strategy?.ticker || "UNKNOWN",
        initial_capital: 100000,
        timeframe: strategy?.timeframe || strategy?.parameters?.timeframe || "1d",
        parameters: strategy?.parameters || {
          position_size_pct: strategy?.position_size_pct || 10,
          stop_loss_pct: strategy?.stop_loss_pct || 2,
          take_profit_pct: strategy?.take_profit_pct || 5
        },
        strategy_from_debate: {
          entry_rules: strategy?.entry_rules || ["Buy when short-term MA crosses above long-term MA", "Confirm with RSI > 50"],
          exit_rules: strategy?.exit_rules || ["Sell when short-term MA crosses below long-term MA", "Stop Loss hit"]
        }
      };

      const response = await fetch("http://localhost:5000/api/paper_trading/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (data.success) {
        alert("Strategy deployed to live paper trading successfully!");
        navigate("/trading", { state: { tab: "deploy" } });
      } else {
        alert(`Deploy failed: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to deploy to Paper Trading Engine.");
    } finally {
      setDeploying(false);
    }
  };
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null);
  const [selectedTab, setSelectedTab] = useState<"overview" | "rules" | "code">(
    "overview",
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.strategy) {
      setStrategy(location.state.strategy);
    }
  }, [location]);

  if (!strategy) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">No strategy data found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDownloadPdf = async () => {
    try {
      // Show loading feedback (can just change button state if wanted, reusing setCopyFeedback for toast context)
      setCopyFeedback("Generating PDF on server... (Sending to WhatsApp!)");
      const res = await fetch("/api/strategy/export_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategy),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backtest_report_${strategy.ticker || "strategy"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setCopyFeedback("✓ Report Downloaded & Sent to WhatsApp!");
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      console.error(err);
      setCopyFeedback("Failed to generate report.");
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleOpenInBuilder = () => {
    // Use numeric strategy ID (1-4) that matches ALL_WORKFLOWS, not the string-based strategy_id
    const matchedStrategy = getStrategyByPrompt(
      strategy.ticker || strategy.prompt || "",
    );
    const strategyId = matchedStrategy?.id || 1;
    navigate("/strategy-builder", {
      state: {
        generatedStrategy: strategy,
        strategyId,
        workflowType: "initial",
        autoPopulate: true,
      },
    });
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-[#0a0a0a] to-[#1a1a1a] text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/6 bg-[#050505]/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-semibold">Strategy Generated</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Share2 className="w-5 h-5 text-white/60" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 pb-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-linear-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold mb-2">
                  {strategy.ticker || "Strategy"}
                </h2>
                <p className="text-white/60 text-lg">
                  Generated strategy ready for backtesting and deployment
                </p>
              </div>
              <div className="text-right">
                {strategy.strategy_id && (
                  <p className="text-xs text-white/40 mb-2">
                    ID: {strategy.strategy_id.slice(0, 8)}...
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400">Ready to Deploy</span>
                </div>
                <button 
                  onClick={handleDeployToPaperTrading}
                  disabled={deploying}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors text-sm font-medium border border-emerald-500/30 w-full justify-center"
                >
                  <Rocket className="w-4 h-4" /> {deploying ? "Deploying..." : "Deploy to Paper Trading"}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {strategy?.backtest_result?.metrics?.returns?.total_return_pct !==
                undefined && (
                <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                  <div className="text-white/40 text-xs mb-1 uppercase tracking-wider font-semibold">
                    Total Return
                  </div>
                  <div className="text-emerald-400 font-semibold text-xl">
                    {strategy.backtest_result.metrics.returns.total_return_pct?.toFixed(
                      2,
                    )}
                    %
                  </div>
                </div>
              )}
              {strategy?.backtest_result?.metrics?.risk_adjusted
                ?.sharpe_ratio !== undefined && (
                <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                  <div className="text-white/40 text-xs mb-1 uppercase tracking-wider font-semibold">
                    Sharpe Ratio
                  </div>
                  <div className="text-blue-400 font-semibold text-xl">
                    {strategy.backtest_result.metrics.risk_adjusted.sharpe_ratio?.toFixed(
                      2,
                    )}
                  </div>
                </div>
              )}
              {strategy?.backtest_result?.metrics?.trade_stats?.win_rate_pct !==
                undefined && (
                <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                  <div className="text-white/40 text-xs mb-1 uppercase tracking-wider font-semibold">
                    Win Rate
                  </div>
                  <div className="text-amber-400 font-semibold text-xl">
                    {strategy.backtest_result.metrics.trade_stats.win_rate_pct?.toFixed(
                      1,
                    )}
                    %
                  </div>
                </div>
              )}
              {strategy?.backtest_result?.metrics?.drawdown
                ?.max_drawdown_pct !== undefined && (
                <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                  <div className="text-white/40 text-xs mb-1 uppercase tracking-wider font-semibold">
                    Max Drawdown
                  </div>
                  <div className="text-red-400 font-semibold text-xl">
                    -
                    {strategy.backtest_result.metrics.drawdown.max_drawdown_pct?.toFixed(
                      2,
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs - Only Overview, Rules, and Strategy JSON */}
        <div className="flex gap-1 mb-8 border-b border-white/6 overflow-x-auto">
          {(["overview", "rules", "code"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={cn(
                "px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all",
                selectedTab === tab
                  ? "text-white border-blue-500"
                  : "text-white/50 border-transparent hover:text-white/70",
              )}
            >
              {tab === "code"
                ? "Strategy JSON"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {selectedTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Key Backtest Metrics */}
              {strategy?.backtest_result?.metrics && (
                <>
                  {/* Primary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {strategy.backtest_result.metrics.returns
                      ?.total_return_pct !== undefined && (
                      <div className="bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                        <p className="text-emerald-400 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Total Return
                        </p>
                        <p className="text-white/80 font-semibold text-3xl">
                          {strategy.backtest_result.metrics.returns.total_return_pct.toFixed(
                            2,
                          )}
                          %
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.risk_adjusted
                      ?.sharpe_ratio !== undefined && (
                      <div className="bg-linear-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                        <p className="text-blue-400 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Sharpe Ratio
                        </p>
                        <p className="text-white/80 font-semibold text-3xl">
                          {strategy.backtest_result.metrics.risk_adjusted.sharpe_ratio.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.drawdown
                      ?.max_drawdown_pct !== undefined && (
                      <div className="bg-linear-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl p-6">
                        <p className="text-red-400 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Max Drawdown
                        </p>
                        <p className="text-white/80 font-semibold text-3xl">
                          -
                          {strategy.backtest_result.metrics.drawdown.max_drawdown_pct.toFixed(
                            2,
                          )}
                          %
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Trade Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {strategy.backtest_result.metrics.trade_stats
                      ?.total_trades !== undefined && (
                      <div className="bg-white/5 border border-white/6 rounded-2xl p-4">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Total Trades
                        </p>
                        <p className="text-white/80 font-semibold text-2xl">
                          {
                            strategy.backtest_result.metrics.trade_stats
                              .total_trades
                          }
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.trade_stats
                      ?.win_rate_pct !== undefined && (
                      <div className="bg-white/5 border border-white/6 rounded-2xl p-4">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Win Rate
                        </p>
                        <p className="text-amber-400 font-semibold text-2xl">
                          {strategy.backtest_result.metrics.trade_stats.win_rate_pct.toFixed(
                            1,
                          )}
                          %
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.trade_stats
                      ?.winning_trades !== undefined && (
                      <div className="bg-white/5 border border-white/6 rounded-2xl p-4">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Winning Trades
                        </p>
                        <p className="text-emerald-400 font-semibold text-2xl">
                          {
                            strategy.backtest_result.metrics.trade_stats
                              .winning_trades
                          }
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.trade_stats
                      ?.losing_trades !== undefined && (
                      <div className="bg-white/5 border border-white/6 rounded-2xl p-4">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Losing Trades
                        </p>
                        <p className="text-red-400 font-semibold text-2xl">
                          {
                            strategy.backtest_result.metrics.trade_stats
                              .losing_trades
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Capital & Returns */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {strategy.backtest_result.metrics.capital
                      ?.initial_capital !== undefined && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Initial Capital
                        </p>
                        <p className="text-white/80 font-medium">
                          $
                          {strategy.backtest_result.metrics.capital.initial_capital.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.capital?.final_equity !==
                      undefined && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Final Equity
                        </p>
                        <p className="text-white/80 font-medium">
                          $
                          {strategy.backtest_result.metrics.capital.final_equity.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.returns?.cagr_pct !==
                      undefined && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          CAGR
                        </p>
                        <p className="text-white/80 font-medium">
                          {strategy.backtest_result.metrics.returns.cagr_pct.toFixed(
                            2,
                          )}
                          %
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Risk Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {strategy.backtest_result.metrics.returns
                      ?.annualised_volatility_pct !== undefined && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Volatility
                        </p>
                        <p className="text-white/80 font-medium">
                          {strategy.backtest_result.metrics.returns.annualised_volatility_pct.toFixed(
                            2,
                          )}
                          %
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.drawdown
                      ?.avg_drawdown_pct !== undefined && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Avg Drawdown
                        </p>
                        <p className="text-white/80 font-medium">
                          {strategy.backtest_result.metrics.drawdown.avg_drawdown_pct.toFixed(
                            2,
                          )}
                          %
                        </p>
                      </div>
                    )}
                    {strategy.backtest_result.metrics.risk_adjusted
                      ?.sortino_ratio !== undefined && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Sortino Ratio
                        </p>
                        <p className="text-white/80 font-medium">
                          {strategy.backtest_result.metrics.risk_adjusted.sortino_ratio.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Indicators Used */}
              {strategy?.strategy_from_debate?.indicators &&
                strategy.strategy_from_debate.indicators.length > 0 && (
                  <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-400" />
                      Indicators Used
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {strategy.strategy_from_debate.indicators.map(
                        (indicator, idx) => (
                          <div
                            key={idx}
                            className="bg-black/40 rounded-xl p-3 border border-white/6 text-center"
                          >
                            <p className="text-sm font-medium text-white/80">
                              {indicator}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Agents Used */}
              {strategy?.debate_agents_used &&
                strategy.debate_agents_used.length > 0 && (
                  <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Debate Agents
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {strategy.debate_agents_used.map((agent, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-300"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Strategy Notes */}
              {strategy?.strategy_from_debate?.notes && (
                <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Strategy Notes
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {strategy.strategy_from_debate.notes}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Rules Tab */}
          {selectedTab === "rules" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Entry Rules */}
              {strategy?.strategy_from_debate?.entry_rules &&
                strategy.strategy_from_debate.entry_rules.length > 0 && (
                  <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Entry Rules
                    </h3>
                    <div className="space-y-3">
                      {strategy.strategy_from_debate.entry_rules.map(
                        (rule, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-medium text-emerald-400 shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-white/80 pt-0.5">{rule}</p>
                            <button
                              onClick={() => handleCopy(rule, "Entry rule")}
                              className="ml-auto text-white/30 hover:text-white/70 transition-colors shrink-0"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Exit Rules */}
              {strategy?.strategy_from_debate?.exit_rules &&
                strategy.strategy_from_debate.exit_rules.length > 0 && (
                  <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Exit Rules
                    </h3>
                    <div className="space-y-3">
                      {strategy.strategy_from_debate.exit_rules.map(
                        (rule, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xs font-medium text-red-400 shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-white/80 pt-0.5">{rule}</p>
                            <button
                              onClick={() => handleCopy(rule, "Exit rule")}
                              className="ml-auto text-white/30 hover:text-white/70 transition-colors shrink-0"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Filters */}
              {strategy?.strategy_from_debate?.filters &&
                strategy.strategy_from_debate.filters.length > 0 && (
                  <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-400" />
                      Filters
                    </h3>
                    <div className="space-y-3">
                      {strategy.strategy_from_debate.filters.map(
                        (filter, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-medium text-purple-400 shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-white/80 pt-0.5">{filter}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Risk Management */}
              {strategy?.strategy_from_debate?.risk_management && (
                <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Risk Management
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {strategy.strategy_from_debate.risk_management
                      .position_size && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Position Size
                        </p>
                        <p className="text-white/80 font-medium">
                          {
                            strategy.strategy_from_debate.risk_management
                              .position_size
                          }
                        </p>
                      </div>
                    )}
                    {strategy.strategy_from_debate.risk_management
                      .stop_loss && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Stop Loss
                        </p>
                        <p className="text-white/80 font-medium">
                          {
                            strategy.strategy_from_debate.risk_management
                              .stop_loss
                          }
                        </p>
                      </div>
                    )}
                    {strategy.strategy_from_debate.risk_management
                      .take_profit && (
                      <div className="bg-black/40 rounded-xl p-4 border border-white/6">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-semibold">
                          Take Profit
                        </p>
                        <p className="text-white/80 font-medium">
                          {
                            strategy.strategy_from_debate.risk_management
                              .take_profit
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Code Tab - Strategy JSON */}
          {selectedTab === "code" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-black/60 border border-white/6 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="w-5 h-5 text-cyan-400" />
                    Full Strategy JSON
                  </h3>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(strategy, null, 2),
                        "Strategy JSON",
                      )
                    }
                    className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-xs font-mono text-white/70 max-h-150">
                  {JSON.stringify(strategy, null, 2)}
                </pre>
              </div>
              {copyFeedback === "Strategy JSON" && (
                <div className="text-center text-emerald-400 text-sm">
                  ✓ Copied to clipboard
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-12 sticky bottom-0 pb-8">
          <button
            onClick={handleOpenInBuilder}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Layers className="w-5 h-5" />
            Open in Strategy Builder
          </button>
          <button
            onClick={() => {
              const strategyId =
                location.state?.strategyId ||
                getStrategyByPrompt(strategy?.ticker || "")?.id ||
                1;
              useStrategyStore.getState().setCurrentStrategy(strategy as any);
              navigate("/backtest-run-1", {
                state: {
                  strategy,
                  strategyId,
                  backtestResult:
                    strategy?.backtest_result || strategy?.metrics
                      ? strategy
                      : null,
                },
              });
            }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20 shrink-0"
          >
            Backtest Again
          </button>
          
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F9D58] hover:bg-[#0c834a] text-white font-semibold rounded-xl transition-all shadow-lg shrink-0"
            title="Download PDF & Send to WhatsApp"
          >
            <FileText className="w-5 h-5" />
            Export & Send to WP
          </button>
        </div>

        {/* Global Toast for Export Feedback */}
        {copyFeedback && copyFeedback !== "Strategy JSON" && (
          <div className="fixed bottom-24 right-8 bg-[#0F9D58] text-white px-4 py-2 rounded-lg shadow-xl shadow-green-500/20 backdrop-blur-sm z-50 animate-in slide-in-from-bottom-2">
            {copyFeedback}
          </div>
        )}
      </div>
    </div>
  );
}

export default StrategyResultsPage;
