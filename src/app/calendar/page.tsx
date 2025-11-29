'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useEventStore } from '@/store/event-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, setHours, setMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Trash2,
} from 'lucide-react';
import { CalendarEvent, EventType, EVENT_COLORS } from '@/types/event';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'class', label: 'Class', color: EVENT_COLORS.class },
  { value: 'study', label: 'Study', color: EVENT_COLORS.study },
  { value: 'habit', label: 'Habit', color: EVENT_COLORS.habit },
  { value: 'personal', label: 'Personal', color: EVENT_COLORS.personal },
  { value: 'social', label: 'Social', color: EVENT_COLORS.social },
  { value: 'work', label: 'Work', color: EVENT_COLORS.work },
];

export default function CalendarPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month' | 'day'>(Views.WEEK as 'week');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const user = useUserStore((state) => state.user);
  const { events, addEvent, updateEvent, deleteEvent, toggleEventComplete, syncClassesFromUser, classEventsGenerated } = useEventStore();

  // Form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'personal' as EventType,
    start: new Date(),
    end: addHours(new Date(), 1),
    allDay: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, user, router]);

  // Sync classes to calendar on mount
  useEffect(() => {
    if (user?.classes && user.classes.length > 0 && !classEventsGenerated) {
      syncClassesFromUser(user.classes);
    }
  }, [user?.classes, classEventsGenerated, syncClassesFromUser]);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setEventForm({
      title: '',
      description: '',
      type: 'personal',
      start,
      end,
      allDay: false,
    });
    setSelectedEvent(null);
    setIsEditing(false);
    setShowEventDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      type: event.type,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay,
    });
    setIsEditing(true);
    setShowEventDialog(true);
  }, []);

  const handleSaveEvent = () => {
    if (!eventForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (isEditing && selectedEvent) {
      updateEvent(selectedEvent.id, {
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type,
        color: EVENT_COLORS[eventForm.type],
        start: eventForm.start,
        end: eventForm.end,
        allDay: eventForm.allDay,
      });
      toast.success('Event updated!');
    } else {
      addEvent({
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type,
        color: EVENT_COLORS[eventForm.type],
        start: eventForm.start,
        end: eventForm.end,
        allDay: eventForm.allDay,
        recurring: false,
        suggestedByAI: false,
      });
      toast.success('Event created!');
    }

    setShowEventDialog(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      toast.success('Event deleted');
      setShowEventDialog(false);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color || EVENT_COLORS[event.type] || '#3b82f6',
        borderRadius: '4px',
        opacity: event.completed || event.skipped ? 0.5 : 1,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  // Convert events to calendar format (with Date objects)
  const calendarEvents = useMemo(() =>
    events
      .filter((e) => !e.skipped)
      .map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    [events]
  );

  if (!mounted) {
    return (
      <AppShell title="Calendar">
        <CalendarSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  return (
    <AppShell title="Calendar">
      <div className="py-6 space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === 'week') newDate.setDate(newDate.getDate() - 7);
                else if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
                else newDate.setDate(newDate.getDate() - 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === 'week') newDate.setDate(newDate.getDate() + 7);
                else if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
                else newDate.setDate(newDate.getDate() + 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="font-semibold text-sm">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </h2>

          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(v: 'week' | 'month' | 'day') => setView(v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => {
                const now = new Date();
                setEventForm({
                  title: '',
                  description: '',
                  type: 'personal',
                  start: setMinutes(setHours(now, now.getHours() + 1), 0),
                  end: setMinutes(setHours(now, now.getHours() + 2), 0),
                  allDay: false,
                });
                setSelectedEvent(null);
                setIsEditing(false);
                setShowEventDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[calc(100vh-16rem)] min-h-[500px] calendar-dark">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={(v) => setView(v as 'week' | 'month' | 'day')}
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                eventPropGetter={eventStyleGetter}
                step={30}
                timeslots={2}
                defaultView={Views.WEEK}
                min={new Date(2024, 0, 1, 6, 0, 0)}
                max={new Date(2024, 0, 1, 23, 0, 0)}
                formats={{
                  timeGutterFormat: (date) => format(date, 'h a'),
                  eventTimeRangeFormat: ({ start, end }) =>
                    `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Type Legend */}
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => (
            <Badge
              key={type.value}
              variant="outline"
              className="gap-1"
              style={{ borderColor: type.color }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
              {type.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Event' : 'New Event'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update event details' : 'Add a new event to your calendar'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={eventForm.type}
                onValueChange={(value: EventType) =>
                  setEventForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={eventForm.allDay}
                onCheckedChange={(checked) =>
                  setEventForm((prev) => ({ ...prev, allDay: checked }))
                }
              />
              <Label>All day event</Label>
            </div>

            {!eventForm.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="datetime-local"
                    value={format(eventForm.start, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        start: new Date(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    type="datetime-local"
                    value={format(eventForm.end, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        end: new Date(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Add notes..."
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              {isEditing && (
                <Button variant="destructive" onClick={handleDeleteEvent}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              <Button className="flex-1" onClick={handleSaveEvent}>
                {isEditing ? 'Update' : 'Create'} Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom styles for dark mode calendar */}
      <style jsx global>{`
        .calendar-dark .rbc-calendar {
          background: transparent;
        }
        .calendar-dark .rbc-toolbar {
          display: none;
        }
        .calendar-dark .rbc-header {
          padding: 8px 4px;
          font-weight: 500;
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          border-bottom: 1px solid hsl(var(--border));
        }
        .calendar-dark .rbc-time-view,
        .calendar-dark .rbc-month-view {
          border: none;
        }
        .calendar-dark .rbc-time-header {
          border-bottom: 1px solid hsl(var(--border));
        }
        .calendar-dark .rbc-time-content {
          border-top: none;
        }
        .calendar-dark .rbc-timeslot-group {
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }
        .calendar-dark .rbc-time-slot {
          border-top: none;
        }
        .calendar-dark .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid hsl(var(--border) / 0.3);
        }
        .calendar-dark .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: none;
        }
        .calendar-dark .rbc-label {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          padding: 0 8px;
        }
        .calendar-dark .rbc-day-bg {
          background: transparent;
        }
        .calendar-dark .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid hsl(var(--border) / 0.5);
        }
        .calendar-dark .rbc-today {
          background: hsl(var(--primary) / 0.1);
        }
        .calendar-dark .rbc-off-range-bg {
          background: hsl(var(--muted) / 0.3);
        }
        .calendar-dark .rbc-event {
          padding: 2px 4px;
          font-size: 11px;
        }
        .calendar-dark .rbc-event-label {
          display: none;
        }
        .calendar-dark .rbc-event-content {
          font-size: 11px;
        }
        .calendar-dark .rbc-current-time-indicator {
          background-color: hsl(var(--primary));
          height: 2px;
        }
        .calendar-dark .rbc-date-cell {
          padding: 4px 8px;
          text-align: right;
          font-size: 12px;
          color: hsl(var(--foreground));
        }
        .calendar-dark .rbc-date-cell.rbc-now {
          font-weight: bold;
          color: hsl(var(--primary));
        }
        .calendar-dark .rbc-month-row {
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }
        .calendar-dark .rbc-month-row + .rbc-month-row {
          border-top: none;
        }
      `}</style>
    </AppShell>
  );
}
