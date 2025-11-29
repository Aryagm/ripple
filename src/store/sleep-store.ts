'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SleepEntry, SleepStats } from '@/types/sleep';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, parseISO, differenceInMinutes } from 'date-fns';

interface SleepStore {
  entries: SleepEntry[];
  targetSleepHours: number;

  // Actions
  addEntry: (entry: Omit<SleepEntry, 'id' | 'totalSleepMinutes' | 'createdAt'>) => void;
  updateEntry: (entryId: string, updates: Partial<SleepEntry>) => void;
  deleteEntry: (entryId: string) => void;
  setTargetSleepHours: (hours: number) => void;

  // Getters
  getLastEntry: () => SleepEntry | undefined;
  getEntryForDate: (date: string) => SleepEntry | undefined;
  getEntriesForDateRange: (startDate: string, endDate: string) => SleepEntry[];
  getWeekEntries: () => SleepEntry[];
  getSleepStats: () => SleepStats;
  getSleepDebt: () => number;
  getSleepStreak: () => number;
}

const calculateSleepMinutes = (bedTime: string, wakeTime: string): number => {
  const bed = parseISO(bedTime);
  const wake = parseISO(wakeTime);
  return differenceInMinutes(wake, bed);
};

export const useSleepStore = create<SleepStore>()(
  persist(
    (set, get) => ({
      entries: [],
      targetSleepHours: 8,

      addEntry: (entryData) => {
        const totalSleepMinutes = calculateSleepMinutes(
          entryData.bedTime,
          entryData.wakeTime
        );

        const newEntry: SleepEntry = {
          ...entryData,
          id: uuidv4(),
          totalSleepMinutes,
          createdAt: new Date().toISOString(),
        };

        // Replace existing entry for date if exists
        set((state) => ({
          entries: [
            ...state.entries.filter((e) => e.date !== entryData.date),
            newEntry,
          ],
        }));
      },

      updateEntry: (entryId, updates) => {
        set((state) => ({
          entries: state.entries.map((e) => {
            if (e.id !== entryId) return e;

            const newEntry = { ...e, ...updates };
            if (updates.bedTime || updates.wakeTime) {
              newEntry.totalSleepMinutes = calculateSleepMinutes(
                updates.bedTime || e.bedTime,
                updates.wakeTime || e.wakeTime
              );
            }
            return newEntry;
          }),
        }));
      },

      deleteEntry: (entryId) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== entryId),
        }));
      },

      setTargetSleepHours: (hours) => {
        set({ targetSleepHours: hours });
      },

      getLastEntry: () => {
        const entries = get()
          .entries.sort((a, b) => b.date.localeCompare(a.date));
        return entries[0];
      },

      getEntryForDate: (date) => {
        return get().entries.find((e) => e.date === date);
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

      getSleepStats: () => {
        const entries = get().getWeekEntries();
        const targetMinutes = get().targetSleepHours * 60;

        if (entries.length === 0) {
          return {
            averageSleepDuration: 0,
            averageQuality: 0,
            sleepDebt: 0,
            targetSleepMinutes: targetMinutes,
            weeklyTrend: 'stable' as const,
          };
        }

        const avgDuration =
          entries.reduce((acc, e) => acc + e.totalSleepMinutes, 0) / entries.length;
        const avgQuality =
          entries.reduce((acc, e) => acc + e.qualityRating, 0) / entries.length;

        const sleepDebt = entries.reduce((acc, e) => {
          const diff = targetMinutes - e.totalSleepMinutes;
          return acc + (diff > 0 ? diff : 0);
        }, 0);

        // Calculate trend (compare first half to second half of week)
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (entries.length >= 4) {
          const mid = Math.floor(entries.length / 2);
          const firstHalf = entries.slice(0, mid);
          const secondHalf = entries.slice(mid);

          const firstAvg =
            firstHalf.reduce((acc, e) => acc + e.totalSleepMinutes, 0) / firstHalf.length;
          const secondAvg =
            secondHalf.reduce((acc, e) => acc + e.totalSleepMinutes, 0) / secondHalf.length;

          if (secondAvg > firstAvg + 15) trend = 'improving';
          else if (secondAvg < firstAvg - 15) trend = 'declining';
        }

        return {
          averageSleepDuration: Math.round(avgDuration),
          averageQuality: Math.round(avgQuality * 10) / 10,
          sleepDebt: Math.round(sleepDebt),
          targetSleepMinutes: targetMinutes,
          weeklyTrend: trend,
        };
      },

      getSleepDebt: () => {
        return get().getSleepStats().sleepDebt;
      },

      getSleepStreak: () => {
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
      name: 'ripple_sleep_entries',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
