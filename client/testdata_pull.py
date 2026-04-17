from datetime import datetime
from backtest_engine.engine import run_dsl_backtest

dsl = {
  "strategy_name": "Mock Built Strategy",
  "ticker": "TCS.NS",
  "entry_conditions": [
    { "indicator": "RSI", "operator": "<", "value": 40 }
  ],
  "exit_conditions": [
    { "indicator": "RSI", "operator": ">", "value": 60 }
  ],
  "indicators": [{"name": "RSI", "period": 14}]
}

try:
    res = run_dsl_backtest(dsl, result_id="abcd")
    import json
    with open('test_pipeline.json', 'w') as f:
        json.dump(res, f, default=str, indent=2)
except Exception as e:
    import traceback
    traceback.print_exc()
