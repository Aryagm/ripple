'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useHabitStore } from '@/store/habit-store';
import { useMoodStore } from '@/store/mood-store';
import { useSleepStore } from '@/store/sleep-store';
import { useEventStore } from '@/store/event-store';
import { useGamificationStore } from '@/store/gamification-store';
import { useChatStore } from '@/store/chat-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  User,
  Moon,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

function SettingsSkeleton() {
  return (
    <div className="py-6 space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { user, updateUser, resetUser } = useUserStore();
  const habitStore = useHabitStore();
  const moodStore = useMoodStore();
  const sleepStore = useSleepStore();
  const eventStore = useEventStore();
  const gamificationStore = useGamificationStore();
  const chatStore = useChatStore();

  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMajor(user.major || '');
      setBedtime(user.preferredBedtime || '23:00');
      setWakeTime(user.preferredWakeTime || '07:00');
    }
  }, [user]);

  useEffect(() => {
    if (mounted && !user?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, user, router]);

  if (!mounted) {
    return (
      <AppShell title="Settings">
        <SettingsSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  const handleSaveProfile = () => {
    updateUser({
      name,
      major,
      preferredBedtime: bedtime,
      preferredWakeTime: wakeTime,
    });
    toast.success('Profile updated!');
  };

  const handleExportData = () => {
    const data = {
      user,
      habits: habitStore.habits,
      habitLogs: habitStore.logs,
      moodEntries: moodStore.entries,
      sleepEntries: sleepStore.entries,
      events: eventStore.events,
      gamification: {
        totalPoints: gamificationStore.totalPoints,
        level: gamificationStore.level,
        achievements: gamificationStore.unlockedAchievements,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ripple-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Data exported successfully!');
  };

  const handleClearAllData = () => {
    // Clear all stores
    localStorage.clear();
    resetUser();
    window.location.href = '/';
  };

  const handleResetOnboarding = () => {
    resetUser();
    router.push('/onboarding');
  };

  return (
    <AppShell title="Settings">
      <div className="py-6 space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Your major"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Sleep Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Sleep Schedule
            </CardTitle>
            <CardDescription>Your preferred sleep times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedtime">Bedtime</Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waketime">Wake Time</Label>
                <Input
                  id="waketime"
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile} variant="outline" className="w-full">
              Update Sleep Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Management</CardTitle>
            <CardDescription>Export or manage your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExportData} variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-do Onboarding
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Redo Onboarding?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your profile settings but keep your tracking data (habits, mood, sleep logs).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetOnboarding}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your data including habits, mood logs, sleep records, and achievements. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About Ripple</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Ripple is an AI-powered wellbeing companion designed for college students.
              Track your habits, monitor your mood, and optimize your schedule with the help of AI.
            </p>
            <p className="text-xs">
              Version 1.0.0 • Made for Stanford Hackathon
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
