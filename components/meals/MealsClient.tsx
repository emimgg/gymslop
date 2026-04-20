'use client';

import { useState, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonSelect } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { MacroBar } from '@/components/ui/MacroBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { cn, sumMacros, effectiveMacros, toDateOnly, todayUTC } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import { FoodDatabase } from '@/components/meals/FoodDatabase';
import {
  type FoodCatKey,
  CATEGORY_ORDER,
  CATEGORY_EMOJI,
  CAT_STYLES,
  getCategoryForFood,
} from '@/lib/foodCategories';
import {
  FrequentFoodsSection,
  MealSuggestionCard,
  RecentMealsSection,
  type SuggestionsData,
  type SuggestionItem,
  type SuggestionFood,
} from '@/components/meals/MealSuggestions';
import toast from 'react-hot-toast';

type MainTab = 'registro' | 'alimentos';

const DEFAULT_GOALS = { calories: 2200, protein: 160, carbs: 250, fat: 70 };
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

function getMealTypeFromTime(): string {
  const h = new Date().getHours();
  if (h < 10) return 'BREAKFAST';
  if (h < 13) return 'SNACK';
  if (h < 16) return 'LUNCH';
  if (h < 19) return 'SNACK';
  return 'DINNER';
}

interface Food {
  id: string; name: string; calories: number; protein: number; carbs: number; fat: number;
  serving: number; isCustom?: boolean;
  defaultCookState?: string;
}
interface MealItem { id: string; mealType: string; quantity: number; cookState: string; food: Food; }
interface MealLog { id: string; items: MealItem[]; }
interface UserProfile { caloricTarget: number | null; startingWeight: number | null; }
interface WeightData { logs: { weight: number }[]; }
interface SessionItem { food: Food; quantity: number; cookState: string; }

function computeGoals(caloricTarget: number | null, bodyweightKg: number | null) {
  const calories = caloricTarget ?? DEFAULT_GOALS.calories;
  const protein = bodyweightKg ? Math.round(1.8 * bodyweightKg) : DEFAULT_GOALS.protein;
  const fat = 60;
  const carbsKcal = calories - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(carbsKcal / 4));
  return { calories, protein, fat, carbs };
}

// ── Food picker row (used in both grouped and flat views) ──────────────────

function FoodPickerRow({
  food, catKey, added, onAdd, displayName,
}: {
  food: Food; catKey: FoodCatKey; added: boolean; onAdd: () => void; displayName: string;
}) {
  const styles = CAT_STYLES[catKey];
  return (
    <button
      onClick={added ? undefined : onAdd}
      disabled={added}
      className={cn(
        'w-full text-left flex items-center gap-2.5 px-3 py-2 transition-colors text-sm',
        added ? 'opacity-40 cursor-default' : 'hover:bg-dark-hover cursor-pointer',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />
      <span className={cn('flex-1 truncate', added ? 'text-slate-400' : 'text-slate-200')}>{displayName}</span>
      <span className="text-[11px] text-slate-500 shrink-0">{food.calories} kcal · {food.protein}g P</span>
      {added && <Check size={12} className="text-neon-green shrink-0" />}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function MealsClient() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>('registro');
  const [selectedDate] = useState(toDateOnly(todayUTC()));
  const [showAdd, setShowAdd] = useState(false);
  const [showCustomFood, setShowCustomFood] = useState(false);
  const [mealType, setMealType] = useState<string>(() => getMealTypeFromTime());
  const [foodSearch, setFoodSearch] = useState('');
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [loggingAll, setLoggingAll] = useState(false);
  const [customFood, setCustomFood] = useState({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', serving: '100' });
  const [creatingFood, setCreatingFood] = useState(false);
  const [quickLogging, setQuickLogging] = useState(false);
  const [dismissedDate, setDismissedDate] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('meal-sugg-dismissed') ?? '') : ''
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const inferredMealType = getMealTypeFromTime();

  const { data: mealLog, isLoading } = useQuery<MealLog | null>({
    queryKey: ['meals', selectedDate],
    queryFn: () => fetch(`/api/meals?date=${selectedDate}`).then((r) => r.json()),
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: () => fetch('/api/user').then((r) => r.json()),
  });

  const { data: weightData } = useQuery<WeightData>({
    queryKey: ['weight'],
    queryFn: () => fetch('/api/weight?limit=1').then((r) => r.json()),
  });

  const currentWeight = weightData?.logs?.[0]?.weight ?? null;
  const GOALS = computeGoals(userProfile?.caloricTarget ?? null, currentWeight);

  // Fetch all foods at once; shared cache key with FoodDatabase tab.
  const { data: allFoods } = useQuery<Food[]>({
    queryKey: ['foods-all'],
    queryFn: () => fetch('/api/foods?all=true').then((r) => r.json()),
    enabled: showAdd,
    staleTime: 5 * 60_000,
  });

  const { data: suggestions } = useQuery<SuggestionsData>({
    queryKey: ['meal-suggestions', inferredMealType],
    queryFn: () =>
      fetch(`/api/meals/suggestions?mealType=${inferredMealType}`).then((r) => r.json()),
    enabled: mainTab === 'registro',
    staleTime: 5 * 60_000,
  });

  // Client-side search filter for the modal
  const modalFiltered = useMemo(() => {
    const all = allFoods ?? [];
    const q = foodSearch.toLowerCase().trim();
    if (!q) return all;
    return all.filter((f) => {
      const name = f.isCustom ? f.name : f.name.toLowerCase();
      return name.includes(q);
    });
  }, [allFoods, foodSearch]);

  // Grouped view (only when not searching)
  const modalGrouped = useMemo((): [FoodCatKey, Food[]][] | null => {
    if (foodSearch.trim()) return null;
    const map: Partial<Record<FoodCatKey, Food[]>> = {};
    for (const food of allFoods ?? []) {
      const cat = getCategoryForFood(food);
      if (!map[cat]) map[cat] = [];
      map[cat]!.push(food);
    }
    for (const cat of CATEGORY_ORDER) {
      if (map[cat]) map[cat]!.sort((a, b) => a.name.localeCompare(b.name));
    }
    return CATEGORY_ORDER.filter((cat) => map[cat]?.length).map((cat) => [cat, map[cat]!]);
  }, [allFoods, foodSearch]);

  const items = mealLog?.items ?? [];
  const totals = sumMacros(items.map((item) => {
    const m = effectiveMacros(item.food, item.cookState);
    return { quantity: item.quantity, food: { ...item.food, ...m } };
  }));

  function foodDisplayName(food: Food) {
    return food.isCustom ? food.name : t('food.' + food.name);
  }

  function addToSession(food: Food, overrideQty?: number, overrideCookState?: string) {
    if (sessionItems.some((i) => i.food.id === food.id)) {
      toast(t('meals.alreadyInSession'));
      return;
    }
    const quantity = overrideQty ?? food.serving;
    const cookState = overrideCookState ?? food.defaultCookState ?? 'RAW';
    setSessionItems((prev) => [...prev, { food, quantity, cookState }]);
    setFoodSearch('');
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function addSuggestionFoodToSession(sf: SuggestionFood, qty: number, cookState: string) {
    addToSession(sf as unknown as Food, qty, cookState);
  }

  function removeFromSession(foodId: string) {
    setSessionItems((prev) => prev.filter((i) => i.food.id !== foodId));
  }

  function updateSessionQuantity(foodId: string, qty: number) {
    setSessionItems((prev) => prev.map((i) => i.food.id === foodId ? { ...i, quantity: qty } : i));
  }

  async function logAll() {
    if (sessionItems.length === 0) return;
    setLoggingAll(true);
    try {
      await Promise.all(
        sessionItems.map((item) =>
          fetch('/api/meals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foodId: item.food.id, quantity: item.quantity, mealType, date: selectedDate, cookState: item.cookState }),
          })
        )
      );
      qc.invalidateQueries({ queryKey: ['meals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setShowAdd(false);
      setSessionItems([]);
      setFoodSearch('');
      toast.success(t('meals.loggedAllToast'));
    } finally {
      setLoggingAll(false);
    }
  }

  async function quickLog(suItems: SuggestionItem[], mt: string) {
    setQuickLogging(true);
    try {
      await Promise.all(
        suItems.map((item) =>
          fetch('/api/meals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              foodId: item.food.id,
              quantity: item.quantity,
              mealType: mt,
              date: selectedDate,
              cookState: item.cookState,
            }),
          })
        )
      );
      qc.invalidateQueries({ queryKey: ['meals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('meals.loggedAllToast'));
    } finally {
      setQuickLogging(false);
    }
  }

  function logAgain(suItems: SuggestionItem[], mt: string) {
    setMealType(mt);
    setSessionItems(
      suItems.map((i) => ({
        food: i.food as unknown as Food,
        quantity: i.quantity,
        cookState: i.cookState,
      }))
    );
    setShowAdd(true);
  }

  function dismissSuggestion() {
    localStorage.setItem('meal-sugg-dismissed', selectedDate);
    setDismissedDate(selectedDate);
  }

  function openModal() {
    setShowAdd(true);
    setSessionItems([]);
    setFoodSearch('');
  }

  function closeModal() {
    setShowAdd(false);
    setSessionItems([]);
    setFoodSearch('');
  }

  function handleAddFoodFromBrowser(food: Food) {
    setMainTab('registro');
    setSessionItems((prev) => {
      if (prev.some((i) => i.food.id === food.id)) return prev;
      return [{ food, quantity: food.serving, cookState: food.defaultCookState ?? 'RAW' }];
    });
    setFoodSearch('');
    setShowAdd(true);
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/meals?itemId=${itemId}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['meals'] });
  }

  async function createFood() {
    if (!customFood.name || !customFood.calories) return;
    setCreatingFood(true);
    try {
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customFood),
      });
      const food = await res.json();
      setShowCustomFood(false);
      setShowAdd(true);
      setCustomFood({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', serving: '100' });
      addToSession(food);
      toast.success(t('meals.foodCreatedToast'));
    } finally {
      setCreatingFood(false);
    }
  }

  const grouped = MEAL_TYPES.reduce((acc, mt) => {
    acc[mt] = items.filter((i) => i.mealType === mt);
    return acc;
  }, {} as Record<string, MealItem[]>);

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  const tabBar = (
    <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1 mb-4">
      {(['registro', 'alimentos'] as MainTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setMainTab(tab)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            mainTab === tab
              ? 'bg-dark-hover text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {tab === 'registro' ? `📋 ${t('meals.tabLog')}` : `🥗 ${t('meals.tabFoods')}`}
        </button>
      ))}
    </div>
  );

  if (mainTab === 'alimentos') {
    return (
      <div className="space-y-4">
        {tabBar}
        <FoodDatabase onAddFood={handleAddFoodFromBrowser} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tabBar}

      {/* Macro totals */}
      <Card neon="cyan">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{t('meals.todayMacros')}</h2>
          <span className="text-xs font-bold text-neon-cyan">{Math.round(totals.calories)} kcal</span>
        </div>
        <div className="space-y-2.5">
          <MacroBar label="Calories" current={totals.calories} goal={GOALS.calories} unit=" kcal" color="bg-neon-cyan" />
          <MacroBar label={t('meals.protein')} current={totals.protein} goal={GOALS.protein} color="bg-neon-green" />
          <MacroBar label={t('meals.carbs')} current={totals.carbs} goal={GOALS.carbs} color="bg-neon-yellow" />
          <MacroBar label={t('meals.fat')} current={totals.fat} goal={GOALS.fat} color="bg-neon-pink" />
        </div>
      </Card>

      <NeonButton variant="cyan" onClick={openModal} className="w-full">
        <Plus size={14} /> {t('meals.logFood')}
      </NeonButton>

      {/* Meal suggestion card */}
      {(() => {
        const sugg = suggestions?.mealSuggestion;
        if (!sugg || dismissedDate === selectedDate) return null;
        const alreadyLogged = grouped[sugg.mealType as typeof MEAL_TYPES[number]]?.length > 0;
        if (alreadyLogged) return null;
        const mealTypeName = t(`meals.${sugg.mealType}` as never);
        return (
          <MealSuggestionCard
            suggestion={sugg}
            mealTypeName={mealTypeName}
            onQuickLog={() => quickLog(sugg.items, sugg.mealType)}
            onDismiss={dismissSuggestion}
            loading={quickLogging}
          />
        );
      })()}

      {/* Meal groups */}
      {MEAL_TYPES.map((mt) => {
        const mtItems = grouped[mt];
        if (mtItems.length === 0) return null;
        const mtCalories = sumMacros(mtItems.map((i) => { const m = effectiveMacros(i.food, i.cookState); return { quantity: i.quantity, food: { ...i.food, ...m } }; })).calories;
        return (
          <Card key={mt}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-slate-200">{t(`meals.${mt}`)}</h3>
              <span className="text-xs text-slate-500">{Math.round(mtCalories)} kcal</span>
            </div>
            <div className="space-y-1.5">
              {mtItems.map((item) => {
                const m = effectiveMacros(item.food, item.cookState);
                const cal = (m.calories * item.quantity) / item.food.serving;
                const prot = (m.protein * item.quantity) / item.food.serving;
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-muted text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-slate-200 truncate">{foodDisplayName(item.food)}</p>
                      </div>
                      <p className="text-xs text-slate-500">{item.quantity}g · {Math.round(cal)} kcal · {Math.round(prot)}g {t('meals.protein').toLowerCase()}</p>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors ml-2 p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p className="text-3xl mb-2">🥗</p>
          <p>{t('meals.noMeals')}</p>
        </div>
      )}

      {suggestions?.recentMeals && suggestions.recentMeals.length > 0 && (
        <RecentMealsSection
          meals={suggestions.recentMeals}
          onLogAgain={logAgain}
        />
      )}

      {/* Add food modal */}
      <Modal open={showAdd} onClose={closeModal} title={t('meals.logFoodTitle')}>
        <div className="space-y-3">
          <p className="text-[11px] text-slate-500 text-center px-2 py-1.5 rounded-lg bg-dark-muted border border-dark-border/40">
            {t('fooddb.rawNote')}
          </p>

          <NeonSelect label={t('meals.meal')} value={mealType} onChange={(e) => setMealType(e.target.value)}>
            {MEAL_TYPES.map((mt) => <option key={mt} value={mt}>{t(`meals.${mt}`)}</option>)}
          </NeonSelect>

          <NeonInput
            ref={searchRef}
            label={t('meals.searchFood')}
            placeholder={t('meals.searchPlaceholder')}
            value={foodSearch}
            onChange={(e) => setFoodSearch(e.target.value)}
            autoFocus
          />

          {/* Frequent foods (shown when search is empty and data loaded) */}
          {!foodSearch.trim() && suggestions?.frequentFoods && suggestions.frequentFoods.length > 0 && (
            <FrequentFoodsSection
              foods={suggestions.frequentFoods}
              sessionFoodIds={sessionItems.map((i) => i.food.id)}
              onAdd={addSuggestionFoodToSession}
            />
          )}

          {/* Grouped food browser (no search active) */}
          {!foodSearch.trim() && modalGrouped && (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-dark-border">
              {modalGrouped.map(([cat, catFoods]) => {
                const styles = CAT_STYLES[cat];
                return (
                  <div key={cat}>
                    <div className={cn('px-3 py-1.5 flex items-center gap-2 sticky top-0 z-10', styles.headerBg)}>
                      <span className="text-xs">{CATEGORY_EMOJI[cat]}</span>
                      <span className={cn('text-[11px] font-bold uppercase tracking-wider', styles.text)}>
                        {t(`foodcat.${cat}`)}
                      </span>
                      <span className={cn('ml-auto text-[10px] px-1.5 py-0.5 rounded-full', styles.badge)}>
                        {catFoods.length}
                      </span>
                    </div>
                    <div className="divide-y divide-dark-border/30">
                      {catFoods.map((f) => (
                        <FoodPickerRow
                          key={f.id}
                          food={f}
                          catKey={cat}
                          added={sessionItems.some((i) => i.food.id === f.id)}
                          onAdd={() => addToSession(f)}
                          displayName={foodDisplayName(f)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Flat search results */}
          {foodSearch.trim() && (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-dark-border divide-y divide-dark-border/30">
              {modalFiltered.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">{t('meals.noResults')}</p>
              ) : (
                [...modalFiltered]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((f) => (
                    <FoodPickerRow
                      key={f.id}
                      food={f}
                      catKey={getCategoryForFood(f)}
                      added={sessionItems.some((i) => i.food.id === f.id)}
                      onAdd={() => addToSession(f)}
                      displayName={foodDisplayName(f)}
                    />
                  ))
              )}
            </div>
          )}

          <div className="border-t border-dark-border pt-3">
            <NeonButton variant="cyan" size="sm" onClick={() => { setShowAdd(false); setShowCustomFood(true); }}>
              <Plus size={12} /> {t('meals.createCustom')}
            </NeonButton>
          </div>

          {/* Session items */}
          {sessionItems.length > 0 && (
            <div className="border-t border-dark-border pt-3 space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('meals.sessionTitle')} ({sessionItems.length})</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sessionItems.map((item) => {
                  const cal = ((item.food.calories * item.quantity) / item.food.serving).toFixed(0);
                  return (
                    <div key={item.food.id} className="flex items-center gap-2 p-2 rounded-lg bg-dark-muted border border-dark-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 truncate">{foodDisplayName(item.food)}</p>
                      </div>
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={(e) => updateSessionQuantity(item.food.id, parseFloat(e.target.value) || 0)}
                        className="w-16 text-center bg-dark-bg border border-dark-border rounded text-xs text-neon-cyan py-1 shrink-0"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0 w-14 text-right">{cal} kcal</span>
                      <button onClick={() => removeFromSession(item.food.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <NeonButton variant="green" loading={loggingAll} onClick={logAll} className="w-full">
                {t('meals.logAll')} ({sessionItems.length})
              </NeonButton>
            </div>
          )}
        </div>
      </Modal>

      {/* Custom food modal */}
      <Modal open={showCustomFood} onClose={() => setShowCustomFood(false)} title={t('meals.customFoodTitle')}>
        <div className="space-y-2">
          <NeonInput label={t('meals.name')} value={customFood.name} onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })} />
          <NeonInput label={t('meals.brand')} value={customFood.brand} onChange={(e) => setCustomFood({ ...customFood, brand: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <NeonInput label={t('meals.serving')} type="number" value={customFood.serving} onChange={(e) => setCustomFood({ ...customFood, serving: e.target.value })} />
            <NeonInput label={t('meals.calories')} type="number" value={customFood.calories} onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })} />
            <NeonInput label={t('meals.protein')} type="number" value={customFood.protein} onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })} />
            <NeonInput label={t('meals.carbs')} type="number" value={customFood.carbs} onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })} />
            <NeonInput label={t('meals.fat')} type="number" value={customFood.fat} onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })} />
            <NeonInput label={t('meals.fiber')} type="number" value={customFood.fiber} onChange={(e) => setCustomFood({ ...customFood, fiber: e.target.value })} />
          </div>
          <NeonButton variant="cyan" loading={creatingFood} onClick={createFood} className="w-full">
            {t('meals.createFood')}
          </NeonButton>
        </div>
      </Modal>
    </div>
  );
}
