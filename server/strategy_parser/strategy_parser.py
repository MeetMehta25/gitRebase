import json
import os

from groq import Groq
from dotenv import load_dotenv
from utils.key_rotator import groq_api_rotator


# ─────────────────────────────────────────────
# Load ENV
# ─────────────────────────────────────────────
load_dotenv()


# ─────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────
SYSTEM_PROMPT = """
You are a financial strategy parser.

Convert natural language trading strategies into a strict JSON DSL.

Rules:
1. Always output VALID JSON
2. Extract ticker symbol
3. Identify indicators
4. Extract entry and exit conditions
5. Identify operators (<, >, cross_above, cross_below)

Supported indicators:

RSI
SMA
EMA
MACD
BollingerBands
VWAP

JSON Schema:

{
  "ticker": "STRING",
  "timeframe": "1d",
  "indicators": [],
  "entry_conditions": [],
  "exit_conditions": [],
  "position_size": 1.0
}

Example Input:
Buy INFY.NS when RSI < 30 and sell when RSI > 70

Example Output:
{
 "ticker": "INFY.NS",
 "timeframe": "1d",
 "indicators":[{"name":"RSI","period":14}],
 "entry_conditions":[{"indicator":"RSI","operator":"<","value":30}],
 "exit_conditions":[{"indicator":"RSI","operator":">","value":70}],
 "position_size":1.0
}
"""


# ─────────────────────────────────────────────
# GROQ CLIENT
# ─────────────────────────────────────────────
class GroqClient:

    def generate(self, prompt):
        api_key = groq_api_rotator.get_next_key()
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key)


        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )

        return response.choices[0].message.content


# ─────────────────────────────────────────────
# STRATEGY VALIDATOR
# ─────────────────────────────────────────────
class StrategyValidator:

    REQUIRED_FIELDS = [
        "ticker",
        "timeframe",
        "indicators",
        "entry_conditions",
        "exit_conditions",
        "position_size"
    ]

    def validate(self, strategy):

        for field in self.REQUIRED_FIELDS:
            if field not in strategy:
                raise ValueError(f"Missing required field: {field}")

        if not isinstance(strategy["indicators"], list):
            raise ValueError("indicators must be a list")

        if not isinstance(strategy["entry_conditions"], list):
            raise ValueError("entry_conditions must be a list")

        if not isinstance(strategy["exit_conditions"], list):
            raise ValueError("exit_conditions must be a list")

        return True


# ─────────────────────────────────────────────
# STRATEGY PARSER
# ─────────────────────────────────────────────
class StrategyParser:

    def __init__(self):

        self.llm = GroqClient()
        self.validator = StrategyValidator()

    def _clean_llm_output(self, response):

        return response.replace("```json", "").replace("```", "").strip()

    def parse(self, user_strategy):

        prompt = f"""
{SYSTEM_PROMPT}

User Strategy:
{user_strategy}

Return ONLY JSON.
"""

        response = self.llm.generate(prompt)

        cleaned = self._clean_llm_output(response)

        try:
            strategy_json = json.loads(cleaned)
        except Exception:
            raise ValueError(f"Invalid JSON from LLM:\n{cleaned}")

        self.validator.validate(strategy_json)

        return strategy_json