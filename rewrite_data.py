import re

with open("client/src/data/backtestRunData.ts", "r") as f:
    text = f.read()

# Replace export const generateDynamicData with export function regenerateData
# Replace return {...} with assigning to let variables

# Actually, I'll just write it directly.
