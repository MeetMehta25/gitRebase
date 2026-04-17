import re

with open('app.py', 'r') as f:
    content = f.read()

# 1. Add imports at the top
import_str = "from agents import get_all_trading_agents, get_consensus_agent"
new_import_str = "from agents import get_all_trading_agents, get_consensus_agent, build_market_context_string\nfrom langchain_core.messages import SystemMessage, HumanMessage"
content = content.replace(import_str, new_import_str)

# 2. Replace the body of run_trading_strategy_debate
match = re.search(r'def run_trading_strategy_debate\(trading_request: dict\) -> dict:(.*?)(?=\n\n# =+|$)', content, re.DOTALL)
if not match:
    print("Could not find function")
    exit(1)

original_func = match.group(0)

new_func = """def run_trading_strategy_debate(trading_request: dict) -> dict:
    \"\"\"
    Run 4-stage sequential debate to design trading strategy
    
    Agent1 -> generates idea
    Agent2 -> critiques/refines
    Agent3 -> improves logic
    Agent4 -> adds risk constraints
    \"\"\"
    
    # Clear log capture for this debate
    log_capture.clear()
    
    # ── Extract trading parameters ────────────────────────────────────────
    asset = trading_request.get("asset", "UNKNOWN")
    timeframe = trading_request.get("timeframe", "1D")
    goal = trading_request.get("goal", "alpha generation")
    risk_level = trading_request.get("risk_level", "moderate")
    capital = trading_request.get("capital", 100000)
    market = trading_request.get("market", "equity")
    selected_agent_names = trading_request.get("selected_agents", [])
    
    topic = f"{asset} ({market}, {timeframe} timeframe, {goal} goal, {risk_level} risk)"
    
    msg = f"Starting trading strategy sequence for: {topic}"
    log_capture.add(msg)
    logger.info(msg)
    
    if not selected_agent_names:
        raise ValueError("selected_agents must be provided")

    agents = get_agents_by_names(selected_agent_names)
    msg = f"Using {len(agents)} user-selected agents"
    log_capture.add(msg)
    logger.info(msg)
    
    if not agents:
        raise ValueError("No valid agents returned for names")
        
    # Map sequence to agents
    a1 = agents[0]
    a2 = agents[1 % len(agents)]
    a3 = agents[2 % len(agents)]
    a4 = agents[3 % len(agents)]
    
    debate_results = {}
    market_context = build_market_context_string(trading_request)
    
    try:
        # ---- STAGE 1: IDEA GENERATION ----
        log_capture.add(f"💡 STAGE 1: {a1.name} generates initial core idea...")
        user_prompt1 = f"Design an initial core trading idea for: {topic}. Focus purely on the high-level logic and market edge.\\n\\n{market_context}"
        idea_res = a1.model.invoke([SystemMessage(content=a1.system_prompt), HumanMessage(content=user_prompt1)])
        idea_text = idea_res.content
        log_capture.add(f"💭 {a1.name}: {idea_text[:200]}...")
        debate_results["stage_1_idea"] = {"agent": a1.name, "output": idea_text}
        
        # ---- STAGE 2: CRITIQUE / REFINE ----
        log_capture.add(f"🔍 STAGE 2: {a2.name} critiques and refines the idea...")
        user_prompt2 = f"Here is an initial trading idea for {topic}:\\n\\n{idea_text}\\n\\nCritique and explicitly refine this idea based on your expertise. Focus on identifying weaknesses and mathematically refining the core conditions.\\n\\n{market_context}"
        refine_res = a2.model.invoke([SystemMessage(content=a2.system_prompt), HumanMessage(content=user_prompt2)])
        refine_text = refine_res.content
        log_capture.add(f"💭 {a2.name}: {refine_text[:200]}...")
        debate_results["stage_2_refine"] = {"agent": a2.name, "output": refine_text}

        # ---- STAGE 3: IMPROVE LOGIC ----
        log_capture.add(f"⚙️ STAGE 3: {a3.name} improves technical logic...")
        user_prompt3 = f"Here is a refined trading concept for {topic}:\\n\\n{refine_text}\\n\\nImprove the technical logic, adding precise technical indicators, strict entry criteria, and clear exit logic based on your expertise.\\n\\n{market_context}"
        logic_res = a3.model.invoke([SystemMessage(content=a3.system_prompt), HumanMessage(content=user_prompt3)])
        logic_text = logic_res.content
        log_capture.add(f"💭 {a3.name}: {logic_text[:200]}...")
        debate_results["stage_3_logic"] = {"agent": a3.name, "output": logic_text}

        # ---- STAGE 4: RISK CONSTRAINTS ----
        log_capture.add(f"🛡️ STAGE 4: {a4.name} adds risk constraints...")
        user_prompt4 = f"Here is the detailed trading logic for {topic}:\\n\\n{logic_text}\\n\\nAdd robust risk constraints, money management rules, position sizing, stop losses, and market regime filters based on your expertise.\\n\\n{market_context}"
        risk_res = a4.model.invoke([SystemMessage(content=a4.system_prompt), HumanMessage(content=user_prompt4)])
        risk_text = risk_res.content
        log_capture.add(f"💭 {a4.name}: {risk_text[:200]}...")
        debate_results["stage_4_risk"] = {"agent": a4.name, "output": risk_text}
        
    except Exception as e:
        msg = f"  ✗ Sequence aborted due to error: {str(e)}"
        log_capture.add(msg)
        logger.error(msg)
        if STRICT_MODE:
            raise e
        return {
            "success": False,
            "topic": topic,
            "trading_request": trading_request,
            "debate": debate_results,
            "strategy": {},
            "agents_used": [a.name for a in agents],
            "debate_log": log_capture.get_all(),
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

    # CONSENSUS: SYNTHESIZE FINAL STRATEGY
    msg = f"CONSENSUS: Synthesizing final trading strategy..."
    log_capture.add(msg)
    logger.info(msg)
    
    try:
        consensus_agent = get_consensus_agent()
        # Create a mock debate dictionary to pass to consensus agent
        mock_debate = {
            a1.name + " (Idea)": {"argument": idea_text},
            a2.name + " (Refinement)": {"argument": refine_text},
            a3.name + " (Logic)": {"argument": logic_text},
            a4.name + " (Risk)": {"argument": risk_text}
        }
        
        strategy_result = consensus_agent.synthesize_strategy(topic, mock_debate)
        final_strategy = strategy_result.get("strategy", {})
        
        consensus_msg = f"✨ Consensus Reached: Final strategy strictly structured."
        log_capture.add(consensus_msg)
        logger.info(f"  ✓ Final strategy synthesized successfully")
        
        return {
            "success": True,
            "topic": topic,
            "trading_request": trading_request,
            "debate": debate_results,
            "strategy": final_strategy,
            "agents_used": [a.name for a in agents],
            "debate_log": log_capture.get_all(),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        msg = f"  ✗ Consensus synthesis failed: {str(e)}"
        log_capture.add(msg)
        logger.error(msg)
        
        if STRICT_MODE:
            raise e
        return {
            "success": False,
            "topic": topic,
            "trading_request": trading_request,
            "debate": debate_results,
            "strategy": {},
            "debate_log": log_capture.get_all(),
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }"""

content = content.replace(original_func, new_func)

with open('app.py', 'w') as f:
    f.write(content)

print("Patched app.py")
