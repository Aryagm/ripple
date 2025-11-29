export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;

  // Timing
  start: Date;
  end: Date;
  allDay: boolean;

  // Categorization
  type: EventType;
  color: string;

  // Recurrence
  recurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    endDate?: string;
  };

  // AI scheduling
  suggestedByAI: boolean;
  energyLevel?: 'low' | 'medium' | 'high';

  // Status
  completed: boolean;
  skipped: boolean;
  rescheduledFrom?: string;

  // Link to source
  classId?: string;
  habitId?: string;

  createdAt: string;
  updatedAt: string;
}

export type EventType = 'class' | 'study' | 'habit' | 'personal' | 'social' | 'work';

export const EVENT_COLORS: Record<EventType, string> = {
  class: '#3b82f6',     // blue
  study: '#22c55e',     // green
  habit: '#a855f7',     // purple
  personal: '#f59e0b',  // amber
  social: '#ec4899',    // pink
  work: '#6366f1',      // indigo
};

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';
export type EnergyRequirement = 'low' | 'medium' | 'high';
