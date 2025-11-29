import { CalendarEvent } from './event';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;

  // For schedule suggestions
  suggestion?: ScheduleSuggestion;

  createdAt: string;
}

export interface ScheduleSuggestion {
  type: 'reschedule' | 'add' | 'remove' | 'optimize';
  events: Partial<CalendarEvent>[];
  reasoning: string;
  accepted?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context: ChatContext;
  createdAt: string;
}

export interface ChatContext {
  currentEnergyLevel?: 'tired' | 'normal' | 'energized';
  currentMood?: number;
  todayDate: string;
}

export type EnergyState = 'tired' | 'normal' | 'energized';
export type MessageRole = 'user' | 'assistant' | 'system';
