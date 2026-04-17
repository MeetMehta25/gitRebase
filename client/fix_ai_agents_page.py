import sys

with open("src/pages/AiAgentsPage.tsx", "r") as f:
    text = f.read()

# I see it simply lost the whole function declaration:
# export default function AiAgentsPage() { ... hook states ...
# The hardcoded conversations were right above the handleIntroSubmit
function_declaration = """
export default function AiAgentsPage() {
  const navigate = useNavigate();
  // State
  const [inputValue, setInputValue] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [viewMode, setViewMode] = useState<"intro" | "summoning" | "selection" | "debate">("intro");
  const [revealedAgentIndex, setRevealedAgentIndex] = useState(-1);
  const [summoningComplete, setSummoningComplete] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(DEFAULT_AGENTS);
  const [debateLogs, setDebateLogs] = useState<any[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStrategyStore = useStrategyStore((state) => state.setStrategy);
  const logsContainerRef = useRef<HTMLDivElement>(null);
"""

import re
# Insert the function declaration before handleIntroSubmit
text = re.sub(r'(\s*const handleIntroSubmit = \()', f'\n{function_declaration}\\1', text)

with open("src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(text)

