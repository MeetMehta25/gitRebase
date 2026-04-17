import { useState, useEffect } from 'react';

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
