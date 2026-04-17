with open("client/src/data/strategyData.ts", "r") as f:
    lines = f.readlines()

start_fallback = -1
end_fallback = -1

for i, line in enumerate(lines):
    if "export const FALLBACK_BACKTEST" in line:
        start_fallback = i
    elif "export async function apiWithFallback" in line:
        end_fallback = i  # fallback goes up to here roughly

if start_fallback != -1:
    del lines[start_fallback: len(lines)]

with open("client/src/data/strategyData.ts", "w") as f:
    f.writelines(lines)
print("Removed FALLBACK and apiWithFallback from strategyData.ts")

