export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  date: string; // yyyy-MM-dd
  mealType: MealType;
  time: string; // HH:mm
  description: string;
  calories?: number;
  hydration?: number; // glasses of water
  quality: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  notes?: string;
}

export interface NutritionGoals {
  dailyCalories?: number;
  dailyWaterGlasses: number;
  mealsPerDay: number;
  preferredMealTimes: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
}

export interface DailyNutritionSummary {
  date: string;
  totalMeals: number;
  totalCalories: number;
  totalWater: number;
  averageQuality: number;
  mealsLogged: MealType[];
}
