"""
test_adversarial.py
───────────────────
Test script for the new POST /api/adversarial endpoint.
Demonstrates adversarial stress-testing of trading strategies.

Prerequisites:
  1. Flask server running: python server/app.py
  2. MongoDB running and seeded with strategies
  3. A valid strategy_id from POST /api/pipeline_full

Usage:
  python test_adversarial.py
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_adversarial_stress_test():
    """Test the adversarial stress-testing endpoint"""
    
    print("\n" + "="*80)
    print("🚨 ADVERSARIAL STRESS-TEST DEMO")
    print("="*80)
    
    # Step 1: Create a strategy (or use an existing one)
    print("\n[STEP 1] Creating a baseline strategy...")
    
    pipeline_payload = {
        "prompt": "Create a medium risk swing trading strategy for PYPL using momentum indicators",
        "start_date": "2015-01-01",
        "initial_capital": 100000,
        "position_size": 0.20,
        "commission_pct": 0.001,
        "slippage_pct": 0.0005,
        "stop_loss_pct": 0.10,
        "take_profit_pct": 0.25
    }
    
    print("  POST /api/pipeline_full")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/pipeline_full",
            json=pipeline_payload,
            timeout=180
        )
        result = resp.json()
        
        if not result.get("success"):
            print(f"  ✗ Pipeline failed: {result.get('error')}")
            return
        
        strategy_id = result["data"]["strategy_id"]
        print(f"  ✓ Strategy created: {strategy_id}")
        print(f"    Original Sharpe Ratio: {result['data']['backtest_result'].get('sharpe_ratio', 'N/A')}")
        print(f"    Original Win Rate: {result['data']['backtest_result'].get('win_rate', 'N/A')}")
        print(f"    Original Max Drawdown: {result['data']['backtest_result'].get('max_drawdown', 'N/A')}")
        
    except Exception as e:
        print(f"  ✗ Error creating strategy: {e}")
        return
    
    # Step 2: Run adversarial stress test with all agents
    print("\n[STEP 2] Running adversarial agents...")
    
    adversarial_payload = {
        "strategy_id": strategy_id,
        "agents": ["crisis_injection", "liquidity_shock", "crowding_risk", "adversarial"]
    }
    
    print("  POST /api/adversarial")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/adversarial",
            json=adversarial_payload,
            timeout=300  # Longer timeout for backtest execution
        )
        result = resp.json()
        
        if not result.get("success"):
            print(f"  ✗ Adversarial test failed: {result.get('error')}")
            return
        
        data = result["data"]
        adversarial_id = data["adversarial_id"]
        print(f"  ✓ Stress test complete: {adversarial_id}")
        
        # Print loopholes found
        print(f"\n  📊 LOOPHOLES FOUND ({len(data['loopholes'])} total):")
        loopholes_by_agent = {}
        for loophole in data["loopholes"]:
            agent = loophole["agent"]
            if agent not in loopholes_by_agent:
                loopholes_by_agent[agent] = []
            loopholes_by_agent[agent].append(loophole)
        
        for agent, loopholes in loopholes_by_agent.items():
            print(f"\n    {agent.upper()}:")
            for loophole in loopholes:
                severity_emoji = "🔴" if loophole["severity"] == "high" else "🟡" if loophole["severity"] == "medium" else "🟢"
                print(f"      {severity_emoji} {loophole['finding']} (confidence: {loophole['confidence']:.0%})")
        
        # Print improvement delta
        print(f"\n  📈 STRESS TEST RESULTS:")
        delta = data["improvement_delta"]
        print(f"    Sharpe Ratio: {delta['sharpe_ratio']:+.4f}")
        print(f"    Max Drawdown: {delta['max_drawdown']:+.4f}")
        print(f"    Win Rate: {delta['win_rate']:+.4f}")
        print(f"    Total Return: {delta['total_return']:+.4f}")
        print(f"    Trade Count: {delta['total_trades']:+d}")
        
        # Interpretation
        print(f"\n  💡 INTERPRETATION:")
        if delta["sharpe_ratio"] > 0:
            print(f"    ✓ Risk-adjusted returns improved after stress modifications")
        else:
            print(f"    ⚠ Risk-adjusted returns decreased (may indicate overfitting in original)")
        
        if delta["max_drawdown"] > 0:
            print(f"    ⚠ Max drawdown worsened (adverse strategy becomes more risky)")
        else:
            print(f"    ✓ Max drawdown reduced (stress modifications make strategy more robust)")
        
        # Original vs Stress metrics
        print(f"\n  📊 DETAILED METRICS:")
        print(f"\n    ORIGINAL BACKTEST:")
        orig = data["original_backtest"]
        print(f"      Sharpe Ratio: {orig.get('sharpe_ratio', 'N/A')}")
        print(f"      Win Rate: {orig.get('win_rate', 'N/A')}")
        print(f"      Total Return: {orig.get('total_return', 'N/A')}")
        print(f"      Max Drawdown: {orig.get('max_drawdown', 'N/A')}")
        print(f"      Total Trades: {orig.get('total_trades', 'N/A')}")
        
        print(f"\n    STRESS-TESTED BACKTEST (with modifications):")
        stress = data["stress_backtest"]
        print(f"      Sharpe Ratio: {stress.get('sharpe_ratio', 'N/A')}")
        print(f"      Win Rate: {stress.get('win_rate', 'N/A')}")
        print(f"      Total Return: {stress.get('total_return', 'N/A')}")
        print(f"      Max Drawdown: {stress.get('max_drawdown', 'N/A')}")
        print(f"      Total Trades: {stress.get('total_trades', 'N/A')}")
        
    except Exception as e:
        print(f"  ✗ Error during adversarial test: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 3: Test with specific subset of agents
    print("\n[STEP 3] Testing with crisis_injection agent only...")
    
    adversarial_payload_single = {
        "strategy_id": strategy_id,
        "agents": ["crisis_injection"]
    }
    
    print("  POST /api/adversarial (crisis_injection only)")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/adversarial",
            json=adversarial_payload_single,
            timeout=300
        )
        result = resp.json()
        
        if result.get("success"):
            data = result["data"]
            print(f"  ✓ Single-agent test complete")
            print(f"    Loopholes found: {len(data['loopholes'])}")
            for loophole in data["loopholes"]:
                print(f"      • {loophole['finding']}")
        else:
            print(f"  ✗ Failed: {result.get('error')}")
    
    except Exception as e:
        print(f"  ✗ Error: {e}")
    
    print("\n" + "="*80)
    print("✅ ADVERSARIAL STRESS-TEST DEMO COMPLETE")
    print("="*80 + "\n")


if __name__ == "__main__":
    test_adversarial_stress_test()
