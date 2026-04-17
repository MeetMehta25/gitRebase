with open("client/src/pages/AiAgentsPage.tsx", "r") as f:
    content = f.read()

target = """              {/* Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="w-full max-w-2xl mb-8"
              >
                <form
                  onSubmit={handleIntroSubmit}
                  className="relative flex flex-col gap-4 bg-[#1E1E1E] border border-white/10 hover:border-white/20 rounded-2xl p-4 focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all"
                >"""

fallback_target = """              {/* Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="w-full max-w-2xl mb-8"
              >
                <form
                  onSubmit={handleIntroSubmit}
                  className="relative flex items-center bg-[#1E1E1E] border border-white/10 hover:border-white/20 rounded-2xl p-3 focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all"
                >"""

replacement = """              {/* Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="w-full max-w-2xl mb-8"
              >
                <form
                  onSubmit={handleIntroSubmit}
                  className="relative flex flex-col gap-4 bg-[#1E1E1E] border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-lg focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all"
                >
                  <div className="flex items-center">"""

content = content.replace(fallback_target, replacement)
content = content.replace(target, replacement)

# We also need to add the extra inputs underneath the prompt input
target_end_form = """                  <motion.button
                    type="submit"
                    disabled={!inputValue.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 rounded-xl bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:hover:bg-purple-500 disabled:cursor-not-allowed shrink-0 mr-1 shadow-lg"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </motion.button>
                </form>"""

replacement_end_form = """                  <motion.button
                    type="submit"
                    disabled={!inputValue.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 rounded-xl bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:hover:bg-purple-500 disabled:cursor-not-allowed shrink-0 mr-1 shadow-lg"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </motion.button>
                  </div>
                  
                  {/* Parameter Controls */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1 pt-3 border-t border-white/10">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/50 mb-1 uppercase tracking-wider font-semibold pl-1">Ticker</label>
                      <input 
                        type="text" 
                        value={ticker} 
                        onChange={(e) => setTicker(e.target.value)} 
                        placeholder="Auto-detect" 
                        className="bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/50 mb-1 uppercase tracking-wider font-semibold pl-1">Timeframe</label>
                      <select 
                        value={timeframe} 
                        onChange={(e) => setTimeframe(e.target.value)} 
                        className="bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="1m">1 Minute</option>
                        <option value="5m">5 Minutes</option>
                        <option value="15m">15 Minutes</option>
                        <option value="1h">1 Hour</option>
                        <option value="1d">1 Day</option>
                        <option value="1wk">1 Week</option>
                        <option value="1mo">1 Month</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/50 mb-1 uppercase tracking-wider font-semibold pl-1">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/50 mb-1 uppercase tracking-wider font-semibold pl-1">End Date</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </form>"""

content = content.replace(target_end_form, replacement_end_form)

with open("client/src/pages/AiAgentsPage.tsx", "w") as f:
    f.write(content)

