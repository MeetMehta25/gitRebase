with open('/Users/shauryakitavat/Desktop/biteraser/server/strategy_parser/groq_client.py', 'r') as f:
    text = f.read()

# Replace the GroqClient logic
import_line = "from utils.key_rotator import groq_api_rotator"
if import_line not in text:
    text = text.replace("from dotenv import load_dotenv", "from dotenv import load_dotenv\n" + import_line)

text = text.replace("api_key = os.getenv(\"GROQ_API_KEY\")", "api_key = groq_api_rotator.get_next_key()")

import re
text = re.sub(r'class GroqClient:.*?def generate\(self, prompt\):', 
'''class GroqClient:

    def generate(self, prompt):
        api_key = groq_api_rotator.get_next_key()
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key)
''', text, flags=re.DOTALL)

with open('/Users/shauryakitavat/Desktop/biteraser/server/strategy_parser/groq_client.py', 'w') as f:
    f.write(text)


with open('/Users/shauryakitavat/Desktop/biteraser/server/strategy_parser/strategy_parser.py', 'r') as f:
    text2 = f.read()

if import_line not in text2:
    text2 = text2.replace("from dotenv import load_dotenv", "from dotenv import load_dotenv\n" + import_line)

text2 = re.sub(r'class GroqClient:.*?def generate\(self, prompt\):', 
'''class GroqClient:

    def generate(self, prompt):
        api_key = groq_api_rotator.get_next_key()
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key)
''', text2, flags=re.DOTALL)

with open('/Users/shauryakitavat/Desktop/biteraser/server/strategy_parser/strategy_parser.py', 'w') as f:
    f.write(text2)

