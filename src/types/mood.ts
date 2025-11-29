export interface MoodEntry {
  id: string;
  date: string;

  // Mood (1-10 scale)
  moodScore: number;
  moodEmoji: string;

  // Stress (1-10)
  stressLevel: number;

  // Optional details
  energyLevel?: number;
  anxietyLevel?: number;

  // Context
  factors?: string[];

  // Journal
  journalEntry?: string;

  // AI
  aiInsight?: string;

  createdAt: string;
  updatedAt: string;
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😕',
  4: '😐',
  5: '🙂',
  6: '😊',
  7: '😄',
  8: '😁',
  9: '🤩',
  10: '🥳',
};

export const MOOD_FACTORS = [
  'work',
  'sleep',
  'exercise',
  'social',
  'weather',
  'health',
  'family',
  'finances',
  'relationships',
  'academics',
] as const;

export type MoodFactor = typeof MOOD_FACTORS[number];
