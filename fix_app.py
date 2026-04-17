import re

with open("server/app.py", "r", encoding="utf-8") as f:
    text = f.read()

# The incorrect injection looks like:
# @app.post("/api/data/fetch")
# 
#     # ── Live Quotes (with rudimentary caching) ─────────────────────────────────
# ...
#     def fetch_ticker():

bad_pattern = r'(@app\.post\("/api/data/fetch"\))\s*\n\s*# ── Live Quotes.*?def fetch_ticker\(\):'
match = re.search(bad_pattern, text, re.DOTALL)
if match:
    # We want to put the @app.post("/api/data/fetch") right above def fetch_ticker():
    full_injected_string = match.group(0)
    # The actual payload starts after the decorator:
    payload = full_injected_string.replace('@app.post("/api/data/fetch")', '').strip()
    # But wait, payload ends with `def fetch_ticker():`. Let's remove that from the end.
    payload = payload[:-len("def fetch_ticker():")].strip()
    
    # Now piece it together properly:
    fixed_string = payload + '\n\n    @app.post("/api/data/fetch")\n    def fetch_ticker():'
    
    text = text.replace(full_injected_string, fixed_string)
    with open("server/app.py", "w", encoding="utf-8") as f:
        f.write(text)
    print("Fixed app.py injection")
else:
    print("Pattern not found")

