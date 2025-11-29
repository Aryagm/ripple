'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Habit, HabitLog, HabitStreak } from '@/types/habit';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';

interface HabitStore {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Record<string, HabitStreak>;

  // Actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  toggleHabitActive: (habitId: string) => void;
  reorderHabits: (startIndex: number, endIndex: number) => void;

  // Logging
  toggleHabitCompletion: (habitId: string, date: string) => void;
  incrementHabitCount: (habitId: string, date: string) => void;
  decrementHabitCount: (habitId: string, date: string) => void;

  // Getters
  getActiveHabits: () => Habit[];
  getTodayLogs: () => HabitLog[];
  getLogsForDate: (date: string) => HabitLog[];
  getHabitStreak: (habitId: string) => number;
  isHabitCompletedToday: (habitId: string) => boolean;
}

const calculateStreak = (logs: HabitLog[], habitId: string): number => {
  const habitLogs = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (habitLogs.length === 0) return 0;

  let streak = 0;
  let currentDate = startOfDay(new Date());

  for (const log of habitLogs) {
    const logDate = startOfDay(parseISO(log.date));
    const diff = differenceInDays(currentDate, logDate);

    if (diff === 0 || diff === 1) {
      streak++;
      currentDate = logDate;
    } else {
      break;
    }
  }

  return streak;
};

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      streaks: {},

      addHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          order: get().habits.length,
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      updateHabit: (habitId, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, ...updates } : h
          ),
        }));
      },

      deleteHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
          logs: state.logs.filter((l) => l.habitId !== habitId),
        }));
      },

      toggleHabitActive: (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, active: !h.active } : h
          ),
        }));
      },

      reorderHabits: (startIndex, endIndex) => {
        set((state) => {
          const result = Array.from(state.habits);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return {
            habits: result.map((h, i) => ({ ...h, order: i })),
          };
        });
      },

      toggleHabitCompletion: (habitId, date) => {
        const existingLog = get().logs.find(
          (l) => l.habitId === habitId && l.date === date
        );

        if (existingLog) {
          set((state) => ({
            logs: state.logs.map((l) =>
              l.id === existingLog.id
                ? { ...l, completed: !l.completed, completedAt: !l.completed ? new Date().toISOString() : undefined }
                : l
            ),
          }));
        } else {
          const newLog: HabitLog = {
            id: uuidv4(),
            habitId,
            date,
            completed: true,
            completedAt: new Date().toISOString(),
          };
          set((state) => ({ logs: [...state.logs, newLog] }));
        }

        // Update streak
        const streak = calculateStreak(get().logs, habitId);
        const currentStreakData = get().streaks[habitId];
        set((state) => ({
          streaks: {
            ...state.streaks,
            [habitId]: {
              habitId,
              currentStreak: streak,
              longestStreak: Math.max(streak, currentStreakData?.longestStreak || 0),
              lastCompletedDate: date,
            },
          },
        }));
      },

      incrementHabitCount: (habitId, date) => {
        const existingLog = get().logs.find(
          (l) => l.habitId === habitId && l.date === date
        );
        const habit = get().habits.find((h) => h.id === habitId);

        if (existingLog) {
          const newCount = (existingLog.count || 0) + 1;
          const isCompleted = habit?.targetCount ? newCount >= habit.targetCount : true;

          set((state) => ({
            logs: state.logs.map((l) =>
              l.id === existingLog.id
                ? { ...l, count: newCount, completed: isCompleted }
                : l
            ),
          }));
        } else {
          const isCompleted = habit?.targetCount ? 1 >= habit.targetCount : true;
          const newLog: HabitLog = {
            id: uuidv4(),
            habitId,
            date,
            completed: isCompleted,
            count: 1,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
          };
          set((state) => ({ logs: [...state.logs, newLog] }));
        }
      },

      decrementHabitCount: (habitId, date) => {
        const existingLog = get().logs.find(
          (l) => l.habitId === habitId && l.date === date
        );
        const habit = get().habits.find((h) => h.id === habitId);

        if (existingLog && (existingLog.count || 0) > 0) {
          const newCount = (existingLog.count || 0) - 1;
          const isCompleted = habit?.targetCount ? newCount >= habit.targetCount : newCount > 0;

          set((state) => ({
            logs: state.logs.map((l) =>
              l.id === existingLog.id
                ? { ...l, count: newCount, completed: isCompleted }
                : l
            ),
          }));
        }
      },

      getActiveHabits: () => {
        return get().habits.filter((h) => h.active).sort((a, b) => a.order - b.order);
      },

      getTodayLogs: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().logs.filter((l) => l.date === today);
      },

      getLogsForDate: (date) => {
        return get().logs.filter((l) => l.date === date);
      },

      getHabitStreak: (habitId) => {
        return get().streaks[habitId]?.currentStreak || 0;
      },

      isHabitCompletedToday: (habitId) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const log = get().logs.find(
          (l) => l.habitId === habitId && l.date === today
        );
        return log?.completed || false;
      },
    }),
    {
      name: 'ripple_habits',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
