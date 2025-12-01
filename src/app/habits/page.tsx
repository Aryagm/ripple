'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useHabitStore } from '@/store/habit-store';
import { useGamificationStore } from '@/store/gamification-store';
import { PREBUILT_HABITS } from '@/constants/habits';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Flame,
  Check,
  Minus,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Habit, HabitCategory } from '@/types/habit';

function HabitsSkeleton() {
  return (
    <div className="py-6 space-y-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  wellness: '#8B5CF6',
  productivity: '#3B82F6',
  social: '#EC4899',
  health: '#22C55E',
  custom: '#F59E0B',
};

export default function HabitsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPrebuiltDialog, setShowPrebuiltDialog] = useState(false);

  const user = useUserStore((state) => state.user);
  const {
    habits,
    logs,
    getActiveHabits,
    getTodayLogs,
    getHabitStreak,
    toggleHabitCompletion,
    incrementHabitCount,
    decrementHabitCount,
    addHabit,
    toggleHabitActive,
  } = useHabitStore();
  const { addPoints, updateWeeklyChallenge } = useGamificationStore();

  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'custom' as HabitCategory,
    targetCount: 0,
    pointsPerCompletion: 10,
  });

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
      <AppShell title="Habits">
        <HabitsSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = getActiveHabits();
  const todayLogs = getTodayLogs();
  const completedCount = todayLogs.filter((l) => l.completed).length;
  const progress = activeHabits.length > 0 ? (completedCount / activeHabits.length) * 100 : 0;

  const handleToggleHabit = (habit: Habit) => {
    const wasCompleted = todayLogs.find((l) => l.habitId === habit.id)?.completed;

    if (habit.targetCount && habit.targetCount > 1) {
      incrementHabitCount(habit.id, today);
      const newLog = logs.find((l) => l.habitId === habit.id && l.date === today);
      if (newLog?.completed && !wasCompleted) {
        addPoints(habit.pointsPerCompletion, `Completed ${habit.name}`);
        updateWeeklyChallenge(1);
        toast.success(`+${habit.pointsPerCompletion} points!`, {
          description: `Completed ${habit.name}`,
        });
      }
    } else {
      toggleHabitCompletion(habit.id, today);
      if (!wasCompleted) {
        addPoints(habit.pointsPerCompletion, `Completed ${habit.name}`);
        updateWeeklyChallenge(1);
        toast.success(`+${habit.pointsPerCompletion} points!`, {
          description: `Completed ${habit.name}`,
        });
      }
    }
  };

  const handleAddCustomHabit = () => {
    if (!newHabit.name.trim()) return;

    addHabit({
      name: newHabit.name,
      description: newHabit.description,
      icon: 'Star',
      color: CATEGORY_COLORS[newHabit.category],
      frequency: 'daily',
      targetCount: newHabit.targetCount > 0 ? newHabit.targetCount : undefined,
      category: newHabit.category,
      isPrebuilt: false,
      pointsPerCompletion: newHabit.pointsPerCompletion,
      active: true,
    });

    setNewHabit({
      name: '',
      description: '',
      category: 'custom',
      targetCount: 0,
      pointsPerCompletion: 10,
    });
    setShowAddDialog(false);
    toast.success('Habit added!');
  };

  const handleAddPrebuiltHabit = (habit: typeof PREBUILT_HABITS[0]) => {
    // Check if already exists
    const exists = habits.find((h) => h.name === habit.name);
    if (exists) {
      if (!exists.active) {
        toggleHabitActive(exists.id);
        toast.success('Habit reactivated!');
      } else {
        toast.info('This habit is already active');
      }
    } else {
      addHabit({ ...habit, active: true });
      toast.success('Habit added!');
    }
  };

  const inactiveHabits = habits.filter((h) => !h.active);
  const availablePrebuilt = PREBUILT_HABITS.filter(
    (ph) => !habits.find((h) => h.name === ph.name && h.active)
  );

  return (
    <AppShell title="Habits">
      <div className="py-6 space-y-6">
        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Today's Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {completedCount} of {activeHabits.length} habits completed
                </p>
              </div>
              {progress === 100 && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-medium">Perfect!</span>
                </div>
              )}
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Active Habits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active Habits</h2>
            <div className="flex gap-2">
              <Dialog open={showPrebuiltDialog} onOpenChange={setShowPrebuiltDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Browse
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Pre-built Habit</DialogTitle>
                    <DialogDescription>
                      Choose from our curated list of wellness habits
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 mt-4">
                    {availablePrebuilt.map((habit) => (
                      <div
                        key={habit.name}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                        onClick={() => {
                          handleAddPrebuiltHabit(habit);
                          setShowPrebuiltDialog(false);
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          <span style={{ color: habit.color }}>●</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{habit.name}</p>
                          <p className="text-xs text-muted-foreground">{habit.description}</p>
                        </div>
                        <Badge variant="outline">+{habit.pointsPerCompletion}</Badge>
                      </div>
                    ))}
                    {availablePrebuilt.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        All pre-built habits are already active!
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Custom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Habit</DialogTitle>
                    <DialogDescription>
                      Track any habit that matters to you
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Habit Name</Label>
                      <Input
                        placeholder="e.g., Walk 10,000 steps"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        placeholder="Brief description"
                        value={newHabit.description}
                        onChange={(e) =>
                          setNewHabit((prev) => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newHabit.category}
                        onValueChange={(value: HabitCategory) =>
                          setNewHabit((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wellness">Wellness</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="productivity">Productivity</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Count (0 = simple check)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={newHabit.targetCount}
                        onChange={(e) =>
                          setNewHabit((prev) => ({ ...prev, targetCount: parseInt(e.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Points per completion</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newHabit.pointsPerCompletion}
                        onChange={(e) =>
                          setNewHabit((prev) => ({
                            ...prev,
                            pointsPerCompletion: parseInt(e.target.value) || 10,
                          }))
                        }
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddCustomHabit}>
                      Create Habit
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {activeHabits.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No active habits yet</p>
                  <Button onClick={() => setShowPrebuiltDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Your First Habit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeHabits.map((habit) => {
                const log = todayLogs.find((l) => l.habitId === habit.id);
                const isCompleted = log?.completed || false;
                const currentCount = log?.count || 0;
                const streak = getHabitStreak(habit.id);

                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card
                      className={`transition-all hover:shadow-md ${
                        isCompleted ? 'bg-primary/10 border-primary/30' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Color indicator */}
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: habit.color + '20' }}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5" style={{ color: habit.color }} />
                            ) : (
                              <span style={{ color: habit.color }}>●</span>
                            )}
                          </div>

                          {/* Habit info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-medium text-sm ${
                                  isCompleted ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {habit.name}
                              </p>
                              {streak > 0 && (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                  {streak}
                                </Badge>
                              )}
                            </div>
                            {habit.targetCount && habit.targetCount > 1 ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Progress
                                  value={(currentCount / habit.targetCount) * 100}
                                  className="h-1.5 flex-1"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {currentCount}/{habit.targetCount}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                +{habit.pointsPerCompletion} pts
                              </p>
                            )}
                          </div>

                          {/* Action */}
                          {habit.targetCount && habit.targetCount > 1 ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => decrementHabitCount(habit.id, today)}
                                disabled={currentCount === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={isCompleted ? 'default' : 'outline'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleHabit(habit)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleToggleHabit(habit)}
                              className="h-6 w-6"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Inactive Habits */}
        {inactiveHabits.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="font-semibold text-muted-foreground">Inactive Habits</h2>
            {inactiveHabits.map((habit) => (
              <Card key={habit.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: habit.color + '20' }}
                    >
                      <span style={{ color: habit.color }}>●</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{habit.name}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toggleHabitActive(habit.id);
                        toast.success('Habit reactivated!');
                      }}
                    >
                      Reactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
