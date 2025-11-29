export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;

  // Tracking
  frequency: 'daily' | 'weekly' | 'specific-days';
  targetDays?: number[];
  targetCount?: number;

  // Category
  category: 'wellness' | 'productivity' | 'social' | 'health' | 'custom';
  isPrebuilt: boolean;

  // Gamification
  pointsPerCompletion: number;

  // Meta
  active: boolean;
  createdAt: string;
  order: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  count?: number;
  notes?: string;
  completedAt?: string;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

export type HabitFrequency = 'daily' | 'weekly' | 'specific-days';
export type HabitCategory = 'wellness' | 'productivity' | 'social' | 'health' | 'custom';
