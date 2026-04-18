from pymongo import MongoClient

def patch_db():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["paper_trading_db"]
    sessions = db["paper_trading_sessions"].find()
    
    for session in sessions:
        payload = session.get("payload", {})
        if str(payload.get("strategy_from_debate")).lower() == "true" or not isinstance(payload.get("strategy_from_debate"), dict):
            payload["strategy_from_debate"] = {
                "entry_rules": ["Analyze short-term momentum", "Execute on moving average crossover"],
                "exit_rules": ["Exit on adverse trend reversal", "Strict stop-loss at 2%"]
            }
        
        if "parameters" not in payload:
            payload["parameters"] = {
                "position_size_pct": 5,
                "stop_loss_pct": 2,
                "take_profit_pct": 10
            }
        
        if "timeframe" not in payload:
            payload["timeframe"] = "1h"
            
        db["paper_trading_sessions"].update_one(
            {"_id": session["_id"]},
            {"$set": {"payload": payload}}
        )
    print("DB patched!")

patch_db()