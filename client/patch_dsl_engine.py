import re

with open('server/backtest_engine/dsl_engine.py', 'r') as f:
    content = f.read()

import_str = """
from services.alert_service import whatsapp_alert
from services.alert_formatter import format_trade_signal
"""

if "alert_service" not in content:
    content = re.sub(r'import uuid\n', f'import uuid\n{import_str}\n', content)

alert_hook = """
    # --- WHATSAPP TRADE SIGNAL ALERT ---
    try:
        if trades and len(trades) > 0:
            # Pick the most recent trade or best trade to send as signal
            # Example: last trade
            signal_trade = trades[-1]
            signal_msg = format_trade_signal(
                ticker=ticker,
                trade_data=signal_trade,
                confidence_score=metrics.get("win_rate", 50.0)  # Use win rate as mock confidence
            )
            whatsapp_alert.send_message(signal_msg)
    except Exception as e:
        print(f"[Alert] Failed to send trade signal alert: {e}")
    # ------------------------------------

    elapsed = round(time.time() - t0, 3)
"""

content = re.sub(r'    elapsed = round\(time.time\(\) - t0, 3\)', alert_hook, content)

with open('server/backtest_engine/dsl_engine.py', 'w') as f:
    f.write(content)

