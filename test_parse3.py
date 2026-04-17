import urllib.request as r
import json

dsl = {
  "strategy_id": 1,
  "ticker": "INFY.NS",
  "goal": "momentum",
  "prompt": "",
  "indicators": [
    {"name": "BB", "period": 20, "stddev": 2}
  ],
  "entry_conditions": [
    {"indicator": "close", "operator": "<", "value": "BB_LOWER_20"}
  ],
  "exit_conditions": [
    {"indicator": "close", "operator": ">", "value": "BB_UPPER_20"}
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
