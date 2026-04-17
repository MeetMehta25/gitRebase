from datetime import datetime

def format_trade_signal(ticker: str, trade_data: dict, confidence_score: float = 0.0) -> str:
    """Format trade execution signal."""
    trade_id = trade_data.get("trade_id", "?")
    action = "BUY" if trade_data.get("entry_price") and not trade_data.get("exit_price") else "CLOSED"
    action_emoji = "🟢" if action == "BUY" else "🔴"
    price = trade_data.get("entry_price") or trade_data.get("exit_price", 0.0)
    pnl = trade_data.get("pnl_pct", 0)
    return (
        f"{action_emoji} *TRADE SIGNAL* | {ticker}\n\n"
        f"🎯 *Action:* {action}\n"
        f"💵 *Price:* ${price:.2f}\n"
        f"📊 *Confidence:* {confidence_score:.1f}%\n"
        f"{('💰 *PnL:* ' + str(round(pnl, 2)) + '%') if action == 'CLOSED' else ''}\n"
        f"🕒 *Time:* {datetime.now().strftime('%H:%M:%S UTC')}"
    )

def format_backtest_summary(ticker: str, backtest_result: dict, strategy_name: str) -> str:
    """Format backtest result summary."""
    summary = backtest_result.get("summary", {})
    metrics = backtest_result.get("metrics", {})
    return (
        f"📈 *BACKTEST COMPLETE* | {ticker}\n\n"
        f"🏷️ *Strategy:* {strategy_name}\n"
        f"⏱️ *Bars Tested:* {summary.get('bars_tested', 0)}\n"
        f"🔄 *Total Trades:* {summary.get('total_trades', 0)}\n"
        f"🎯 *Win Rate:* {metrics.get('win_rate', 0):.1f}%\n"
        f"💼 *Net Profit:* {metrics.get('total_return_pct', 0):.2f}%\n"
        f"📉 *Max DD:* {metrics.get('max_drawdown_pct', 0):.2f}%\n\n"
        f"🤖 *AI Summary:* Generated & Backtested."
    )

def format_risk_alert(ticker: str, issue_type: str, severity: str, details: str) -> str:
    """Format adversarial/risk alert when performance drops."""
    return (
        f"🚨 *RISK ALERT* ({severity}) | {ticker}\n\n"
        f"⚠️ *Issue:* {issue_type}\n"
        f"🔍 *Details:* {details}\n\n"
        f"Action required: Review adversarial stress-test results."
    )
