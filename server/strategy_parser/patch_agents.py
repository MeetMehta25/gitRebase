import re

with open('/Users/shauryakitavat/Desktop/biteraser/server/agents.py', 'r') as f:
    text = f.read()

# remove old APIKeyRotator class and global variable
import_line = "from utils.key_rotator import groq_api_rotator"
if import_line not in text:
    text = text.replace("load_dotenv()", "load_dotenv()\n\n" + import_line)

text = re.sub(r'class APIKeyRotator:.*?api_rotator = APIKeyRotator\(\)', '', text, flags=re.DOTALL)
text = text.replace("api_rotator.get_next_key()", "groq_api_rotator.get_next_key()")

with open('/Users/shauryakitavat/Desktop/biteraser/server/agents.py', 'w') as f:
    f.write(text)

