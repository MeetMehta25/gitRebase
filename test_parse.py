import urllib.request as r
import json

dsl = {
  "strategy_id": 1,
  "ticker": "INFY.NS",
  "goal": "momentum",
  "prompt": "",
  "indicators": [
    {"name": "RSI", "period": 14},
    {"name": "MACD", "fast_period": 12, "slow_period": 26, "signal_period": 9}
  ],
  "entry_conditions": [
    {"indicator": "RSI_14", "operator": "<", "value": 30},
    {"indicator": "MACD_12_26_9", "operator": ">", "value": "MACD_SIGNAL_12_26_9"}
  ],
  "exit_conditions": [
    {"indicator": "RSI_14", "operator": ">", "value": 70},
    {"indicator": "MACD_12_26_9", "operator": "<", "value": "MACD_SIGNAL_12_26_9"}
  ],
  "initial_capital": 100000,
  "position_size": 0.1,
  "commission_pct": 0.001,
  "slippage_pct": 0.0005,
  "stop_loss_pct": None,
  "take_profit_pct": None
}

try:
    req = r.Request("http://127.0.0.1:5000/api/strategy/backtest_nodes", json.dumps({"dsl": dsl}).encode(), {"Content-Type": "application/json"}, method="POST")
    print(r.urlopen(req).read().decode()[:500])
except Exception as e:
    print(e.read().decode())
