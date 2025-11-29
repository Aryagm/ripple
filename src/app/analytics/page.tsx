'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useHabitStore } from '@/store/habit-store';
import { useMoodStore } from '@/store/mood-store';
import { useSleepStore } from '@/store/sleep-store';
import { useGamificationStore } from '@/store/gamification-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  Moon,
  Brain,
  CheckSquare,
  Trophy,
  Sparkles,
} from 'lucide-react';

function AnalyticsSkeleton() {
  return (
    <div className="py-6 space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

const chartConfig = {
  mood: { label: 'Mood', color: 'hsl(var(--chart-1))' },
  sleep: { label: 'Sleep', color: 'hsl(var(--chart-2))' },
  habits: { label: 'Habits', color: 'hsl(var(--chart-3))' },
  stress: { label: 'Stress', color: 'hsl(var(--chart-4))' },
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const user = useUserStore((state) => state.user);
  const { habits, logs, getActiveHabits } = useHabitStore();
  const { entries: moodEntries, getAverageMood, getAverageStress } = useMoodStore();
  const { entries: sleepEntries, getSleepStats } = useSleepStore();
  const { totalPoints, level, currentOverallStreak, weeklyPoints, getProgress } = useGamificationStore();

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
      <AppShell title="Analytics">
        <AnalyticsSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  const activeHabits = getActiveHabits();
  const sleepStats = getSleepStats();
  const progress = getProgress();

  // Generate last 7 days of data
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const weeklyData = last7Days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayLabel = format(day, 'EEE');

    // Mood for this day
    const mood = moodEntries.find((e) => e.date === dateStr);

    // Sleep for this day
    const sleep = sleepEntries.find((e) => e.date === dateStr);

    // Habits completed for this day
    const dayLogs = logs.filter((l) => l.date === dateStr && l.completed);
    const habitCompletion = activeHabits.length > 0
      ? (dayLogs.length / activeHabits.length) * 100
      : 0;

    return {
      day: dayLabel,
      date: dateStr,
      mood: mood?.moodScore || null,
      stress: mood?.stressLevel || null,
      sleep: sleep ? Math.round(sleep.totalSleepMinutes / 60 * 10) / 10 : null,
      habits: Math.round(habitCompletion),
    };
  });

  // Calculate completion rates
  const habitCompletionRate = weeklyData.reduce((acc, d) => acc + (d.habits || 0), 0) / 7;
  const moodLoggingRate = (weeklyData.filter((d) => d.mood !== null).length / 7) * 100;
  const sleepLoggingRate = (weeklyData.filter((d) => d.sleep !== null).length / 7) * 100;

  // Goal progress
  const completedGoals = user.goals?.filter((g) => g.completed).length || 0;
  const totalGoals = user.goals?.length || 0;

  return (
    <AppShell title="Analytics">
      <div className="py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{currentOverallStreak} <span className="text-sm font-normal">days</span></p>
                </div>
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{weeklyPoints} <span className="text-sm font-normal">pts</span></p>
                </div>
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold">{level}</p>
                </div>
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Level {level}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.currentXP} / {progress.xpToNext + progress.currentXP} XP
              </span>
            </div>
            <Progress value={progress.percentComplete} className="h-2" />
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Weekly Habits Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Habit Completion
                </CardTitle>
                <CardDescription>Daily completion rate this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="habits"
                        fill="hsl(var(--chart-3))"
                        radius={[4, 4, 0, 0]}
                        name="Completion %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly average</span>
                  <Badge variant={habitCompletionRate >= 70 ? 'default' : 'secondary'}>
                    {Math.round(habitCompletionRate)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Goals Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {totalGoals > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{completedGoals} of {totalGoals} completed</span>
                      <span className="font-medium">
                        {Math.round((completedGoals / totalGoals) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(completedGoals / totalGoals) * 100}
                      className="h-2"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No goals set yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mood" className="space-y-4">
            {/* Mood Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Mood Trend
                </CardTitle>
                <CardDescription>Your mood over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData.filter((d) => d.mood !== null)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[1, 10]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.2}
                        name="Mood"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Average mood</p>
                    <p className="text-lg font-bold">{getAverageMood(7) || '-'}/10</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average stress</p>
                    <p className="text-lg font-bold">{getAverageStress(7) || '-'}/10</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mood Insights */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <span>Mood logging streak</span>
                    <Badge variant="outline">{Math.round(moodLoggingRate)}% this week</Badge>
                  </div>
                  {getAverageMood(7) >= 7 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                      <p className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Your mood has been great this week! Keep it up! 🎉
                      </p>
                    </div>
                  )}
                  {getAverageStress(7) >= 7 && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                      <p className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Your stress levels are elevated. Consider taking breaks.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sleep" className="space-y-4">
            {/* Sleep Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-500" />
                  Sleep Duration
                </CardTitle>
                <CardDescription>Hours of sleep per night</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData.filter((d) => d.sleep !== null)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[4, 10]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="sleep"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Hours"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Average</p>
                    <p className="font-bold">
                      {sleepStats.averageSleepDuration
                        ? Math.round(sleepStats.averageSleepDuration / 60 * 10) / 10
                        : '-'}h
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Quality</p>
                    <p className="font-bold">{sleepStats.averageQuality || '-'}/5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Debt</p>
                    <p className="font-bold text-red-400">
                      {Math.round(sleepStats.sleepDebt / 60 * 10) / 10}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sleep Insights */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sleep Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <span>Sleep logging</span>
                    <Badge variant="outline">{Math.round(sleepLoggingRate)}% this week</Badge>
                  </div>
                  {sleepStats.weeklyTrend === 'improving' && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                      <p className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Your sleep is improving! Great job maintaining your schedule.
                      </p>
                    </div>
                  )}
                  {sleepStats.weeklyTrend === 'declining' && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                      <p className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Your sleep quality is declining. Try to go to bed earlier.
                      </p>
                    </div>
                  )}
                  {sleepStats.sleepDebt > 180 && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                      <p>
                        You have a sleep debt of {Math.round(sleepStats.sleepDebt / 60)} hours.
                        Consider catching up this weekend.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
