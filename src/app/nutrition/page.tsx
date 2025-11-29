'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useNutritionStore } from '@/store/nutrition-store';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Plus,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Droplets,
  UtensilsCrossed,
  Check,
  TrendingUp,
} from 'lucide-react';
import { MealType } from '@/types/nutrition';

function NutritionSkeleton() {
  return (
    <div className="py-6 space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const QUALITY_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

export default function NutritionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');

  const user = useUserStore((state) => state.user);
  const {
    goals,
    getTodayMeals,
    getMissingMeals,
    getWeeklyStats,
    addMeal,
  } = useNutritionStore();

  const [mealForm, setMealForm] = useState({
    description: '',
    quality: 3,
    hydration: 2,
    time: format(new Date(), 'HH:mm'),
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
      <AppShell title="Nutrition">
        <NutritionSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  const todayMeals = getTodayMeals();
  const missingMeals = getMissingMeals(format(new Date(), 'yyyy-MM-dd'));
  const weeklyStats = getWeeklyStats();
  const todayWater = todayMeals.reduce((sum, m) => sum + (m.hydration || 0), 0);
  const waterProgress = (todayWater / goals.dailyWaterGlasses) * 100;

  const handleAddMeal = () => {
    if (!mealForm.description.trim()) {
      toast.error('Please describe what you ate');
      return;
    }

    addMeal({
      date: format(new Date(), 'yyyy-MM-dd'),
      mealType: selectedMealType,
      time: mealForm.time,
      description: mealForm.description,
      quality: mealForm.quality as 1 | 2 | 3 | 4 | 5,
      hydration: mealForm.hydration,
    });

    toast.success(`${MEAL_LABELS[selectedMealType]} logged!`);
    setShowAddMeal(false);
    setMealForm({
      description: '',
      quality: 3,
      hydration: 2,
      time: format(new Date(), 'HH:mm'),
    });
  };

  const openAddMealDialog = (type: MealType) => {
    setSelectedMealType(type);
    setShowAddMeal(true);
  };

  return (
    <AppShell title="Nutrition">
      <div className="py-6 space-y-6">
        {/* Today's Progress */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{todayMeals.length}/{goals.mealsPerDay}</p>
                  <p className="text-xs text-muted-foreground">Meals Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{todayWater}/{goals.dailyWaterGlasses}</p>
                  <p className="text-xs text-muted-foreground">Glasses Water</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Water Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Hydration</span>
              <span className="text-sm text-muted-foreground">{Math.round(waterProgress)}%</span>
            </div>
            <Progress value={waterProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Meal Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today's Meals</CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, MMMM d')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => {
              const Icon = MEAL_ICONS[mealType];
              const meal = todayMeals.find((m) => m.mealType === mealType);
              const isLogged = !!meal;

              return (
                <div
                  key={mealType}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isLogged ? 'bg-muted/30 border-border' : 'border-dashed'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isLogged ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${isLogged ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{MEAL_LABELS[mealType]}</p>
                    {isLogged ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {meal.description} • {meal.time}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not logged yet</p>
                    )}
                  </div>
                  {isLogged ? (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Check className="h-3 w-3" />
                      {QUALITY_LABELS[meal.quality]}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddMealDialog(mealType)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Log
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Weekly Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-semibold">{weeklyStats.avgMealsPerDay}</p>
                <p className="text-xs text-muted-foreground">Avg meals/day</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-semibold">{weeklyStats.avgQuality}/5</p>
                <p className="text-xs text-muted-foreground">Avg quality</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-semibold">{weeklyStats.avgWater}</p>
                <p className="text-xs text-muted-foreground">Avg water/day</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-semibold">{weeklyStats.consistency}%</p>
                <p className="text-xs text-muted-foreground">Consistency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log {MEAL_LABELS[selectedMealType]}</DialogTitle>
            <DialogDescription>
              Record what you ate and how it made you feel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>What did you eat?</Label>
              <Input
                placeholder="e.g., Oatmeal with berries"
                value={mealForm.description}
                onChange={(e) => setMealForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={mealForm.time}
                onChange={(e) => setMealForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Meal Quality</Label>
                <span className="text-sm text-muted-foreground">
                  {QUALITY_LABELS[mealForm.quality]}
                </span>
              </div>
              <Slider
                value={[mealForm.quality]}
                min={1}
                max={5}
                step={1}
                onValueChange={([value]) => setMealForm((prev) => ({ ...prev, quality: value }))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Water (glasses)</Label>
                <span className="text-sm text-muted-foreground">
                  {mealForm.hydration} glasses
                </span>
              </div>
              <Slider
                value={[mealForm.hydration]}
                min={0}
                max={5}
                step={1}
                onValueChange={([value]) => setMealForm((prev) => ({ ...prev, hydration: value }))}
              />
            </div>

            <Button className="w-full" onClick={handleAddMeal}>
              Log Meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
