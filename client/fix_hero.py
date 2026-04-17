with open("src/components/Hero.tsx", "r", encoding='utf-8') as f:
    text = f.read()

target1 = '<button className="flex items-center gap-2 bg-[#11111A]/80 border border-white/10 text-[#FACC15] font-sans text-sm px-6 py-2.5 rounded-full hover:bg-white/5 transition-all">'
target2 = '<button className="flex items-center gap-2 bg-[#11111A]/80 border border-white/10 text-white font-sans text-sm px-6 py-2.5 rounded-full hover:bg-white/5 transition-all">'

rep1 = '<button onClick={() => window.location.href="/dashboard"} className="flex items-center gap-2 bg-[#11111A]/80 border border-white/10 text-[#FACC15] font-sans text-sm px-6 py-2.5 rounded-full hover:bg-white/5 transition-all">'
rep2 = '<button onClick={() => window.location.href="/dashboard"} className="flex items-center gap-2 bg-[#11111A]/80 border border-white/10 text-white font-sans text-sm px-6 py-2.5 rounded-full hover:bg-white/5 transition-all">'

text = text.replace(target1, rep1).replace(target2, rep2)

with open("src/components/Hero.tsx", "w", encoding='utf-8') as f:
    f.write(text)

