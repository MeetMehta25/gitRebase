# from strategy_parser.strategy_parser import StrategyParser
# from .validator import validate_strategy

import json
from groq_client import GroqClient
from validator import validate_strategy


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


class StrategyParser:

    def __init__(self):

        self.llm = GroqClient()



    def parse(self, user_strategy):

        prompt = f"""
{SYSTEM_PROMPT}

User Strategy:
{user_strategy}

Return ONLY JSON.
"""

        response = self.llm.generate(prompt)

        try:

            strategy_json = json.loads(response)

        except:

            raise ValueError("Invalid JSON from LLM")

        return strategy_json
    

    def validate_strategy(strategy):

        required_fields = [
            "ticker",
            "indicators",
            "entry_conditions",
            "exit_conditions"
        ]

        for field in required_fields:

            if field not in strategy:

                raise ValueError(f"Missing field: {field}")

        if not isinstance(strategy["entry_conditions"], list):

            raise ValueError("Entry conditions must be list")

        return True

parser = StrategyParser()

strategy = parser.parse(
    "Buy INFY.NS when RSI < 30 and sell when RSI > 70"
)

validate_strategy(strategy)

print(strategy)