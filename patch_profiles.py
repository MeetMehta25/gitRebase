import os
import re

# 1. Create useProfile hook
hook_content = """import { useState, useEffect } from 'react';

export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface UserProfile {
  age: number | null;
  level: UserLevel | null;
  points: number;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        pass;
      }
    }
    return { age: null, level: null, points: 0 };
  });

  const [showGamificationToast, setShowGamificationToast] = useState<{message: string, points: number} | null>(null);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addPoints = (points: number, message: string) => {
    setProfile(prev => ({ ...prev, points: prev.points + points }));
    setShowGamificationToast({ message, points });
    setTimeout(() => setShowGamificationToast(null), 3000);
  };

  return { profile, updateProfile, addPoints, showGamificationToast };
}
"""

os.makedirs('client/src/hooks', exist_ok=True)
with open('client/src/hooks/useProfile.ts', 'w') as f:
    f.write(hook_content.replace('pass;', ''))


# 2. Modify AppLayout.tsx to use this and show the setup modal
applayout_path = 'client/src/components/layout/AppLayout.tsx'
with open(applayout_path, 'r') as f:
    applayout = f.read()

impl_hook = """import { useProfile, UserLevel } from "../../hooks/useProfile";
import { Star, Trophy, ThumbsUp } from "lucide-react";

// Modal Component
function ProfileSetupModal({ updateProfile }: { updateProfile: any }) {
  const [age, setAge] = useState('');
  const [exp, setExp] = useState<UserLevel>('Beginner');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ age: parseInt(age), level: exp });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#141415] border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Alpha Quant</h2>
        <p className="text-sm text-gray-400 mb-6">Let's set up your profile to tailor the experience.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
            <input type="number" required value={age} onChange={e => setAge(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]" placeholder="e.g. 25" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Trading Experience</label>
            <select value={exp} onChange={e => setExp(e.target.value as UserLevel)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#a855f7]">
              <option value="Beginner">Beginner (Just starting)</option>
              <option value="Intermediate">Intermediate (Some experience)</option>
              <option value="Advanced">Advanced (Pro / Quant)</option>
            </select>
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg font-medium transition-colors">Start Building</button>
        </form>
      </div>
    </div>
  );
}
"""

if "useProfile" not in applayout:
    applayout = applayout.replace('import { useEffect, useState } from "react";', 'import { useEffect, useState } from "react";\n' + impl_hook)

# Filter NAV_ITEMS mapping
nav_mapping_old = """          <nav className="flex flex-col gap-3 w-full px-3 flex-1 overflow-hidden">
            {NAV_ITEMS.map((item) => {"""

nav_mapping_new = """          <nav className="flex flex-col gap-3 w-full px-3 flex-1 overflow-hidden">
            {NAV_ITEMS.filter((item) => {
                if (!profile.level) return true;
                if (profile.level === 'Beginner') {
                    return !['/sandbox', '/playground', '/strategy-builder'].includes(item.path);
                }
                if (profile.level === 'Intermediate') {
                    return !['/sandbox', '/playground'].includes(item.path);
                }
                return true; // Advanced gets everything
            }).map((item) => {"""

applayout = applayout.replace(nav_mapping_old, nav_mapping_new)

# Inject hook call inside AppLayout component
hook_call = "  const location = useLocation();\n  const { profile, updateProfile, showGamificationToast } = useProfile();\n"
applayout = applayout.replace("  const location = useLocation();", hook_call)

# Inject Profile Setup Modal & Gamification Toast into return
modal_inject = """
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-primary">
      {!profile.level && <ProfileSetupModal updateProfile={updateProfile} />}
      {showGamificationToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#141415] border border-[#a855f7]/50 rounded-lg p-4 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-4 animate-in slide-in-from-top-10">
          <div className="bg-[#a855f7]/20 p-2 rounded-full"><ThumbsUp className="w-6 h-6 text-[#a855f7]" /></div>
          <div>
            <h4 className="text-white font-bold text-sm">{showGamificationToast.message}</h4>
            <span className="text-sm text-[#a855f7] font-bold">+{showGamificationToast.points} Points!</span>
          </div>
        </div>
      )}
"""
applayout = applayout.replace('<div className="flex h-screen w-full flex-col overflow-hidden bg-bg-primary">', modal_inject)


# Points display in sidebar
points_display = """
            <div className="flex justify-center w-full mt-2">
              <ThemeToggle />
            </div>
          </div>
"""
points_display_new = """
            <div className="flex justify-center w-full mt-2">
              <ThemeToggle />
            </div>
            
            <div className={cn("mt-4 flex rounded-lg bg-black/40 border border-white/5 p-2 items-center justify-center transition-all", isCollapsed ? "flex-col gap-1 mx-1" : "flex-row gap-3 mx-2")}>
               <Trophy className="w-4 h-4 text-yellow-500" />
               <div className={cn("text-xs font-bold text-yellow-500", isCollapsed && "text-[10px]")}>{profile.points} pts</div>
            </div>
            
          </div>
"""
applayout = applayout.replace(points_display, points_display_new)


with open(applayout_path, 'w') as f:
    f.write(applayout)

print("Patched AppLayout.tsx and created useProfile.ts")
