import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

export function dayOfWeekName(day: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
}

export function dayOfWeekFull(day: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
}

type MacroFood = { calories: number; protein: number; carbs: number; fat: number; serving: number };

/** Return macros for a food — all values are per 100g raw weight */
export function effectiveMacros(food: MacroFood, _cookState?: string) {
  return { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat };
}

/** Compute total macros from an array of meal items */
export function sumMacros(items: { quantity: number; food: { calories: number; protein: number; carbs: number; fat: number; serving: number } }[]) {
  return items.reduce(
    (acc, item) => {
      const factor = item.quantity / item.food.serving;
      return {
        calories: acc.calories + item.food.calories * factor,
        protein: acc.protein + item.food.protein * factor,
        carbs: acc.carbs + item.food.carbs * factor,
        fat: acc.fat + item.food.fat * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function muscleGroupLabel(mg: string): string {
  const labels: Record<string, string> = {
    CHEST: 'Chest',
    BACK: 'Back',
    SHOULDERS: 'Shoulders',
    BICEPS: 'Biceps',
    TRICEPS: 'Triceps',
    FOREARMS: 'Forearms',
    CORE: 'Core',
    QUADS: 'Quads',
    HAMSTRINGS: 'Hamstrings',
    GLUTES: 'Glutes',
    CALVES: 'Calves',
    FULL_BODY: 'Full Body',
    CARDIO: 'Cardio',
  };
  return labels[mg] ?? mg;
}
