import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    target = '    @app.post("/api/data/quotes")'
    
    new_code = '''    @app.post("/api/brokers/connect")
    def connect_broker():
        body = request.get_json(silent=True) or {}
        broker_name = body.get("brokerName")
        broker_id = body.get("brokerId")
        api_key = body.get("apiKey")
        api_secret = body.get("apiSecret")
        
        if not broker_name or not broker_id or not api_key:
            return _resp(error="Missing required fields", status=400)
            
        db = get_db()
        brokers_coll = db["brokers"]
        
        doc = {
            "broker_name": broker_name,
            "broker_id": broker_id,
            "api_key": api_key,
            "api_secret": api_secret,
            "status": "connected"
        }
        
        brokers_coll.update_one(
            {"broker_name": broker_name, "broker_id": broker_id},
            {"$set": doc},
            upsert=True
        )
        
        return _resp(data={"status": "connected", "broker": broker_name})

    @app.post("/api/data/quotes")'''

    if target in content:
        content = content.replace(target, new_code)
        with open(filepath, 'w') as f:
            f.write(content)
        print("Success")
    else:
        print("Target not found")

if __name__ == "__main__":
    patch_file("../server/app.py")
