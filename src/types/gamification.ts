export interface GamificationState {
  totalPoints: number;
  level: number;
  experienceToNextLevel: number;

  // Achievements
  unlockedAchievements: string[];

  // Weekly
  weeklyPoints: number;
  weeklyChallenge?: WeeklyChallenge;

  // Streaks
  longestOverallStreak: number;
  currentOverallStreak: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  expiresAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: {
    type: 'streak' | 'total' | 'consecutive' | 'milestone' | 'special';
    target: number;
    metric: string;
  };
  points: number;
  rarity: AchievementRarity;
  unlockedAt?: string;
}

export type AchievementCategory = 'habits' | 'sleep' | 'mood' | 'streak' | 'social' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  3500,   // Level 7
  5500,   // Level 8
  8000,   // Level 9
  11000,  // Level 10
  15000,  // Level 11+
];

export const calculateLevel = (points: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

export const getExperienceToNextLevel = (points: number): number => {
  const level = calculateLevel(points);
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  return nextThreshold - points;
};
