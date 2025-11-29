'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MoodEntry, MOOD_EMOJIS } from '@/types/mood';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, parseISO } from 'date-fns';

interface MoodStore {
  entries: MoodEntry[];

  // Actions
  addEntry: (entry: Omit<MoodEntry, 'id' | 'moodEmoji' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (entryId: string, updates: Partial<MoodEntry>) => void;
  deleteEntry: (entryId: string) => void;

  // Getters
  getTodayEntry: () => MoodEntry | undefined;
  getEntriesForDateRange: (startDate: string, endDate: string) => MoodEntry[];
  getWeekEntries: () => MoodEntry[];
  getAverageMood: (days: number) => number;
  getAverageStress: (days: number) => number;
  getMoodStreak: () => number;
}

export const useMoodStore = create<MoodStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entryData) => {
        const moodEmoji = MOOD_EMOJIS[entryData.moodScore as keyof typeof MOOD_EMOJIS] || '😐';
        const now = new Date().toISOString();

        const newEntry: MoodEntry = {
          ...entryData,
          id: uuidv4(),
          moodEmoji,
          createdAt: now,
          updatedAt: now,
        };

        // Replace existing entry for today if exists
        const today = format(new Date(), 'yyyy-MM-dd');
        set((state) => ({
          entries: [
            ...state.entries.filter((e) => e.date !== today),
            newEntry,
          ],
        }));
      },

      updateEntry: (entryId, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  ...updates,
                  moodEmoji: updates.moodScore
                    ? MOOD_EMOJIS[updates.moodScore as keyof typeof MOOD_EMOJIS]
                    : e.moodEmoji,
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        }));
      },

      deleteEntry: (entryId) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== entryId),
        }));
      },

      getTodayEntry: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().entries.find((e) => e.date === today);
      },

      getEntriesForDateRange: (startDate, endDate) => {
        return get()
          .entries.filter((e) => e.date >= startDate && e.date <= endDate)
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      getWeekEntries: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        return get().getEntriesForDateRange(weekAgo, today);
      },

      getAverageMood: (days) => {
        const today = new Date();
        const startDate = format(subDays(today, days), 'yyyy-MM-dd');
        const endDate = format(today, 'yyyy-MM-dd');
        const entries = get().getEntriesForDateRange(startDate, endDate);

        if (entries.length === 0) return 0;

        const sum = entries.reduce((acc, e) => acc + e.moodScore, 0);
        return Math.round((sum / entries.length) * 10) / 10;
      },

      getAverageStress: (days) => {
        const today = new Date();
        const startDate = format(subDays(today, days), 'yyyy-MM-dd');
        const endDate = format(today, 'yyyy-MM-dd');
        const entries = get().getEntriesForDateRange(startDate, endDate);

        if (entries.length === 0) return 0;

        const sum = entries.reduce((acc, e) => acc + e.stressLevel, 0);
        return Math.round((sum / entries.length) * 10) / 10;
      },

      getMoodStreak: () => {
        const entries = get()
          .entries.sort((a, b) => b.date.localeCompare(a.date));

        if (entries.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();

        for (const entry of entries) {
          const entryDate = parseISO(entry.date);
          const diff = Math.floor(
            (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diff === 0 || diff === 1) {
            streak++;
            currentDate = entryDate;
          } else {
            break;
          }
        }

        return streak;
      },
    }),
    {
      name: 'ripple_mood_entries',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
