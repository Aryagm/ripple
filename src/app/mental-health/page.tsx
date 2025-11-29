'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useMoodStore } from '@/store/mood-store';
import { useGamificationStore } from '@/store/gamification-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Brain,
  Heart,
  Frown,
  Meh,
  Smile,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  PenLine,
  ChevronRight,
} from 'lucide-react';
import { MOOD_EMOJIS, MOOD_FACTORS, MoodFactor } from '@/types/mood';

function MoodSkeleton() {
  return (
    <div className="py-6 space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function MentalHealthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const user = useUserStore((state) => state.user);
  const { entries, addEntry, getTodayEntry, getAverageMood, getAverageStress, getMoodStreak } = useMoodStore();
  const { addPoints } = useGamificationStore();

  const [moodScore, setMoodScore] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [selectedFactors, setSelectedFactors] = useState<MoodFactor[]>([]);
  const [journalEntry, setJournalEntry] = useState('');
  const [showJournal, setShowJournal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, user, router]);

  // Load existing entry if available
  useEffect(() => {
    const todayEntry = getTodayEntry();
    if (todayEntry) {
      setMoodScore(todayEntry.moodScore);
      setStressLevel(todayEntry.stressLevel);
      setSelectedFactors((todayEntry.factors as MoodFactor[]) || []);
      setJournalEntry(todayEntry.journalEntry || '');
    }
  }, [getTodayEntry]);

  if (!mounted) {
    return (
      <AppShell title="Mental Health">
        <MoodSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = getTodayEntry();
  const avgMood = getAverageMood(7);
  const avgStress = getAverageStress(7);
  const streak = getMoodStreak();

  const handleSave = () => {
    const isNew = !todayEntry;

    addEntry({
      date: today,
      moodScore,
      stressLevel,
      factors: selectedFactors,
      journalEntry: journalEntry.trim() || undefined,
    });

    if (isNew) {
      addPoints(15, 'Logged mood');
      toast.success('+15 points!', { description: 'Mood logged successfully' });
    } else {
      toast.success('Mood updated!');
    }
  };

  const toggleFactor = (factor: MoodFactor) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const getMoodTrend = () => {
    if (entries.length < 3) return null;
    const recent = entries.slice(-3);
    const avgRecent = recent.reduce((acc, e) => acc + e.moodScore, 0) / recent.length;
    const older = entries.slice(-6, -3);
    if (older.length === 0) return null;
    const avgOlder = older.reduce((acc, e) => acc + e.moodScore, 0) / older.length;

    if (avgRecent > avgOlder + 0.5) return 'up';
    if (avgRecent < avgOlder - 0.5) return 'down';
    return 'stable';
  };

  const moodTrend = getMoodTrend();

  // Recent entries for history view
  const recentEntries = entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <AppShell title="Mental Health">
      <div className="py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-3 flex flex-col items-center">
              <span className="text-2xl">{MOOD_EMOJIS[Math.round(avgMood) as keyof typeof MOOD_EMOJIS] || '😐'}</span>
              <span className="text-lg font-bold">{avgMood || '-'}</span>
              <span className="text-[10px] text-muted-foreground">Avg Mood</span>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-3 flex flex-col items-center">
              <Heart className="h-5 w-5 text-red-500 mb-1" />
              <span className="text-lg font-bold">{avgStress || '-'}</span>
              <span className="text-[10px] text-muted-foreground">Avg Stress</span>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3 flex flex-col items-center">
              <Brain className="h-5 w-5 text-green-500 mb-1" />
              <span className="text-lg font-bold">{streak}</span>
              <span className="text-[10px] text-muted-foreground">Day Streak</span>
            </CardContent>
          </Card>
        </div>

        {/* Mood Check-in Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">How are you feeling?</CardTitle>
                <CardDescription>
                  {todayEntry ? 'Update your check-in' : 'Daily mood check-in'}
                </CardDescription>
              </div>
              {moodTrend && (
                <Badge
                  variant={moodTrend === 'up' ? 'default' : moodTrend === 'down' ? 'destructive' : 'secondary'}
                  className="gap-1"
                >
                  {moodTrend === 'up' && <TrendingUp className="h-3 w-3" />}
                  {moodTrend === 'down' && <TrendingDown className="h-3 w-3" />}
                  {moodTrend === 'stable' && <Minus className="h-3 w-3" />}
                  {moodTrend === 'up' ? 'Improving' : moodTrend === 'down' ? 'Declining' : 'Stable'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mood</Label>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{MOOD_EMOJIS[moodScore as keyof typeof MOOD_EMOJIS]}</span>
                  <span className="text-lg font-bold">{moodScore}/10</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Frown className="h-5 w-5 text-muted-foreground" />
                <Slider
                  value={[moodScore]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([value]) => setMoodScore(value)}
                  className="flex-1"
                />
                <Smile className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Stress Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Stress Level</Label>
                <span className="text-lg font-bold">{stressLevel}/10</span>
              </div>
              <div className="flex items-center gap-4">
                <Meh className="h-5 w-5 text-muted-foreground" />
                <Slider
                  value={[stressLevel]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([value]) => setStressLevel(value)}
                  className="flex-1"
                />
                <Heart className="h-5 w-5 text-red-500" />
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="space-y-3">
              <Label>What's affecting your mood? (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_FACTORS.map((factor) => (
                  <Badge
                    key={factor}
                    variant={selectedFactors.includes(factor) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleFactor(factor)}
                  >
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Journal Toggle */}
            <div>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowJournal(!showJournal)}
              >
                <span className="flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  {journalEntry ? 'Edit Journal Entry' : 'Add Journal Entry'}
                </span>
                <ChevronRight className={`h-4 w-4 transition-transform ${showJournal ? 'rotate-90' : ''}`} />
              </Button>

              {showJournal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <Textarea
                    placeholder="How are you really feeling? What's on your mind?"
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    rows={4}
                  />
                </motion.div>
              )}
            </div>

            {/* Save Button */}
            <Button className="w-full" onClick={handleSave}>
              {todayEntry ? 'Update Check-in' : 'Save Check-in'}
              {!todayEntry && <Sparkles className="h-4 w-4 ml-2" />}
            </Button>
          </CardContent>
        </Card>

        {/* Recent History */}
        {recentEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                  >
                    <span className="text-2xl">{entry.moodEmoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {format(new Date(entry.date), 'EEE, MMM d')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mood: {entry.moodScore}/10 • Stress: {entry.stressLevel}/10
                      </p>
                    </div>
                    {entry.journalEntry && (
                      <Badge variant="outline" className="text-xs">
                        <PenLine className="h-3 w-3 mr-1" />
                        Journal
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
