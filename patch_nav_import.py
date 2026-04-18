import re

with open("client/src/pages/PaperTradingPage.tsx", "r") as f:
    text = f.read()

if "import { useLocation" not in text:
    text = text.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useLocation } from "react-router-dom";')
    text = text.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";\nimport { useLocation } from "react-router-dom";')
    
    # Just in case
    if "import { useLocation" not in text:
      text = 'import { useLocation } from "react-router-dom";\n' + text

with open("client/src/pages/PaperTradingPage.tsx", "w") as f:
    f.write(text)
