'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useSleepStore } from '@/store/sleep-store';
import { useGamificationStore } from '@/store/gamification-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, subDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Sparkles,
  Coffee,
  Dumbbell,
  Smartphone,
  Wine,
  Brain,
} from 'lucide-react';
import { SLEEP_QUALITY_LABELS, SleepQuality } from '@/types/sleep';

function SleepSkeleton() {
  return (
    <div className="py-6 space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

const SLEEP_FACTORS = [
  { id: 'caffeine', label: 'Caffeine', icon: Coffee },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell },
  { id: 'screens', label: 'Screens', icon: Smartphone },
  { id: 'stress', label: 'Stress', icon: Brain },
  { id: 'alcohol', label: 'Alcohol', icon: Wine },
] as const;

export default function SleepPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const user = useUserStore((state) => state.user);
  const {
    entries,
    addEntry,
    getEntryForDate,
    getSleepStats,
    getSleepStreak,
    targetSleepHours,
    setTargetSleepHours,
  } = useSleepStore();
  const { addPoints } = useGamificationStore();

  // Form state - for logging LAST NIGHT's sleep
  const [sleepDate, setSleepDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<SleepQuality>(3);
  const [factors, setFactors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, user, router]);

  // Load user's preferred times
  useEffect(() => {
    if (user) {
      setBedTime(user.preferredBedtime || '23:00');
      setWakeTime(user.preferredWakeTime || '07:00');
    }
  }, [user]);

  if (!mounted) {
    return (
      <AppShell title="Sleep">
        <SleepSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  const stats = getSleepStats();
  const streak = getSleepStreak();
  const existingEntry = getEntryForDate(sleepDate);

  const calculateSleepHours = () => {
    const bed = parseISO(`${sleepDate}T${bedTime}`);
    let wake = parseISO(`${sleepDate}T${wakeTime}`);
    // If wake time is earlier, it's the next day
    if (wake <= bed) {
      wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
    }
    const diff = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
    return Math.round(diff * 10) / 10;
  };

  const sleepHours = calculateSleepHours();

  const handleSave = () => {
    const bed = parseISO(`${sleepDate}T${bedTime}`);
    let wake = parseISO(`${sleepDate}T${wakeTime}`);
    if (wake <= bed) {
      wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
    }

    const isNew = !existingEntry;

    addEntry({
      date: sleepDate,
      bedTime: bed.toISOString(),
      wakeTime: wake.toISOString(),
      qualityRating: quality,
      factors: Object.keys(factors).length > 0 ? factors : undefined,
    });

    if (isNew) {
      addPoints(10, 'Logged sleep');
      toast.success('+10 points!', { description: 'Sleep logged successfully' });
    } else {
      toast.success('Sleep updated!');
    }
  };

  const toggleFactor = (id: string) => {
    setFactors((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Recent entries
  const recentEntries = entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const sleepDebtHours = Math.round(stats.sleepDebt / 60 * 10) / 10;

  return (
    <AppShell title="Sleep">
      <div className="py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3 flex flex-col items-center">
              <Moon className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-lg font-bold">
                {stats.averageSleepDuration ? Math.round(stats.averageSleepDuration / 60 * 10) / 10 : '-'}h
              </span>
              <span className="text-[10px] text-muted-foreground">Avg Sleep</span>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-3 flex flex-col items-center">
              <Sun className="h-5 w-5 text-yellow-500 mb-1" />
              <span className="text-lg font-bold">
                {stats.averageQuality ? stats.averageQuality.toFixed(1) : '-'}/5
              </span>
              <span className="text-[10px] text-muted-foreground">Avg Quality</span>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br ${
            sleepDebtHours > 3 ? 'from-red-500/10 to-red-600/5 border-red-500/20' : 'from-green-500/10 to-green-600/5 border-green-500/20'
          }`}>
            <CardContent className="p-3 flex flex-col items-center">
              {sleepDebtHours > 3 ? (
                <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />
              ) : (
                <Clock className="h-5 w-5 text-green-500 mb-1" />
              )}
              <span className="text-lg font-bold">{sleepDebtHours}h</span>
              <span className="text-[10px] text-muted-foreground">Sleep Debt</span>
            </CardContent>
          </Card>
        </div>

        {/* Trend Badge */}
        {stats.weeklyTrend !== 'stable' && (
          <Badge
            variant={stats.weeklyTrend === 'improving' ? 'default' : 'destructive'}
            className="w-full justify-center py-2"
          >
            {stats.weeklyTrend === 'improving' ? (
              <TrendingUp className="h-4 w-4 mr-2" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-2" />
            )}
            Your sleep is {stats.weeklyTrend} this week
          </Badge>
        )}

        {/* Log Sleep Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log Sleep</CardTitle>
            <CardDescription>
              Record last night's sleep to track your patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selector */}
            <div className="space-y-2">
              <Label>Date (night of)</Label>
              <Input
                type="date"
                value={sleepDate}
                onChange={(e) => setSleepDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Bedtime
                </Label>
                <Input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Wake Time
                </Label>
                <Input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
            </div>

            {/* Calculated Sleep */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm">Total Sleep</span>
                <span className={`text-2xl font-bold ${
                  sleepHours < targetSleepHours - 1 ? 'text-red-500' :
                  sleepHours >= targetSleepHours ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {sleepHours}h
                </span>
              </CardContent>
            </Card>

            {/* Quality Rating */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sleep Quality</Label>
                <Badge variant="outline">{SLEEP_QUALITY_LABELS[quality]}</Badge>
              </div>
              <Slider
                value={[quality]}
                min={1}
                max={5}
                step={1}
                onValueChange={([value]) => setQuality(value as SleepQuality)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Factors */}
            <div className="space-y-3">
              <Label>Contributing Factors (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {SLEEP_FACTORS.map((factor) => {
                  const Icon = factor.icon;
                  return (
                    <div
                      key={factor.id}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        factors[factor.id] ? 'bg-primary/20 border border-primary/50' : 'bg-secondary/50 hover:bg-secondary/70'
                      }`}
                      onClick={() => toggleFactor(factor.id)}
                    >
                      <Checkbox checked={factors[factor.id] || false} />
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{factor.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <Button className="w-full" onClick={handleSave}>
              {existingEntry ? 'Update Sleep Log' : 'Save Sleep Log'}
              {!existingEntry && <Sparkles className="h-4 w-4 ml-2" />}
            </Button>
          </CardContent>
        </Card>

        {/* Recent History */}
        {recentEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Sleep</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEntries.map((entry) => {
                  const hours = Math.round(entry.totalSleepMinutes / 60 * 10) / 10;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                    >
                      <Moon className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {format(parseISO(entry.date), 'EEE, MMM d')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hours}h • Quality: {entry.qualityRating}/5
                        </p>
                      </div>
                      <Badge
                        variant={
                          hours >= targetSleepHours ? 'default' :
                          hours >= targetSleepHours - 1 ? 'secondary' : 'destructive'
                        }
                      >
                        {hours}h
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Target Sleep Setting */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Target Sleep</p>
                <p className="text-xs text-muted-foreground">Daily goal</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTargetSleepHours(Math.max(5, targetSleepHours - 0.5))}
                >
                  -
                </Button>
                <span className="w-12 text-center font-bold">{targetSleepHours}h</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTargetSleepHours(Math.min(12, targetSleepHours + 0.5))}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
