"""
Token-bucket rate limiter.
Each data source gets its own instance so they don't interfere.
"""

import time
import threading
from utils.logger import setup_logger

logger = setup_logger(__name__)


class RateLimiter:
    def __init__(self, calls_per_minute: int, source: str):
        self.calls_per_minute = calls_per_minute
        self.source = source
        self.min_interval = 60.0 / calls_per_minute
        self._lock = threading.Lock()
        self._last_call = 0.0

    def wait(self):
        with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_call
            if elapsed < self.min_interval:
                sleep_for = self.min_interval - elapsed
                logger.debug(f"[{self.source}] Rate limit: sleeping {sleep_for:.2f}s")
                time.sleep(sleep_for)
            self._last_call = time.monotonic()