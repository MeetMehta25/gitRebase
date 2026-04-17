import os
import time
import requests
import threading
import hashlib
from typing import Optional

# Global cache for deduplication (hash -> timestamp)
_seen_alerts = {}

class WhatsAppAlertService:
    def __init__(self):
        self.enabled = os.environ.get("ENABLE_WHATSAPP_ALERTS", "False").lower() in ("true", "1", "yes")
        self.api_url = os.environ.get("GREEN_API_URL", "https://api.green-api.com")
        self.instance_id = os.environ.get("GREEN_API_INSTANCE_ID")
        self.token = os.environ.get("GREEN_API_TOKEN")
        self.default_phone = os.environ.get("WHATSAPP_DEFAULT_PHONE")
        self.rate_limit_seconds = 10
        self.last_sent_time = 0

    def _hash_msg(self, text: str) -> str:
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def send_message(self, message: str, phone: Optional[str] = None):
        if not self.enabled:
            return  # Silently skip

        if not self.instance_id or not self.token:
            print("[AlertService] Missing Green API keys, skipping alert.")
            return

        target_phone = phone or self.default_phone
        if not target_phone:
            print("[AlertService] Missing target phone number, skipping alert.")
            return

        msg_hash = self._hash_msg(message)
        now = time.time()

        # Deduplication (1 hr lockout for exact same message context)
        if msg_hash in _seen_alerts and (now - _seen_alerts[msg_hash] < 3600):
            print(f"[AlertService] Skipping duplicate message: {message[:20]}")
            return
        
        # Simple rate limiting
        if now - self.last_sent_time < self.rate_limit_seconds:
            print(f"[AlertService] Rate Limit hit, skipping message: {message[:20]}")
            return
            
        _seen_alerts[msg_hash] = now
        self.last_sent_time = now

        url = f"{self.api_url}/waInstance{self.instance_id}/sendMessage/{self.token}"
        payload = {"chatId": f"{target_phone}@c.us", "message": message}

        # Non-blocking async execution
        thread = threading.Thread(target=self._send_request, args=(url, payload), daemon=True)
        thread.start()

    def _send_request(self, url: str, payload: dict):
        try:
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                print(f"[AlertService] Alert sent successfully: {response.json().get('idMessage', 'OK')}")
            else:
                print(f"[AlertService] Green API Error ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"[AlertService] Alert failure exception: {e}")

# Global singleton
whatsapp_alert = WhatsAppAlertService()
