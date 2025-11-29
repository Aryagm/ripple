export interface UserProfile {
  id: string;
  name: string;
  major: string;
  yearInSchool: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';

  // Sleep preferences
  preferredBedtime: string;      // "23:00" format
  preferredWakeTime: string;     // "07:00" format

  // Class schedule
  classes: ClassSchedule[];

  // Goals
  goals: UserGoal[];

  // Energy patterns
  energyPattern: {
    morningEnergy: 1 | 2 | 3 | 4 | 5;
    afternoonEnergy: 1 | 2 | 3 | 4 | 5;
    eveningEnergy: 1 | 2 | 3 | 4 | 5;
    peakProductivityTime: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  };

  // Challenges
  currentChallenges: string[];

  // Meta
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: string;
  name: string;
  code: string;
  location: string;
  instructor?: string;
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  startTime: string;
  endTime: string;
  color: string;
}

export interface UserGoal {
  id: string;
  category: 'academic' | 'health' | 'social' | 'career' | 'personal';
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type YearInSchool = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type PeakTime = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night';
