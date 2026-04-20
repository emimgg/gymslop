'use client';

import { Zap, X, RotateCcw, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { cn, effectiveMacros } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface SuggestionFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: number;
  isCustom?: boolean;
  rawCalories: number | null;
  rawProtein: number | null;
  rawCarbs: number | null;
  rawFat: number | null;
  defaultCookState: string;
}

export interface FrequentFood {
  food: SuggestionFood;
  count: number;
  typicalQuantity: number;
  typicalCookState: string;
}

export interface SuggestionItem {
  food: SuggestionFood;
  quantity: number;
  cookState: string;
}

export interface MealSuggestionData {
  mealType: string;
  items: SuggestionItem[];
  totalKcal: number;
}

export interface RecentMeal {
  date: string;
  mealType: string;
  items: SuggestionItem[];
  totalKcal: number;
}

export interface SuggestionsData {
  frequentFoods: FrequentFood[];
  mealSuggestion: MealSuggestionData | null;
  recentMeals: RecentMeal[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function kcalForItem(item: SuggestionItem): number {
  const m = effectiveMacros(item.food, item.cookState);
  return Math.round((m.calories * item.quantity) / item.food.serving);
}

// ── FrequentFoodsSection ──────────────────────────────────────────────────────
// Rendered inside the food picker modal when search is empty.

export function FrequentFoodsSection({
  foods,
  sessionFoodIds,
  onAdd,
}: {
  foods: FrequentFood[];
  sessionFoodIds: string[];
  onAdd: (food: SuggestionFood, qty: number, cookState: string) => void;
}) {
  const { t } = useI18n();
  if (foods.length === 0) return null;

  return (
    <div className="rounded-lg border border-dark-border overflow-hidden mb-0">
      <div className="px-3 py-1.5 flex items-center gap-2 bg-neon-yellow/5 border-b border-dark-border">
        <Star size={11} className="text-neon-yellow fill-neon-yellow" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-neon-yellow">
          {t('meals.frequent')}
        </span>
      </div>
      <div className="divide-y divide-dark-border/30">
        {foods.map(({ food, typicalQuantity, typicalCookState, count }) => {
          const added = sessionFoodIds.includes(food.id);
          const m = effectiveMacros(food, typicalCookState);
          const kcal = Math.round((m.calories * typicalQuantity) / food.serving);
          const displayName = food.isCustom ? food.name : t(`food.${food.name}` as never);

          return (
            <div
              key={food.id}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm',
                added ? 'opacity-40' : '',
              )}
            >
              <span className="flex-1 min-w-0">
                <span className={cn('truncate block', added ? 'text-slate-400' : 'text-slate-200')}>
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {typicalQuantity}g · {kcal} kcal · {t('meals.times').replace('{{n}}', String(count))}
                </span>
              </span>
              <button
                onClick={() => !added && onAdd(food, typicalQuantity, typicalCookState)}
                disabled={added}
                className={cn(
                  'shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors text-[13px] font-bold',
                  added
                    ? 'bg-dark-muted text-slate-600 cursor-default'
                    : 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25',
                )}
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MealSuggestionCard ────────────────────────────────────────────────────────
// Shown on the log tab when the suggested meal type hasn't been logged today.

export function MealSuggestionCard({
  suggestion,
  mealTypeName,
  onQuickLog,
  onDismiss,
  loading,
}: {
  suggestion: MealSuggestionData;
  mealTypeName: string;
  onQuickLog: () => void;
  onDismiss: () => void;
  loading: boolean;
}) {
  const { t } = useI18n();

  return (
    <Card className="border border-neon-cyan/20 bg-neon-cyan/5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] text-neon-cyan uppercase tracking-wider font-bold">
            {mealTypeName} · {t('meals.suggestion')}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {suggestion.items.map((i) => {
              const name = i.food.isCustom ? i.food.name : t(`food.${i.food.name}` as never);
              return `${name} ${i.quantity}g`;
            }).join(' · ')}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-600 hover:text-slate-400 transition-colors ml-2 p-0.5 shrink-0"
          aria-label={t('meals.dismiss')}
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neon-cyan">
          {suggestion.totalKcal.toLocaleString()} kcal
        </span>
        <NeonButton variant="green" size="sm" loading={loading} onClick={onQuickLog}>
          <Zap size={11} /> {t('meals.quickLog')}
        </NeonButton>
      </div>
    </Card>
  );
}

// ── RecentMealsSection ────────────────────────────────────────────────────────
// Shown below logged meal groups on the log tab.

export function RecentMealsSection({
  meals,
  onLogAgain,
}: {
  meals: RecentMeal[];
  onLogAgain: (items: SuggestionItem[], mealType: string) => void;
}) {
  const { t } = useI18n();
  if (meals.length === 0) return null;

  function fmtDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayKey = `day.${d.getUTCDay()}` as never;
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${t(dayKey)} ${dd}/${mm}`;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold px-1">
        {t('meals.recentMeals')}
      </p>
      {meals.map((meal, idx) => {
        const totalKcal = meal.items.reduce((s, i) => s + kcalForItem(i), 0);
        return (
          <Card key={idx} className="py-2.5 px-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold text-slate-300">
                    {t(`meals.${meal.mealType}` as never)}
                  </span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">{fmtDate(meal.date)}</span>
                  <span className="text-[10px] text-neon-cyan ml-auto">
                    {Math.round(totalKcal)} kcal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {meal.items.map((i) => {
                    const name = i.food.isCustom ? i.food.name : t(`food.${i.food.name}` as never);
                    return `${name} ${i.quantity}g`;
                  }).join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => onLogAgain(meal.items, meal.mealType)}
              >
                <RotateCcw size={10} /> {t('meals.logAgain')}
              </NeonButton>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
