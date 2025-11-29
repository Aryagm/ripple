export * from './user';
export * from './habit';
export * from './mood';
export * from './sleep';
export * from './event';
export * from './gamification';
export * from './chat';

export const STORAGE_KEYS = {
  USER_PROFILE: 'ripple_user_profile',
  HABITS: 'ripple_habits',
  HABIT_LOGS: 'ripple_habit_logs',
  EVENTS: 'ripple_events',
  MOOD_ENTRIES: 'ripple_mood_entries',
  SLEEP_ENTRIES: 'ripple_sleep_entries',
  GAMIFICATION: 'ripple_gamification',
  CHAT_HISTORY: 'ripple_chat_history',
  SETTINGS: 'ripple_settings',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
