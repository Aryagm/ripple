'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CalendarEvent, EventType, EVENT_COLORS } from '@/types/event';
import { ClassSchedule, DayOfWeek } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval, addWeeks, setHours, setMinutes, getDay } from 'date-fns';

const DAY_MAP: Record<DayOfWeek, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

interface EventStore {
  events: CalendarEvent[];
  classEventsGenerated: boolean;

  // Actions
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'skipped'>) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
  toggleEventComplete: (eventId: string) => void;
  skipEvent: (eventId: string) => void;
  rescheduleEvent: (eventId: string, newStart: Date, newEnd: Date) => void;
  syncClassesFromUser: (classes: ClassSchedule[], weeksAhead?: number) => void;
  clearClassEvents: () => void;

  // Getters
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForWeek: (date: Date) => CalendarEvent[];
  getTodayEvents: () => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],
      classEventsGenerated: false,

      addEvent: (eventData) => {
        const now = new Date().toISOString();
        const newEvent: CalendarEvent = {
          ...eventData,
          id: uuidv4(),
          completed: false,
          skipped: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ events: [...state.events, newEvent] }));
      },

      updateEvent: (eventId, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, ...updates, updatedAt: new Date().toISOString() }
              : e
          ),
        }));
      },

      deleteEvent: (eventId) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== eventId),
        }));
      },

      toggleEventComplete: (eventId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, completed: !e.completed, updatedAt: new Date().toISOString() }
              : e
          ),
        }));
      },

      skipEvent: (eventId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, skipped: true, updatedAt: new Date().toISOString() }
              : e
          ),
        }));
      },

      rescheduleEvent: (eventId, newStart, newEnd) => {
        const originalEvent = get().events.find((e) => e.id === eventId);
        if (!originalEvent) return;

        // Create a new event with reference to original
        const now = new Date().toISOString();
        const rescheduledEvent: CalendarEvent = {
          ...originalEvent,
          id: uuidv4(),
          start: newStart,
          end: newEnd,
          rescheduledFrom: eventId,
          createdAt: now,
          updatedAt: now,
        };

        // Mark original as skipped
        set((state) => ({
          events: [
            ...state.events.map((e) =>
              e.id === eventId
                ? { ...e, skipped: true, updatedAt: now }
                : e
            ),
            rescheduledEvent,
          ],
        }));
      },

      syncClassesFromUser: (classes, weeksAhead = 4) => {
        // Remove existing class events first
        get().clearClassEvents();

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 0 });
        const newEvents: CalendarEvent[] = [];

        // Generate events for each class for the next N weeks
        for (let week = 0; week < weeksAhead; week++) {
          const currentWeekStart = addWeeks(weekStart, week);

          classes.forEach((cls) => {
            cls.days.forEach((day) => {
              const dayNum = DAY_MAP[day];
              const eventDate = new Date(currentWeekStart);
              eventDate.setDate(eventDate.getDate() + dayNum);

              const [startHour, startMin] = cls.startTime.split(':').map(Number);
              const [endHour, endMin] = cls.endTime.split(':').map(Number);

              const eventStart = setMinutes(setHours(eventDate, startHour), startMin);
              const eventEnd = setMinutes(setHours(eventDate, endHour), endMin);

              // Only add future events
              if (eventStart >= now) {
                newEvents.push({
                  id: uuidv4(),
                  title: cls.code ? `${cls.code}: ${cls.name}` : cls.name,
                  description: cls.location ? `Location: ${cls.location}` : undefined,
                  type: 'class' as EventType,
                  color: cls.color,
                  start: eventStart,
                  end: eventEnd,
                  allDay: false,
                  recurring: true,
                  classId: cls.id,
                  completed: false,
                  skipped: false,
                  suggestedByAI: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            });
          });
        }

        set((state) => ({
          events: [...state.events, ...newEvents],
          classEventsGenerated: true,
        }));
      },

      clearClassEvents: () => {
        set((state) => ({
          events: state.events.filter((e) => !e.classId),
          classEventsGenerated: false,
        }));
      },

      getEventsForDate: (date) => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        return get().events.filter((e) => {
          const eventStart = new Date(e.start);
          const eventEnd = new Date(e.end);
          return (
            isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
            isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
            (eventStart <= dayStart && eventEnd >= dayEnd)
          );
        });
      },

      getEventsForWeek: (date) => {
        const weekStart = startOfWeek(date, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

        return get().events.filter((e) => {
          const eventStart = new Date(e.start);
          const eventEnd = new Date(e.end);
          return (
            isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
            isWithinInterval(eventEnd, { start: weekStart, end: weekEnd })
          );
        });
      },

      getTodayEvents: () => {
        return get()
          .getEventsForDate(new Date())
          .filter((e) => !e.skipped)
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      },

      getUpcomingEvents: (limit = 5) => {
        const now = new Date();
        return get()
          .events.filter((e) => new Date(e.start) >= now && !e.skipped && !e.completed)
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'ripple_events',
      storage: createJSONStorage(() => localStorage),
      // Serialize dates properly
      partialize: (state) => ({
        events: state.events.map((e) => ({
          ...e,
          start: e.start instanceof Date ? e.start.toISOString() : e.start,
          end: e.end instanceof Date ? e.end.toISOString() : e.end,
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.events = state.events.map((e) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
          }));
        }
      },
    }
  )
);
