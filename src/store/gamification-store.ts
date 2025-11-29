'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GamificationState, WeeklyChallenge, calculateLevel, getExperienceToNextLevel } from '@/types/gamification';
import { WEEKLY_CHALLENGES } from '@/constants/achievements';
import { addDays, format, startOfWeek } from 'date-fns';

interface GamificationStore extends GamificationState {
  // Actions
  addPoints: (points: number, reason?: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateWeeklyChallenge: (progress: number) => void;
  generateWeeklyChallenge: () => void;
  updateOverallStreak: (allHabitsCompleted: boolean) => void;
  resetWeeklyPoints: () => void;

  // Getters
  hasAchievement: (achievementId: string) => boolean;
  getProgress: () => { level: number; currentXP: number; xpToNext: number; percentComplete: number };
}

const getRandomChallenge = (): WeeklyChallenge => {
  const challenge = WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)];
  const weekEnd = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 7);

  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    targetValue: challenge.targetValue,
    currentValue: 0,
    reward: challenge.reward,
    expiresAt: weekEnd.toISOString(),
  };
};

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      totalPoints: 0,
      level: 1,
      experienceToNextLevel: 100,
      unlockedAchievements: [],
      weeklyPoints: 0,
      weeklyChallenge: undefined,
      longestOverallStreak: 0,
      currentOverallStreak: 0,

      addPoints: (points) => {
        set((state) => {
          const newTotal = state.totalPoints + points;
          const newLevel = calculateLevel(newTotal);
          const xpToNext = getExperienceToNextLevel(newTotal);

          return {
            totalPoints: newTotal,
            weeklyPoints: state.weeklyPoints + points,
            level: newLevel,
            experienceToNextLevel: xpToNext,
          };
        });
      },

      unlockAchievement: (achievementId) => {
        if (get().unlockedAchievements.includes(achievementId)) return;

        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementId],
        }));
      },

      updateWeeklyChallenge: (progress) => {
        set((state) => {
          if (!state.weeklyChallenge) return state;

          const newValue = state.weeklyChallenge.currentValue + progress;
          const completed = newValue >= state.weeklyChallenge.targetValue;

          if (completed && state.weeklyChallenge.currentValue < state.weeklyChallenge.targetValue) {
            // Award points on completion
            return {
              weeklyChallenge: {
                ...state.weeklyChallenge,
                currentValue: newValue,
              },
              totalPoints: state.totalPoints + state.weeklyChallenge.reward,
              weeklyPoints: state.weeklyPoints + state.weeklyChallenge.reward,
            };
          }

          return {
            weeklyChallenge: {
              ...state.weeklyChallenge,
              currentValue: newValue,
            },
          };
        });
      },

      generateWeeklyChallenge: () => {
        set({ weeklyChallenge: getRandomChallenge() });
      },

      updateOverallStreak: (allHabitsCompleted) => {
        set((state) => {
          if (allHabitsCompleted) {
            const newStreak = state.currentOverallStreak + 1;
            return {
              currentOverallStreak: newStreak,
              longestOverallStreak: Math.max(newStreak, state.longestOverallStreak),
            };
          } else {
            return {
              currentOverallStreak: 0,
            };
          }
        });
      },

      resetWeeklyPoints: () => {
        set({ weeklyPoints: 0 });
      },

      hasAchievement: (achievementId) => {
        return get().unlockedAchievements.includes(achievementId);
      },

      getProgress: () => {
        const state = get();
        const currentLevelThreshold = state.level > 1
          ? [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000][state.level - 1] || 0
          : 0;
        const nextLevelThreshold = [100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000][state.level - 1] || 15000;
        const currentXP = state.totalPoints - currentLevelThreshold;
        const xpToNext = nextLevelThreshold - currentLevelThreshold;
        const percentComplete = Math.min((currentXP / xpToNext) * 100, 100);

        return {
          level: state.level,
          currentXP,
          xpToNext,
          percentComplete,
        };
      },
    }),
    {
      name: 'ripple_gamification',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
