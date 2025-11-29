import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealEntry, NutritionGoals, MealType } from '@/types/nutrition';
import { format, subDays, parseISO } from 'date-fns';

interface NutritionState {
  entries: MealEntry[];
  goals: NutritionGoals;

  // Actions
  addMeal: (entry: Omit<MealEntry, 'id'>) => void;
  updateMeal: (id: string, updates: Partial<MealEntry>) => void;
  deleteMeal: (id: string) => void;
  setGoals: (goals: Partial<NutritionGoals>) => void;

  // Selectors
  getTodayMeals: () => MealEntry[];
  getMealsByDate: (date: string) => MealEntry[];
  getWeeklyStats: () => {
    avgMealsPerDay: number;
    avgQuality: number;
    avgWater: number;
    consistency: number;
  };
  getMissingMeals: (date: string) => MealType[];
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      entries: [],
      goals: {
        dailyWaterGlasses: 8,
        mealsPerDay: 3,
        preferredMealTimes: {
          breakfast: '08:00',
          lunch: '12:30',
          dinner: '18:30',
        },
      },

      addMeal: (entry) => {
        const newEntry: MealEntry = {
          ...entry,
          id: Date.now().toString(),
        };
        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
      },

      updateMeal: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteMeal: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      setGoals: (goals) => {
        set((state) => ({
          goals: { ...state.goals, ...goals },
        }));
      },

      getTodayMeals: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().entries.filter((e) => e.date === today);
      },

      getMealsByDate: (date) => {
        return get().entries.filter((e) => e.date === date);
      },

      getWeeklyStats: () => {
        const entries = get().entries;
        const last7Days = Array.from({ length: 7 }, (_, i) =>
          format(subDays(new Date(), i), 'yyyy-MM-dd')
        );

        const weekEntries = entries.filter((e) => last7Days.includes(e.date));
        const daysWithMeals = new Set(weekEntries.map((e) => e.date)).size;

        const avgMealsPerDay = weekEntries.length / 7;
        const avgQuality =
          weekEntries.length > 0
            ? weekEntries.reduce((sum, e) => sum + e.quality, 0) / weekEntries.length
            : 0;
        const avgWater =
          weekEntries.length > 0
            ? weekEntries.reduce((sum, e) => sum + (e.hydration || 0), 0) / 7
            : 0;
        const consistency = (daysWithMeals / 7) * 100;

        return {
          avgMealsPerDay: Math.round(avgMealsPerDay * 10) / 10,
          avgQuality: Math.round(avgQuality * 10) / 10,
          avgWater: Math.round(avgWater * 10) / 10,
          consistency: Math.round(consistency),
        };
      },

      getMissingMeals: (date) => {
        const meals = get().getMealsByDate(date);
        const loggedTypes = meals.map((m) => m.mealType);
        const expectedMeals: MealType[] = ['breakfast', 'lunch', 'dinner'];
        return expectedMeals.filter((m) => !loggedTypes.includes(m));
      },
    }),
    {
      name: 'ripple-nutrition',
    }
  )
);
