from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import uuid
from config.database import get_db

paper_trading_bp = Blueprint("paper_trading", __name__, url_prefix="/api/paper_trading")

@paper_trading_bp.route("/deploy", methods=["POST"])
def deploy_strategy():
    """Deploy a backtested strategy to the Paper Trading engine"""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"success": False, "error": "Invalid strategy payload"}), 400

        db = get_db()
        
        # Create a new active session
        session_id = str(uuid.uuid4())
        initial_capital = payload.get("initial_capital", 100000)
        
        session = {
            "session_id": session_id,
            "strategy_id": payload.get("strategy_id", "manual"),
            "strategy_name": payload.get("strategy_name", payload.get("ticker", "UNKNOWN") + " Strategy"),
            "ticker": payload.get("ticker", "UNKNOWN"),
            "status": "active", # can be 'active', 'paused', 'stopped'
            "deployed_at": datetime.now(timezone.utc),
            "last_evaluated": None,
            "end_time": None,
            "payload": payload,
            # Financials
            "capital": initial_capital, # Cash remaining
            "initial_capital": initial_capital,
            "current_value": initial_capital, # Cash + portfolio value
            "pnl": 0.0,
            "pnl_percent": 0.0,
            # Sub-documents (can later move to separate collections)
            "positions": [], # Open positions
            "trades": []     # History of trades 
        }
        
        db["paper_trading_sessions"].insert_one(session)
        print(f"[Paper Trading] Deployed {session['ticker']} strategy -> {session_id}")
        
        return jsonify({
            "success": True, 
            "session_id": session_id,
            "message": "Strategy deployed to Paper Trading validation suite."
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paper_trading_bp.route("/sessions", methods=["GET"])
def get_sessions():
    """Get all paper trading sessions for the dashboard"""
    try:
        db = get_db()
        # Optionally filter by status based on query params
        status_filter = request.args.get('status')
        query = {}
        if status_filter:
            query['status'] = status_filter
            
        sessions = list(db["paper_trading_sessions"].find(query, {"_id": 0}))
        return jsonify({"success": True, "sessions": sessions}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paper_trading_bp.route("/sessions/<session_id>", methods=["GET"])
def get_session(session_id):
    """Get detailed information for a specific session"""
    try:
        db = get_db()
        session = db["paper_trading_sessions"].find_one({"session_id": session_id}, {"_id": 0})
        if not session:
            return jsonify({"success": False, "error": "Session not found"}), 404
            
        # Optional: Also query paper_trades if we moved it to a separate collection
        return jsonify({"success": True, "session": session}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paper_trading_bp.route("/sessions/<session_id>/status", methods=["PUT"])
def update_session_status(session_id):
    """Start, pause, or stop a session"""
    try:
        payload = request.get_json()
        new_status = payload.get("status")
        if new_status not in ["active", "paused", "stopped"]:
            return jsonify({"success": False, "error": "Invalid status"}), 400

        db = get_db()
        update_data = {"status": new_status}
        if new_status == "stopped":
            update_data["end_time"] = datetime.now(timezone.utc)
            
        result = db["paper_trading_sessions"].update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Session not found"}), 404
            
        return jsonify({
            "success": True, 
            "message": f"Session {session_id} status updated to {new_status}"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paper_trading_bp.route("/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Delete a paper trading session completely"""
    try:
        db = get_db()
        result = db["paper_trading_sessions"].delete_one({"session_id": session_id})
        
        if result.deleted_count == 0:
            return jsonify({"success": False, "error": "Session not found"}), 404
            
        return jsonify({"success": True, "message": "Session deleted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
