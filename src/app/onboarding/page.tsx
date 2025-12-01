'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useHabitStore } from '@/store/habit-store';
import { useGamificationStore } from '@/store/gamification-store';
import { PREBUILT_HABITS } from '@/constants/habits';
import { UserProfile, YearInSchool, PeakTime, ClassSchedule, DayOfWeek } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Moon,
  GraduationCap,
  Target,
  Zap,
  AlertCircle,
  Sparkles,
  Plus,
  X,
  Clock,
  Calendar,
} from 'lucide-react';
import { CHALLENGE_OPTIONS, GOAL_CATEGORIES, PEAK_TIME_OPTIONS, ENERGY_DESCRIPTIONS } from '@/constants/challenges';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'basics', title: 'About You', icon: User },
  { id: 'sleep', title: 'Sleep', icon: Moon },
  { id: 'classes', title: 'Classes', icon: GraduationCap },
  { id: 'goals', title: 'Goals', icon: Target },
  { id: 'energy', title: 'Energy', icon: Zap },
  { id: 'challenges', title: 'Challenges', icon: AlertCircle },
  { id: 'habits', title: 'Habits', icon: Calendar },
];

const YEAR_OPTIONS: { value: YearInSchool; label: string }[] = [
  { value: 'freshman', label: 'Freshman' },
  { value: 'sophomore', label: 'Sophomore' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
  { value: 'graduate', label: 'Graduate Student' },
];

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'M' },
  { value: 'tue', label: 'T' },
  { value: 'wed', label: 'W' },
  { value: 'thu', label: 'T' },
  { value: 'fri', label: 'F' },
  { value: 'sat', label: 'S' },
  { value: 'sun', label: 'S' },
];

const CLASS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser, completeOnboarding } = useUserStore();
  const { addHabit } = useHabitStore();
  const { generateWeeklyChallenge } = useGamificationStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    major: '',
    yearInSchool: 'freshman' as YearInSchool,
    preferredBedtime: '23:00',
    preferredWakeTime: '07:00',
    classes: [] as ClassSchedule[],
    goals: [] as { category: string; title: string }[],
    energyPattern: {
      morningEnergy: 3 as 1 | 2 | 3 | 4 | 5,
      afternoonEnergy: 3 as 1 | 2 | 3 | 4 | 5,
      eveningEnergy: 3 as 1 | 2 | 3 | 4 | 5,
      peakProductivityTime: 'morning' as PeakTime,
    },
    currentChallenges: [] as string[],
    selectedHabits: [] as string[],
  });

  // New class form state
  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    location: '',
    days: [] as DayOfWeek[],
    startTime: '09:00',
    endTime: '10:00',
  });

  // New goal state
  const [newGoal, setNewGoal] = useState({ category: '', title: '' });

  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const newUser: UserProfile = {
      id: uuidv4(),
      name: formData.name,
      major: formData.major,
      yearInSchool: formData.yearInSchool,
      preferredBedtime: formData.preferredBedtime,
      preferredWakeTime: formData.preferredWakeTime,
      classes: formData.classes,
      goals: formData.goals.map((g) => ({
        id: uuidv4(),
        category: g.category as 'academic' | 'health' | 'social' | 'career' | 'personal',
        title: g.title,
        completed: false,
      })),
      energyPattern: formData.energyPattern,
      currentChallenges: formData.currentChallenges,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(newUser);

    // Add selected habits
    formData.selectedHabits.forEach((habitName) => {
      const habit = PREBUILT_HABITS.find((h) => h.name === habitName);
      if (habit) {
        addHabit({ ...habit, active: true });
      }
    });

    // Generate initial weekly challenge
    generateWeeklyChallenge();

    // Complete onboarding
    completeOnboarding();

    router.push('/dashboard');
  };

  const addClass = () => {
    if (newClass.name && newClass.days.length > 0) {
      const classToAdd: ClassSchedule = {
        id: uuidv4(),
        ...newClass,
        color: CLASS_COLORS[formData.classes.length % CLASS_COLORS.length],
      };
      setFormData((prev) => ({
        ...prev,
        classes: [...prev.classes, classToAdd],
      }));
      setNewClass({
        name: '',
        code: '',
        location: '',
        days: [],
        startTime: '09:00',
        endTime: '10:00',
      });
    }
  };

  const removeClass = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));
  };

  const addGoal = () => {
    if (newGoal.category && newGoal.title) {
      setFormData((prev) => ({
        ...prev,
        goals: [...prev.goals, { ...newGoal }],
      }));
      setNewGoal({ category: '', title: '' });
    }
  };

  const removeGoal = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const toggleChallenge = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      currentChallenges: prev.currentChallenges.includes(id)
        ? prev.currentChallenges.filter((c) => c !== id)
        : [...prev.currentChallenges, id],
    }));
  };

  const toggleHabit = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedHabits: prev.selectedHabits.includes(name)
        ? prev.selectedHabits.filter((h) => h !== name)
        : [...prev.selectedHabits, name],
    }));
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return true;
      case 'basics':
        return formData.name.trim().length > 0;
      case 'sleep':
        return true;
      case 'classes':
        return true;
      case 'goals':
        return true;
      case 'energy':
        return true;
      case 'challenges':
        return true;
      case 'habits':
        return formData.selectedHabits.length > 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center overflow-hidden">
              <Image
                src="/images/ripple_logo.png"
                alt="Ripple"
                width={128}
                height={128}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Welcome to Ripple</h1>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Your AI-powered companion for wellbeing and productivity. Let's set you up for success!
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Takes about 3 minutes</span>
              </div>
            </div>
          </div>
        );

      case 'basics':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">What's your major? (optional)</Label>
                <Input
                  id="major"
                  placeholder="e.g., Computer Science"
                  value={formData.major}
                  onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Year in school</Label>
                <Select
                  value={formData.yearInSchool}
                  onValueChange={(value: YearInSchool) =>
                    setFormData((prev) => ({ ...prev, yearInSchool: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'sleep':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Understanding your sleep schedule helps Ripple optimize your day.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedtime">Preferred Bedtime</Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={formData.preferredBedtime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, preferredBedtime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waketime">Preferred Wake Time</Label>
                <Input
                  id="waketime"
                  type="time"
                  value={formData.preferredWakeTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, preferredWakeTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Moon className="h-5 w-5 text-primary" />
                <p className="text-sm">
                  Target sleep: ~
                  {(() => {
                    const bed = parseInt(formData.preferredBedtime.split(':')[0]);
                    const wake = parseInt(formData.preferredWakeTime.split(':')[0]);
                    const diff = wake > bed ? wake - bed : 24 - bed + wake;
                    return diff;
                  })()}{' '}
                  hours per night
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'classes':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add your class schedule so Ripple can plan around it. You can skip this and add later.
            </p>

            {/* Existing classes */}
            {formData.classes.length > 0 && (
              <div className="space-y-2">
                {formData.classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50"
                  >
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: cls.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {cls.code ? `${cls.code}: ` : ''}{cls.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cls.days.map((d) => d.charAt(0).toUpperCase()).join('')} • {cls.startTime}-{cls.endTime}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeClass(cls.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new class form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add a Class
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Class name"
                    value={newClass.name}
                    onChange={(e) => setNewClass((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Code (e.g., CS 101)"
                    value={newClass.code}
                    onChange={(e) => setNewClass((prev) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder="Location (optional)"
                  value={newClass.location}
                  onChange={(e) => setNewClass((prev) => ({ ...prev, location: e.target.value }))}
                />
                <div className="space-y-2">
                  <Label className="text-xs">Days</Label>
                  <div className="flex gap-1">
                    {DAYS.map((day, idx) => (
                      <Button
                        key={day.value + idx}
                        type="button"
                        variant={newClass.days.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() =>
                          setNewClass((prev) => ({
                            ...prev,
                            days: prev.days.includes(day.value)
                              ? prev.days.filter((d) => d !== day.value)
                              : [...prev.days, day.value],
                          }))
                        }
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Start</Label>
                    <Input
                      type="time"
                      value={newClass.startTime}
                      onChange={(e) => setNewClass((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End</Label>
                    <Input
                      type="time"
                      value={newClass.endTime}
                      onChange={(e) => setNewClass((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={addClass}
                  disabled={!newClass.name || newClass.days.length === 0}
                >
                  Add Class
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              What do you want to achieve? Ripple will help you stay on track.
            </p>

            {/* Existing goals */}
            {formData.goals.length > 0 && (
              <div className="space-y-2">
                {formData.goals.map((goal, idx) => {
                  const category = GOAL_CATEGORIES.find((c) => c.id === goal.category);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50"
                    >
                      <Badge
                        style={{ backgroundColor: category?.color + '20', color: category?.color }}
                      >
                        {category?.label}
                      </Badge>
                      <span className="flex-1 text-sm">{goal.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeGoal(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new goal */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Select
                  value={newGoal.category}
                  onValueChange={(value) => setNewGoal((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="What's your goal?"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Button
                  className="w-full"
                  onClick={addGoal}
                  disabled={!newGoal.category || !newGoal.title}
                >
                  Add Goal
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground text-sm">
              When do you feel most energized? This helps us schedule tasks at optimal times.
            </p>

            <div className="space-y-6">
              {(['morning', 'afternoon', 'evening'] as const).map((period) => (
                <div key={period} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="capitalize">{period} Energy</Label>
                    <span className="text-sm text-muted-foreground">
                      {ENERGY_DESCRIPTIONS[formData.energyPattern[`${period}Energy`] as keyof typeof ENERGY_DESCRIPTIONS]}
                    </span>
                  </div>
                  <Slider
                    value={[formData.energyPattern[`${period}Energy`]]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={([value]) =>
                      setFormData((prev) => ({
                        ...prev,
                        energyPattern: {
                          ...prev.energyPattern,
                          [`${period}Energy`]: value as 1 | 2 | 3 | 4 | 5,
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Label>When are you most productive?</Label>
              <div className="grid grid-cols-2 gap-2">
                {PEAK_TIME_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant={formData.energyPattern.peakProductivityTime === option.id ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        energyPattern: {
                          ...prev.energyPattern,
                          peakProductivityTime: option.id as PeakTime,
                        },
                      }))
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'challenges':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              What challenges are you facing? Ripple will provide personalized support.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {CHALLENGE_OPTIONS.map((challenge) => {
                const isSelected = formData.currentChallenges.includes(challenge.id);
                return (
                  <Button
                    key={challenge.id}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    className="h-auto py-3 justify-start"
                    onClick={() => toggleChallenge(challenge.id)}
                  >
                    <span className="text-sm">{challenge.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        );

      case 'habits':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Choose habits to track. Select at least one to get started!
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {PREBUILT_HABITS.map((habit) => {
                const isSelected = formData.selectedHabits.includes(habit.name);
                return (
                  <div
                    key={habit.name}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/20 border border-primary/50' : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                    onClick={() => toggleHabit(habit.name)}
                  >
                    <Checkbox checked={isSelected} />
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: habit.color + '20' }}
                    >
                      <span style={{ color: habit.color }}>●</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{habit.name}</p>
                      <p className="text-xs text-muted-foreground">{habit.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{habit.pointsPerCompletion} pts
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-500/5 to-blue-500/15 dark:from-background dark:via-blue-500/10 dark:to-blue-500/20">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-muted-foreground">{STEPS[currentStep].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = STEPS[currentStep].icon;
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  {STEPS[currentStep].title}
                </CardTitle>
              </CardHeader>
              <CardContent>{renderStep()}</CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
            {currentStep === STEPS.length - 1 ? (
              <>
                Get Started
                <Sparkles className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
