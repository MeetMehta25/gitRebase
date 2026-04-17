import re
with open('src/components/layout/AppLayout.tsx', 'r') as f:
    text = f.read()
    if "['/sandbox', '/playground', '/strategy-builder'].includes(location.pathname)" in text:
        print("YES")
