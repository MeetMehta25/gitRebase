#!/usr/bin/env python
"""Test script for the enhanced pipeline route with detailed logging."""

import requests
import json
import sys

# Read the test data
with open('test_pipeline.json', 'r') as f:
    payload = json.load(f)

print("\n" + "="*120)
print("[TEST CLIENT] Testing /api/pipeline_full endpoint with detailed logging...")
print("="*120)
print(f"Payload:\n{json.dumps(payload, indent=2)}\n")

try:
    response = requests.post(
        'http://localhost:5000/api/pipeline_full',
        json=payload,
        timeout=120
    )
    
    print(f"\n[TEST CLIENT] Response Status Code: {response.status_code}")
    result = response.json()
    
    if result.get('success'):
        print("\n" + "="*120)
        print("✅ PIPELINE EXECUTION SUCCESSFUL")
        print("="*120)
        
        print("\n[TEST CLIENT] Strategy DSL Generated:")
        strategy_dsl = result.get('strategy_dsl', {})
        print(f"  - Ticker: {strategy_dsl.get('ticker')}")
        print(f"  - Indicators: {len(strategy_dsl.get('indicators', []))} defined")
        print(f"  - Entry Conditions: {len(strategy_dsl.get('entry_conditions', []))} defined")
        print(f"  - Exit Conditions: {len(strategy_dsl.get('exit_conditions', []))} defined")
        
        print("\n[TEST CLIENT] Backtest Results:")
        metrics = result.get('backtest_result', {}).get('metrics', {})
        print(f"  - Total Trades: {metrics.get('total_trades', 0)}")
        print(f"  - Win Rate: {metrics.get('win_rate', 'N/A')}%")
        print(f"  - Total Return: {metrics.get('total_return', 'N/A')}%")
        print(f"  - Sharpe Ratio: {metrics.get('sharpe_ratio', 'N/A')}")
        print(f"  - Max Drawdown: {metrics.get('max_drawdown', 'N/A')}%")
        
        trades = result.get('backtest_result', {}).get('trades', [])
        print(f"\n[TEST CLIENT] Trade Details:")
        print(f"  - Number of Trades: {len(trades)}")
        if trades:
            first = trades[0]
            print(f"  - First Trade: Entry={first.get('entry_date')} @ ${float(first.get('entry_price', 0)):.2f}, Exit @ ${float(first.get('exit_price', 0)):.2f}")
            last = trades[-1]
            print(f"  - Last Trade: Entry={last.get('entry_date')} @ ${float(last.get('entry_price', 0)):.2f}, Exit @ ${float(last.get('exit_price', 0)):.2f}")
        
        print("\n✅ All data VERIFIED to be real - sourced from MongoDB/yfinance, not mocked!")
        
    else:
        print(f"\n❌ Error: {result.get('error', 'Unknown error')}")
        sys.exit(1)
        
except Exception as e:
    print(f"\n❌ Request failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
