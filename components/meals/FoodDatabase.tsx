'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { NeonInput } from '@/components/ui/NeonInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import {
  type FoodCatKey,
  CATEGORY_ORDER,
  CATEGORY_EMOJI,
  CAT_STYLES,
  getCategoryForFood,
} from '@/lib/foodCategories';

// ── Types ──────────────────────────────────────────────────────────────────

interface Food {
  id: string; name: string; calories: number; protein: number; carbs: number; fat: number;
  serving: number; isCustom: boolean;
}

// ── FoodCard ───────────────────────────────────────────────────────────────

function FoodCard({
  food, catKey, onAddFood,
}: {
  food: Food; catKey: FoodCatKey; onAddFood: (food: Food) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();
  const styles = CAT_STYLES[catKey];
  const displayName = food.isCustom ? food.name : t('food.' + food.name);

  return (
    <div className={cn('bg-dark-card transition-all duration-200 overflow-hidden', expanded ? `border-l-2 ${styles.border}` : '')}>
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-dark-hover/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-200 truncate">{displayName}</span>
            {food.isCustom && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-400/15 text-violet-400 border border-violet-400/30 shrink-0">
                {t('fooddb.custom')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={cn('text-[11px] font-bold', styles.text)}>{Math.round(food.calories)} kcal</span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-500">P {food.protein}g</span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-500">C {food.carbs}g</span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-500">G {food.fat}g</span>
          </div>
        </div>
        <ChevronDown size={14} className={cn('text-slate-500 transition-transform duration-200 shrink-0', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className={cn('px-4 pb-4 pt-3 space-y-3', styles.bg)}>
          {/* Macro grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: t('fooddb.calories'), value: `${Math.round(food.calories)} kcal`, accent: styles.text },
              { label: t('meals.protein'), value: `${food.protein}g`, accent: 'text-neon-green' },
              { label: t('meals.carbs'), value: `${food.carbs}g`, accent: 'text-neon-yellow' },
              { label: t('meals.fat'), value: `${food.fat}g`, accent: 'text-neon-pink' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="text-center bg-dark-card/50 rounded-lg p-2">
                <p className={cn('text-sm font-black', accent)}>{value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Serving reference */}
          <p className="text-[11px] text-slate-500">
            {t('fooddb.per100g')} · {t('fooddb.serving')} {food.serving}g
          </p>

          {/* Add to log button */}
          <button
            onClick={() => onAddFood(food)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:opacity-80',
              styles.bg, styles.border, styles.text,
            )}
          >
            <Plus size={12} /> {t('fooddb.addToLog')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Category section ───────────────────────────────────────────────────────

function FoodCategorySection({
  catKey, foods, onAddFood,
}: {
  catKey: FoodCatKey; foods: Food[]; onAddFood: (food: Food) => void;
}) {
  const [open, setOpen] = useState(true);
  const { t } = useI18n();
  const styles = CAT_STYLES[catKey];

  return (
    <div className={cn('rounded-xl border overflow-hidden', styles.border)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('w-full flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-90', styles.headerBg)}
      >
        <span className="text-base">{CATEGORY_EMOJI[catKey]}</span>
        <span className={cn('text-sm font-bold flex-1 text-left', styles.text)}>{t(`foodcat.${catKey}`)}</span>
        <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium mr-1', styles.badge)}>
          {foods.length}
        </span>
        <ChevronRight size={14} className={cn('text-slate-500 transition-transform duration-200', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="divide-y divide-dark-border/50">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} catKey={catKey} onAddFood={onAddFood} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function FoodDatabase({ onAddFood }: { onAddFood: (food: Food) => void }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<FoodCatKey | null>(null);
  const { t } = useI18n();

  const { data: foods, isLoading } = useQuery<Food[]>({
    queryKey: ['foods-all'],
    queryFn: () => fetch('/api/foods?all=true').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const isSearching = search.trim().length > 0;

  const filtered = useMemo(() => {
    const all = foods ?? [];
    const q = search.toLowerCase().trim();
    return all.filter((f) => {
      if (catFilter && getCategoryForFood(f) !== catFilter) return false;
      if (q) {
        const displayName = f.isCustom ? f.name : f.name.toLowerCase();
        return displayName.includes(q);
      }
      return true;
    });
  }, [foods, search, catFilter]);

  const grouped = useMemo(() => {
    if (isSearching) return null;
    const map: Partial<Record<FoodCatKey, Food[]>> = {};
    for (const food of filtered) {
      const cat = getCategoryForFood(food);
      if (!map[cat]) map[cat] = [];
      map[cat]!.push(food);
    }
    for (const cat of CATEGORY_ORDER) {
      if (map[cat]) map[cat]!.sort((a, b) => a.name.localeCompare(b.name));
    }
    return CATEGORY_ORDER.filter((cat) => map[cat]?.length).map((cat) => [cat, map[cat]!] as [FoodCatKey, Food[]]);
  }, [filtered, isSearching]);

  // Unique categories present in all foods (for filter chips)
  const availableCats = useMemo(() => {
    const all = foods ?? [];
    const seen = new Set<FoodCatKey>();
    for (const f of all) seen.add(getCategoryForFood(f));
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, [foods]);

  const isFiltering = isSearching || catFilter !== null;

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500 text-center px-2 py-1.5 rounded-lg bg-dark-muted border border-dark-border/40">
        {t('fooddb.rawNote')}
      </p>

      <NeonInput
        placeholder={t('fooddb.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {isFiltering && (
          <button
            onClick={() => { setSearch(''); setCatFilter(null); }}
            className="shrink-0 px-3 py-1.5 rounded-full border border-dark-border text-slate-500 text-xs flex items-center gap-1 hover:text-slate-200 transition-colors"
          >
            <X size={11} /> {t('fooddb.clear')}
          </button>
        )}
        {availableCats.map((cat) => {
          const styles = CAT_STYLES[cat];
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? null : cat)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                catFilter === cat
                  ? `${styles.bg} ${styles.border} ${styles.text}`
                  : 'border-dark-border text-slate-400 hover:border-slate-500 hover:text-slate-200',
              )}
            >
              {CATEGORY_EMOJI[cat]} {t(`foodcat.${cat}`)}
            </button>
          );
        })}
      </div>

      {/* Result count when filtering */}
      {isFiltering && !isLoading && (
        <p className="text-xs text-slate-500">
          {t(filtered.length === 1 ? 'fooddb.resultFound' : 'fooddb.resultsFound', { n: filtered.length })}
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm">{t('fooddb.noResults')}</p>
        </div>
      )}

      {/* Flat search / filter results */}
      {!isLoading && isSearching && filtered.length > 0 && (
        <div className="rounded-xl border border-dark-border overflow-hidden divide-y divide-dark-border/50">
          {[...filtered].sort((a, b) => a.name.localeCompare(b.name)).map((food) => (
            <FoodCard key={food.id} food={food} catKey={getCategoryForFood(food)} onAddFood={onAddFood} />
          ))}
        </div>
      )}

      {/* Grouped view */}
      {!isLoading && !isSearching && grouped && grouped.length > 0 && (
        <div className="space-y-3">
          {grouped.map(([cat, catFoods]) => (
            <FoodCategorySection key={cat} catKey={cat} foods={catFoods} onAddFood={onAddFood} />
          ))}
        </div>
      )}
    </div>
  );
}
