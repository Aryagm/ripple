export const CHALLENGE_OPTIONS = [
  { id: 'procrastination', label: 'Procrastination', icon: 'Clock' },
  { id: 'sleep', label: 'Sleep Issues', icon: 'Moon' },
  { id: 'stress', label: 'Stress Management', icon: 'AlertCircle' },
  { id: 'focus', label: 'Staying Focused', icon: 'Target' },
  { id: 'motivation', label: 'Motivation', icon: 'Flame' },
  { id: 'time-management', label: 'Time Management', icon: 'Calendar' },
  { id: 'anxiety', label: 'Anxiety', icon: 'Brain' },
  { id: 'exercise', label: 'Regular Exercise', icon: 'Dumbbell' },
  { id: 'eating', label: 'Healthy Eating', icon: 'Apple' },
  { id: 'social', label: 'Social Connections', icon: 'Users' },
  { id: 'work-life', label: 'Work-Life Balance', icon: 'Scale' },
  { id: 'screen-time', label: 'Screen Time', icon: 'Smartphone' },
];

export const GOAL_CATEGORIES = [
  { id: 'academic', label: 'Academic', icon: 'GraduationCap', color: '#3B82F6' },
  { id: 'health', label: 'Health', icon: 'Heart', color: '#EF4444' },
  { id: 'social', label: 'Social', icon: 'Users', color: '#EC4899' },
  { id: 'career', label: 'Career', icon: 'Briefcase', color: '#8B5CF6' },
  { id: 'personal', label: 'Personal', icon: 'Star', color: '#F59E0B' },
] as const;

export const ENERGY_DESCRIPTIONS = {
  1: 'Very Low - Hard to get out of bed',
  2: 'Low - Need coffee to function',
  3: 'Moderate - Can manage tasks',
  4: 'High - Feeling productive',
  5: 'Very High - Peak performance',
} as const;

export const PEAK_TIME_OPTIONS = [
  { id: 'early-morning', label: 'Early Morning (5-8 AM)', icon: 'Sunrise' },
  { id: 'morning', label: 'Morning (8-12 PM)', icon: 'Sun' },
  { id: 'afternoon', label: 'Afternoon (12-5 PM)', icon: 'SunMedium' },
  { id: 'evening', label: 'Evening (5-9 PM)', icon: 'Sunset' },
  { id: 'night', label: 'Night (9 PM+)', icon: 'Moon' },
] as const;
