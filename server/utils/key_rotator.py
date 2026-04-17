import os

class APIKeyRotator:
    """Rotates between multiple API keys to avoid rate limits"""
    
    def __init__(self):
        keys = [
            os.getenv("GROQ_API_KEY", ""),
            os.getenv("GROQ_API_KEY1", ""),
            os.getenv("GROQ_API_KEY2", "")
        ]
        self.api_keys = [k for k in keys if k]
        if not self.api_keys:
            # Fallback to empty string for graceful failure if keys are absent
            self.api_keys = [""]
        self.current_index = 0
    
    def get_next_key(self):
        """Get the next API key in rotation"""
        key = self.api_keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.api_keys)
        return key

groq_api_rotator = APIKeyRotator()
