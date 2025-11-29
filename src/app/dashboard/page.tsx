'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useHabitStore } from '@/store/habit-store';
import { useMoodStore } from '@/store/mood-store';
import { useSleepStore } from '@/store/sleep-store';
import { useEventStore } from '@/store/event-store';
import { useGamificationStore } from '@/store/gamification-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  CheckSquare,
  Moon,
  Brain,
  Flame,
  ChevronRight,
  Sparkles,
  Calendar,
  Bot,
} from 'lucide-react';

function DashboardSkeleton() {
  return (
    <div className="py-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const user = useUserStore((state) => state.user);
  const { getActiveHabits, getTodayLogs } = useHabitStore();
  const { getTodayEntry } = useMoodStore();
  const { getLastEntry } = useSleepStore();
  const { getUpcomingEvents } = useEventStore();
  const { currentOverallStreak, weeklyChallenge } = useGamificationStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, user, router]);

  if (!mounted) {
    return (
      <AppShell>
        <DashboardSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) {
    return null;
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = getActiveHabits();
  const todayLogs = getTodayLogs();
  const completedHabits = todayLogs.filter((l) => l.completed).length;
  const todayMood = getTodayEntry();
  const lastSleep = getLastEntry();
  const upcomingEvents = getUpcomingEvents(3);

  const habitProgress = activeHabits.length > 0
    ? (completedHabits / activeHabits.length) * 100
    : 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppShell>
      <div className="py-6 space-y-8">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-semibold">{currentOverallStreak}</div>
              <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Moon className="h-5 w-5 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-semibold">
                {lastSleep ? Math.round(lastSleep.totalSleepMinutes / 60 * 10) / 10 : '-'}
                <span className="text-sm font-normal">h</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Last Sleep</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-5 w-5 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-semibold">
                {todayMood ? todayMood.moodEmoji : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Mood Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Habits Progress */}
            <Link href="/habits" className="block">
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CheckSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Today's Habits</CardTitle>
                        <CardDescription className="text-xs">
                          {completedHabits} of {activeHabits.length} completed
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <Progress value={habitProgress} className="h-2 flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{Math.round(habitProgress)}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              {!todayMood && (
                <Link href="/mental-health" className="block">
                  <Card className="hover:border-purple-500/50 transition-colors h-full">
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-full min-h-[120px]">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium text-center">Log Mood</span>
                    </CardContent>
                  </Card>
                </Link>
              )}
              {(!getLastEntry() || getLastEntry()?.date !== today) && (
                <Link href="/sleep" className="block">
                  <Card className="hover:border-blue-500/50 transition-colors h-full">
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-full min-h-[120px]">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Moon className="h-5 w-5 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-center">Log Sleep</span>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* AI Coach CTA */}
            <Link href="/coach" className="block">
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">Talk to Ripple AI</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      Get personalized advice and schedule help
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Coming Up</CardTitle>
                  </div>
                  <Link href="/calendar">
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div
                          className="w-1 h-12 rounded-full shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start), 'h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No upcoming events
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Weekly Challenge */}
            {weeklyChallenge && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Weekly Challenge</CardTitle>
                      <CardDescription className="text-xs">{weeklyChallenge.title}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {weeklyChallenge.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={(weeklyChallenge.currentValue / weeklyChallenge.targetValue) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {weeklyChallenge.currentValue}/{weeklyChallenge.targetValue}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    +{weeklyChallenge.reward} pts
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
