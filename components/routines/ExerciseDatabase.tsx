'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown, ChevronRight, Plus, X, Dumbbell,
} from 'lucide-react';
import { MG_CONFIG, COLOR_STYLES, type NeonColor } from '@/lib/muscleGroupConfig';
import { NeonInput } from '@/components/ui/NeonInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { getExerciseMeta, type MovementType } from '@/lib/exerciseMetadata';
import { useI18n } from '@/components/providers/I18nProvider';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  isCustom: boolean;
}

interface RoutineDay {
  id: string;
  dayOfWeek: number;
  exercises: { exerciseId: string; order: number; targetSets: number; targetReps: number; targetWeight: number | null }[];
}

interface Routine {
  id: string;
  name: string;
  days: RoutineDay[];
}


const MOVEMENT_BADGE: Record<MovementType, string> = {
  Compound:  'bg-neon-green/10  text-neon-green  border border-neon-green/25',
  Isolation: 'bg-neon-pink/10   text-neon-pink   border border-neon-pink/25',
};

const EQUIPMENT_VALUES = ['BARBELL', 'DUMBBELL', 'CABLE', 'BODYWEIGHT', 'MACHINE'];

// ── Add to Routine modal ───────────────────────────────────────────────────

function AddToRoutineModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');

  const { data: routines, isLoading } = useQuery<Routine[]>({
    queryKey: ['routines'],
    queryFn: () => fetch('/api/routines').then((r) => r.json()),
  });

  const selectedRoutine = routines?.find((r) => r.id === selectedRoutineId);

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/routines/${selectedRoutineId}`);
      const routine: { id: string; name: string; days: { id: string; dayOfWeek: number; exercises: { exerciseId: string; order: number; targetSets: number; targetReps: number; targetWeight: number | null }[] }[] } = await res.json();

      const updatedDays = routine.days.map((day) => {
        if (day.id !== selectedDayId) return day;
        if (day.exercises.some((e) => e.exerciseId === exercise.id)) throw new Error('already_added');
        return {
          ...day,
          exercises: [
            ...day.exercises,
            { exerciseId: exercise.id, order: day.exercises.length, targetSets: 3, targetReps: 10, targetWeight: null },
          ],
        };
      });

      await fetch(`/api/routines/${selectedRoutineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: routine.name, days: updatedDays }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      toast.success(t('exdb.addedToast', { name: t('ex.' + exercise.name) }));
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message === 'already_added' ? t('exdb.alreadyAdded') : t('exdb.addError'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card border border-neon-green/30 rounded-2xl p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neon-green">{t('exdb.addToRoutineTitle')}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{t('ex.' + exercise.name)}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {isLoading && <Skeleton className="h-20" />}
        {!isLoading && (routines?.length ?? 0) === 0 && (
          <p className="text-sm text-slate-500 text-center py-2">{t('exdb.noRoutines')}</p>
        )}

        {(routines?.length ?? 0) > 0 && (
          <>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">{t('exdb.routineLabel')}</p>
              <div className="space-y-1">
                {routines!.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRoutineId(r.id); setSelectedDayId(''); }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg border text-sm transition-all',
                      selectedRoutineId === r.id
                        ? 'bg-neon-green/15 border-neon-green/40 text-neon-green'
                        : 'border-dark-border text-slate-300 hover:border-slate-500',
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedRoutine && selectedRoutine.days.length > 0 && (
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">{t('exdb.dayLabel')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...selectedRoutine.days]
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((day) => (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDayId(day.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                          selectedDayId === day.id
                            ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan'
                            : 'border-dark-border text-slate-400 hover:border-slate-500',
                        )}
                      >
                        {t(`day.${day.dayOfWeek}`)}
                      </button>
                    ))}
                </div>
              </div>
            )}
            {selectedRoutine && selectedRoutine.days.length === 0 && (
              <p className="text-xs text-slate-500">{t('exdb.noDays')}</p>
            )}

            <button
              onClick={() => addMutation.mutate()}
              disabled={!selectedRoutineId || !selectedDayId || addMutation.isPending}
              className={cn(
                'w-full py-2.5 rounded-lg border font-medium text-sm transition-all',
                selectedRoutineId && selectedDayId
                  ? 'bg-neon-green/15 border-neon-green/40 text-neon-green hover:bg-neon-green/25'
                  : 'border-dark-border text-slate-600 cursor-not-allowed',
              )}
            >
              {addMutation.isPending ? t('exdb.adding') : t('exdb.addExercise')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Exercise card ──────────────────────────────────────────────────────────

function ExerciseCard({ exercise, color }: { exercise: Exercise; color: NeonColor }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { t } = useI18n();
  const meta = getExerciseMeta(exercise.name);
  const styles = COLOR_STYLES[color];

  return (
    <>
      <div
        className={cn(
          'bg-dark-card transition-all duration-200 overflow-hidden',
          expanded ? `border-l-2 ${styles.border.replace('border-', 'border-l-')}` : '',
        )}
      >
        <button
          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-dark-hover/30 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-200 truncate">{t('ex.' + exercise.name)}</span>
              {exercise.isCustom && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30 shrink-0">
                  {t('exdb.custom')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-slate-500">{t('equip.' + exercise.equipment)}</span>
              <span className="text-slate-700">·</span>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', MOVEMENT_BADGE[meta.movementType])}>
                {t('movement.' + meta.movementType)}
              </span>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={cn('text-slate-500 transition-transform duration-200 shrink-0', expanded && 'rotate-180')}
          />
        </button>

        {expanded && (
          <div className={cn('px-4 pb-4 pt-3 space-y-3', styles.bg)}>
            <p className="text-xs text-slate-400 leading-relaxed">{meta.description}</p>

            <div className="grid grid-cols-2 gap-3">
              {meta.primaryMuscles.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">{t('exdb.primary')}</p>
                  <div className="flex flex-wrap gap-1">
                    {meta.primaryMuscles.map((m) => (
                      <span key={m} className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', styles.badge)}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {meta.secondaryMuscles.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">{t('exdb.secondary')}</p>
                  <div className="flex flex-wrap gap-1">
                    {meta.secondaryMuscles.map((m) => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded-full border border-dark-border text-slate-500">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setShowAddModal(true); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:opacity-80',
                styles.bg, styles.border, styles.text,
              )}
            >
              <Plus size={12} /> {t('exdb.addToRoutine')}
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddToRoutineModal exercise={exercise} onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}

// ── Muscle group section ───────────────────────────────────────────────────

function MuscleGroupSection({ muscleGroup, exercises }: { muscleGroup: string; exercises: Exercise[] }) {
  const [open, setOpen] = useState(true);
  const { t } = useI18n();
  const cfg = MG_CONFIG[muscleGroup] ?? { color: 'green' as NeonColor, Icon: Dumbbell, labelKey: 'muscle.' + muscleGroup, order: 99 };
  const styles = COLOR_STYLES[cfg.color];
  const { Icon } = cfg;

  return (
    <div className={cn('rounded-xl border overflow-hidden', styles.border)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('w-full flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-90', styles.headerBg)}
      >
        <Icon size={16} className={styles.text} />
        <span className={cn('text-sm font-bold flex-1 text-left', styles.text)}>{t(cfg.labelKey)}</span>
        <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium mr-1', styles.badge)}>
          {exercises.length}
        </span>
        <ChevronRight
          size={14}
          className={cn('text-slate-500 transition-transform duration-200', open && 'rotate-90')}
        />
      </button>

      {open && (
        <div className="divide-y divide-dark-border/50">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} color={cfg.color} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ExerciseDatabase() {
  const [search, setSearch] = useState('');
  const [equipFilter, setEquipFilter] = useState<string | null>(null);
  const { t } = useI18n();

  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = search.toLowerCase().trim();
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q) && !t('ex.' + ex.name).toLowerCase().includes(q)) return false;
      if (equipFilter && ex.equipment !== equipFilter) return false;
      return true;
    });
  }, [exercises, search, equipFilter, t]);

  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      if (!map[ex.muscleGroup]) map[ex.muscleGroup] = [];
      map[ex.muscleGroup].push(ex);
    }
    return Object.entries(map).sort(
      ([a], [b]) => (MG_CONFIG[a]?.order ?? 99) - (MG_CONFIG[b]?.order ?? 99),
    );
  }, [filtered]);

  const isFiltering = search.trim().length > 0 || equipFilter !== null;

  return (
    <div className="space-y-4">
      <NeonInput
        placeholder={t('exdb.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 flex-wrap">
        {EQUIPMENT_VALUES.map((val) => (
          <button
            key={val}
            onClick={() => setEquipFilter(equipFilter === val ? null : val)}
            className={cn(
              'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
              equipFilter === val
                ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan'
                : 'border-dark-border text-slate-400 hover:border-slate-500 hover:text-slate-200',
            )}
          >
            {t('equip.' + val)}
          </button>
        ))}
        {isFiltering && (
          <button
            onClick={() => { setSearch(''); setEquipFilter(null); }}
            className="px-3 py-1.5 rounded-full border border-dark-border text-slate-500 text-xs flex items-center gap-1 hover:text-slate-200 transition-colors"
          >
            <X size={11} /> {t('exdb.clear')}
          </button>
        )}
      </div>

      {isFiltering && !isLoading && (
        <p className="text-xs text-slate-500">
          {t(filtered.length === 1 ? 'exdb.resultFound' : 'exdb.resultsFound', { n: filtered.length })}
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {!isLoading && grouped.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm">{t('exdb.noResults')}</p>
        </div>
      )}

      {!isLoading && grouped.length > 0 && (
        <div className="space-y-3">
          {grouped.map(([mg, exes]) => (
            <MuscleGroupSection key={mg} muscleGroup={mg} exercises={exes} />
          ))}
        </div>
      )}
    </div>
  );
}
