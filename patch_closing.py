with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    content = f.read()

target = """                      </div>
                    </div>
              {/* Quick Suggestions */}"""

replacement = """                      </div>
                    </div>
                  </form>
                </motion.div>
              {/* Quick Suggestions */}"""

content = content.replace(target, replacement)

with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(content)

