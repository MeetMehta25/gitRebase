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
        # Ensure we use Green API schema correctly (usually NO waInstance prefix in base url, handle slash)
        api_base = os.environ.get("GREEN_API_URL", "https://api.green-api.com").rstrip('/')
        if not self.enabled:
            return
            
        self.instance_id = os.environ.get("GREEN_API_INSTANCE_ID")
        self.token = os.environ.get("GREEN_API_TOKEN")
        self.default_phone = os.environ.get("WHATSAPP_DEFAULT_PHONE", "")
        if self.default_phone.startswith('+'):
            self.default_phone = self.default_phone[1:]
        
        self.rate_limit_seconds = 10
        self.last_sent_time = 0
        
        if self.instance_id and self.token:
            self.base_url = f"{api_base}/waInstance{self.instance_id}"
        else:
            self.base_url = ""

    def _hash_msg(self, text: str) -> str:
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def send_message(self, message: str, phone: Optional[str] = None):
        if not self.enabled: return
        if not self.base_url: return

        target_phone = phone or self.default_phone
        if not target_phone: return

        msg_hash = self._hash_msg(message)
        now = time.time()

        if msg_hash in _seen_alerts and (now - _seen_alerts[msg_hash] < 3600):
            print(f"[AlertService] Skipping duplicate message: {message[:20]}")
            return
        
        if now - self.last_sent_time < self.rate_limit_seconds:
            print(f"[AlertService] Rate Limit hit, skipping message: {message[:20]}")
            return
            
        _seen_alerts[msg_hash] = now
        self.last_sent_time = now

        url = f"{self.base_url}/sendMessage/{self.token}"
        payload = {"chatId": f"{target_phone}@c.us", "message": message}

        thread = threading.Thread(target=self._send_request, args=(url, "POST", payload), daemon=True)
        thread.start()

    def send_file(self, file_path: str, caption: str = "", phone: Optional[str] = None):
        if not self.enabled: return
        if not self.base_url: return
        if not os.path.exists(file_path):
            print(f"[AlertService] File not found: {file_path}")
            return

        target_phone = phone or self.default_phone
        if not target_phone: return

        url = f"{self.base_url}/sendFileByUpload/{self.token}"
        
        filename = os.path.basename(file_path)
        payload = {
            "chatId": f"{target_phone}@c.us",
            "caption": caption,
            "fileName": filename
        }

        # Start thread to read file and send
        thread = threading.Thread(target=self._send_file_request, args=(url, payload, file_path), daemon=True)
        thread.start()

    def _send_request(self, url: str, method: str, payload: dict):
        try:
            response = requests.request(method, url, json=payload, timeout=10)
            if response.status_code == 200:
                print(f"[AlertService] Alert sent successfully: {response.json().get('idMessage', 'OK')}")
            else:
                print(f"[AlertService] Green API Error ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"[AlertService] Alert failure exception: {e}")

    def _send_file_request(self, url: str, data: dict, file_path: str):
        try:
            with open(file_path, 'rb') as f:
                # Green API requires files to be passed as multipart/form-data
                files = {'file': (os.path.basename(file_path), f, 'application/pdf')}
                response = requests.post(url, data=data, files=files, timeout=30)
            if response.status_code == 200:
                print(f"[AlertService] File sent successfully: {response.json().get('idMessage', 'OK')}")
            else:
                print(f"[AlertService] Green API File Upload Error ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"[AlertService] File alert failure exception: {e}")

# Global singleton
whatsapp_alert = WhatsAppAlertService()
