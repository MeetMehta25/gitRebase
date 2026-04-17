import os
from groq import Groq
from dotenv import load_dotenv
from utils.key_rotator import groq_api_rotator

# load variables from .env
load_dotenv()

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