export interface SleepEntry {
  id: string;
  date: string;

  // Times
  bedTime: string;
  wakeTime: string;

  // Calculated
  totalSleepMinutes: number;

  // Quality
  qualityRating: 1 | 2 | 3 | 4 | 5;

  // Factors
  factors?: {
    caffeine?: boolean;
    exercise?: boolean;
    screens?: boolean;
    stress?: boolean;
    alcohol?: boolean;
  };

  notes?: string;

  createdAt: string;
}

export interface SleepStats {
  averageSleepDuration: number;
  averageQuality: number;
  sleepDebt: number;
  targetSleepMinutes: number;
  weeklyTrend: 'improving' | 'declining' | 'stable';
}

export type SleepQuality = 1 | 2 | 3 | 4 | 5;

export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
};
