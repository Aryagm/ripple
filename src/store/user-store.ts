'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, ClassSchedule, UserGoal } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';

interface UserStore {
  user: UserProfile | null;

  // Actions
  setUser: (user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  addClass: (classData: Omit<ClassSchedule, 'id'>) => void;
  removeClass: (classId: string) => void;
  updateClass: (classId: string, updates: Partial<ClassSchedule>) => void;
  addGoal: (goal: Omit<UserGoal, 'id' | 'completed'>) => void;
  removeGoal: (goalId: string) => void;
  toggleGoalComplete: (goalId: string) => void;
  resetUser: () => void;
}

const initialUser: UserProfile = {
  id: '',
  name: '',
  major: '',
  yearInSchool: 'freshman',
  preferredBedtime: '23:00',
  preferredWakeTime: '07:00',
  classes: [],
  goals: [],
  energyPattern: {
    morningEnergy: 3,
    afternoonEnergy: 3,
    eveningEnergy: 3,
    peakProductivityTime: 'morning',
  },
  currentChallenges: [],
  onboardingCompleted: false,
  createdAt: '',
  updatedAt: '',
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      completeOnboarding: () => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            onboardingCompleted: true,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      addClass: (classData) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const newClass: ClassSchedule = {
          ...classData,
          id: uuidv4(),
        };

        set({
          user: {
            ...currentUser,
            classes: [...currentUser.classes, newClass],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      removeClass: (classId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            classes: currentUser.classes.filter((c) => c.id !== classId),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateClass: (classId, updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            classes: currentUser.classes.map((c) =>
              c.id === classId ? { ...c, ...updates } : c
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      addGoal: (goal) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const newGoal: UserGoal = {
          ...goal,
          id: uuidv4(),
          completed: false,
        };

        set({
          user: {
            ...currentUser,
            goals: [...currentUser.goals, newGoal],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      removeGoal: (goalId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            goals: currentUser.goals.filter((g) => g.id !== goalId),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      toggleGoalComplete: (goalId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            goals: currentUser.goals.map((g) =>
              g.id === goalId ? { ...g, completed: !g.completed } : g
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      resetUser: () => set({ user: null }),
    }),
    {
      name: 'ripple_user_profile',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
