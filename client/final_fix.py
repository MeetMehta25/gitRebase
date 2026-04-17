with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# Add export function back
text = text.replace('const handleIntroSubmit = (e?: React.FormEvent) => {',
                    'export default function AiAgentsPage() {\n  const handleIntroSubmit = (e?: React.FormEvent) => {')

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)
