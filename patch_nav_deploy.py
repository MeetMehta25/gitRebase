import re

with open("client/src/pages/PaperTradingPage.tsx", "r") as f:
    text = f.read()

# Add useLocation import
if "useLocation" not in text:
    text = text.replace("import React, { useState, useEffect }", "import React, { useState, useEffect } from 'react';\nimport { useLocation }")

# Change view state init
text = text.replace("const [view, setView] = useState(\"dashboard\");", "const location = useLocation();\n  const [view, setView] = useState(location.state?.tab || \"deploy\");")

with open("client/src/pages/PaperTradingPage.tsx", "w") as f:
    f.write(text)
print("Deploy patch updated")
