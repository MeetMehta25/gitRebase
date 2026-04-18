import re

with open("client/src/pages/PaperTradingPage.tsx", "r") as f:
    text = f.read()

if "import { useLocation" not in text:
    text = text.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";\nimport { useLocation } from "react-router-dom";')

with open("client/src/pages/PaperTradingPage.tsx", "w") as f:
    f.write(text)
