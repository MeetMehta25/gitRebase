export function normalizeBacktestResponse(apiResponse: any) {
  const data = apiResponse?.data || apiResponse;
  
  return {
    strategy: data?.strategy_from_debate || null,
    debateLog: data?.debate_log || [],
    backtest: {
      trades: data?.backtest_result?.trades || [],
      metrics: data?.backtest_result?.metrics || {},
      equityCurve: data?.backtest_result?.equity_curve || []
    }
  };
}
