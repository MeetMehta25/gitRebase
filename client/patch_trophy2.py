import os

filepath = 'src/components/layout/AppLayout.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the Trophy div
target1 = """            <div className={cn("mt-4 flex rounded-lg bg-black/40 border border-white/5 p-2 items-center justify-center transition-all", isCollapsed ? "flex-col gap-1 mx-1" : "flex-row gap-3 mx-2")}>
               <Trophy className="w-4 h-4 text-yellow-500" />
               <div className={cn("text-xs font-bold text-yellow-500", isCollapsed && "text-[10px]")}>{profile.points} pts</div>
            </div>"""

replacement = """            <div 
              title={profile.age ? `${profile.points} Trophies | Age: ${profile.age}` : `${profile.points} Trophies`}
              className={cn("mt-4 flex rounded-lg bg-black/40 border border-white/5 p-2 items-center justify-center hover:bg-white/10 transition-all cursor-pointer group", isCollapsed ? "mx-1" : "mx-4")}
            >
               <Trophy className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" />
            </div>"""

if target1 in content:
    content = content.replace(target1, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find target1")
