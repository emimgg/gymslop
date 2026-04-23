'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Zap, RotateCcw, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import {
  BuilderConfig, DBExercise, GeneratedRoutine, GeneratedExercise,
  Focus, SplitType, EquipmentLevel, CalorieStatus,
  generateRoutine, getAlternatives,
} from '@/lib/quickBuilderLogic';
import { useUserProfile, getCalorieStatus } from '@/lib/useAdvancedView';
import toast from 'react-hot-toast';

// ── Config ────────────────────────────────────────────────────────────────────

const DAYS_OPTIONS = [3, 4, 5, 6] as const;
const DEFAULT_SPLIT: Record<number, SplitType> = {
  3: 'FULL_BODY', 4: 'UPPER_LOWER', 5: 'ULPPL', 6: 'PPL',
};
const FOCUS_OPTIONS: Focus[] = ['STRENGTH', 'HYPERTROPHY', 'BOTH'];
const PRIORITY_MUSCLES = ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'GLUTES', 'CORE'] as const;
const EQUIPMENT_OPTIONS: EquipmentLevel[] = ['FULL', 'NO_BARBELL', 'DUMBBELLS', 'BODYWEIGHT'];

const EQUIP_ICONS: Record<EquipmentLevel, string> = {
  FULL: '🏋️', NO_BARBELL: '🔗', DUMBBELLS: '💪', BODYWEIGHT: '🤸',
};

const FOCUS_ICONS: Record<Focus, string> = {
  STRENGTH: '⚡', HYPERTROPHY: '📈', BOTH: '🎯',
};

const STATUS_COLORS = {
  low:     'text-neon-yellow border-neon-yellow/40 bg-neon-yellow/10',
  optimal: 'text-neon-green  border-neon-green/40  bg-neon-green/10',
  high:    'text-neon-red    border-neon-red/40    bg-neon-red/10',
};

// ── SwapPanel ─────────────────────────────────────────────────────────────────

function SwapPanel({
  target,
  exercises,
  equipmentLevel,
  usedIds,
  onSwap,
  onClose,
}: {
  target: GeneratedExercise;
  exercises: DBExercise[];
  equipmentLevel: EquipmentLevel;
  usedIds: Set<string>;
  onSwap: (replacement: DBExercise) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const alts = getAlternatives(target, exercises, equipmentLevel, usedIds);

  return (
    <div className="mt-2 rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neon-cyan/20">
        <span className="text-[11px] font-bold text-neon-cyan uppercase tracking-wider">
          {t('qb.swapTitle')}
        </span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X size={13} />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-dark-border/30">
        {alts.length === 0 && (
          <p className="px-3 py-3 text-xs text-slate-500 text-center">No alternatives found</p>
        )}
        {alts.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSwap(ex)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neon-cyan/10 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-200 truncate">{t(`ex.${ex.name}` as never)}</p>
              <p className="text-[10px] text-slate-500">
                {ex.equipment}{ex.stretchFocused ? ' · stretch' : ''}
              </p>
            </div>
            <ChevronRight size={12} className="text-neon-cyan shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ExerciseRow ───────────────────────────────────────────────────────────────

function ExerciseRow({
  ex,
  dayIdx,
  exIdx,
  exercises,
  equipmentLevel,
  usedIds,
  swapKey,
  onSwapOpen,
  onSwapClose,
  onSwap,
}: {
  ex: GeneratedExercise;
  dayIdx: number;
  exIdx: number;
  exercises: DBExercise[];
  equipmentLevel: EquipmentLevel;
  usedIds: Set<string>;
  swapKey: string | null;
  onSwapOpen: () => void;
  onSwapClose: () => void;
  onSwap: (replacement: DBExercise) => void;
}) {
  const { t } = useI18n();
  const key = `${dayIdx}-${exIdx}`;
  const isOpen = swapKey === key;

  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-slate-200 truncate block">{t(`ex.${ex.name}` as never)}</span>
          <span className="text-[10px] text-slate-500">
            {ex.sets}×{ex.repsDisplay}
            {ex.stretchFocused && <span className="ml-1 text-neon-purple">●</span>}
          </span>
        </div>
        <button
          onClick={isOpen ? onSwapClose : onSwapOpen}
          className={cn(
            'shrink-0 text-[10px] px-2 py-0.5 rounded border transition-colors',
            isOpen
              ? 'border-neon-cyan/60 text-neon-cyan bg-neon-cyan/15'
              : 'border-dark-border text-slate-500 hover:border-slate-500 hover:text-slate-300',
          )}
        >
          <RotateCcw size={9} className="inline mr-1" />{t('qb.swap')}
        </button>
      </div>
      {isOpen && (
        <SwapPanel
          target={ex}
          exercises={exercises}
          equipmentLevel={equipmentLevel}
          usedIds={usedIds}
          onSwap={onSwap}
          onClose={onSwapClose}
        />
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function QuickBuilder({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<BuilderConfig>({
    daysPerWeek: 4,
    splitType: 'UPPER_LOWER',
    focus: 'HYPERTROPHY',
    priorityMuscles: [],
    equipmentLevel: 'FULL',
  });

  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [swapKey, setSwapKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: exercises = [] } = useQuery<DBExercise[]>({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
    staleTime: Infinity,
  });

  const { data: userProfile } = useUserProfile();
  const calorieStatus: CalorieStatus = getCalorieStatus(userProfile?.weeklyGoalKg);

  function handleDaySelect(days: 3 | 4 | 5 | 6) {
    const splitType = DEFAULT_SPLIT[days];
    setConfig((c) => ({ ...c, daysPerWeek: days, splitType }));
  }

  function handleNext() {
    if (step < 4) { setStep((s) => s + 1); return; }
    // Step 4 → 5: generate
    setStep(5);
    setGenerating(true);
    setTimeout(() => {
      const result = generateRoutine(config, exercises, calorieStatus);
      setRoutine(result);
      setRoutineName(result.name);
      setGenerating(false);
    }, 1200);
  }

  function handleBack() {
    if (step === 5) { setStep(4); setRoutine(null); return; }
    setStep((s) => s - 1);
  }

  function togglePriorityMuscle(m: string) {
    setConfig((c) => ({
      ...c,
      priorityMuscles: c.priorityMuscles.includes(m)
        ? c.priorityMuscles.filter((x) => x !== m)
        : [...c.priorityMuscles, m],
    }));
  }

  function swapExercise(dayIdx: number, exIdx: number, replacement: DBExercise) {
    if (!routine) return;
    const newDays = routine.days.map((day, di) => {
      if (di !== dayIdx) return day;
      const newExercises = day.exercises.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        return {
          ...ex,
          exerciseId: replacement.id,
          name: replacement.name,
          muscleGroup: replacement.muscleGroup,
          equipment: replacement.equipment,
          stretchFocused: replacement.stretchFocused,
        };
      });
      return { ...day, exercises: newExercises };
    });
    // Recompute analytics inline
    const setsMap: Record<string, number> = {};
    const freqMap: Record<string, number> = {};
    for (const day of newDays) {
      const seen = new Set<string>();
      for (const ex of day.exercises) {
        setsMap[ex.muscleGroup] = (setsMap[ex.muscleGroup] ?? 0) + ex.sets;
        if (!seen.has(ex.muscleGroup)) {
          freqMap[ex.muscleGroup] = (freqMap[ex.muscleGroup] ?? 0) + 1;
          seen.add(ex.muscleGroup);
        }
      }
    }
    const analytics: GeneratedRoutine['analytics'] = {};
    for (const mg of Object.keys(setsMap)) {
      const sets = setsMap[mg];
      analytics[mg] = {
        sets,
        frequency: freqMap[mg] ?? 0,
        status: sets < 10 ? 'low' : sets > 22 ? 'high' : 'optimal',
      };
    }
    setRoutine({ ...routine, days: newDays, analytics });
    setSwapKey(null);
  }

  async function handleSave() {
    if (!routine) return;
    setSaving(true);
    try {
      const body = {
        name: routineName || routine.name,
        days: routine.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          exercises: day.exercises.map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            order: idx,
            targetSets: ex.sets,
            targetReps: ex.targetReps,
            targetWeight: null,
          })),
        })),
      };
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success(t('qb.savedToast'));
      onClose();
    } catch {
      toast.error('Error saving routine');
    } finally {
      setSaving(false);
    }
  }

  // All exercise ids in current routine for swap deduplication
  const usedIds = new Set(
    routine?.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)) ?? [],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl flex flex-col max-h-[90dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
          <div>
            <p className="font-bold text-slate-100 text-sm">{t('qb.title')}</p>
            <p className="text-[11px] text-slate-500">
              {t('qb.step').replace('{{n}}', String(step))}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-dark-border shrink-0">
          <div
            className="h-full bg-neon-cyan transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* ── Step 1: Days / split ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-100">{t('qb.s1Title')}</h2>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDaySelect(d)}
                    className={cn(
                      'rounded-xl border py-3 text-center font-bold text-lg transition-all',
                      config.daysPerWeek === d
                        ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan'
                        : 'border-dark-border text-slate-400 hover:border-slate-500',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-muted px-3 py-2.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{t('qb.s1Rec')}</p>
                <p className="text-sm font-semibold text-slate-200">
                  {t(`qb.split.${config.splitType}` as never)}
                </p>
              </div>

              {config.daysPerWeek === 6 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">{t('qb.s1SixChoice')}</p>
                  {(['PPL', 'ARNOLD'] as SplitType[]).map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setConfig((c) => ({ ...c, splitType: sp }))}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                        config.splitType === sp
                          ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                          : 'border-dark-border text-slate-300 hover:border-slate-500',
                      )}
                    >
                      <span className="text-sm font-semibold">{t(`qb.split.${sp}` as never)}</span>
                      {config.splitType === sp && <Check size={14} className="ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Focus ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <h2 className="font-bold text-slate-100">{t('qb.s2Title')}</h2>
              {FOCUS_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setConfig((c) => ({ ...c, focus: f }))}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all',
                    config.focus === f
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-dark-border hover:border-slate-500',
                  )}
                >
                  <span className="text-xl shrink-0 mt-0.5">{FOCUS_ICONS[f]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm', config.focus === f ? 'text-neon-cyan' : 'text-slate-200')}>
                      {t(`qb.focus.${f}` as never)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t(`qb.focus.${f}_desc` as never)}</p>
                  </div>
                  {config.focus === f && <Check size={14} className="text-neon-cyan shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          )}

          {/* ── Step 3: Priority muscles ─────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-slate-100">{t('qb.s3Title')}</h2>
                <p className="text-xs text-slate-500 mt-1">{t('qb.s3Desc')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_MUSCLES.map((m) => {
                  const active = config.priorityMuscles.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => togglePriorityMuscle(m)}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                        active
                          ? 'border-neon-purple bg-neon-purple/15 text-neon-purple'
                          : 'border-dark-border text-slate-400 hover:border-slate-500',
                      )}
                    >
                      {active && <Check size={10} className="inline mr-1" />}
                      {t(`qb.muscle.${m}` as never)}
                    </button>
                  );
                })}
              </div>
              {config.priorityMuscles.length === 0 && (
                <p className="text-xs text-slate-600 italic">{t('qb.s3Skip')}</p>
              )}
            </div>
          )}

          {/* ── Step 4: Equipment ────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-3">
              <h2 className="font-bold text-slate-100">{t('qb.s4Title')}</h2>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  onClick={() => setConfig((c) => ({ ...c, equipmentLevel: eq }))}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all',
                    config.equipmentLevel === eq
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-dark-border hover:border-slate-500',
                  )}
                >
                  <span className="text-xl shrink-0 mt-0.5">{EQUIP_ICONS[eq]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm', config.equipmentLevel === eq ? 'text-neon-cyan' : 'text-slate-200')}>
                      {t(`qb.equip.${eq}` as never)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t(`qb.equip.${eq}_desc` as never)}</p>
                  </div>
                  {config.equipmentLevel === eq && <Check size={14} className="text-neon-cyan shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          )}

          {/* ── Step 5: Preview ──────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4">
              {generating ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
                  <p className="text-sm text-slate-400">{t('qb.generating')}</p>
                </div>
              ) : routine ? (
                <>
                  <div>
                    <h2 className="font-bold text-slate-100">{t('qb.s5Title')}</h2>
                    {calorieStatus !== 'maintenance' && (
                      <div className={cn(
                        'mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium',
                        calorieStatus === 'deficit'
                          ? 'border-neon-yellow/40 bg-neon-yellow/10 text-neon-yellow'
                          : 'border-neon-green/40 bg-neon-green/10 text-neon-green',
                      )}>
                        <span>{calorieStatus === 'deficit' ? '📉' : '📈'}</span>
                        {t(`qb.calorieNote.${calorieStatus}` as never)}
                      </div>
                    )}
                    <input
                      value={routineName}
                      onChange={(e) => setRoutineName(e.target.value)}
                      className="mt-2 w-full bg-dark-muted border border-dark-border rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-neon-cyan/60"
                      placeholder={t('qb.routineName')}
                    />
                  </div>

                  {/* Day cards */}
                  {routine.days.map((day, dayIdx) => (
                    <Card key={dayIdx} className="py-3 px-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {t(`day.${day.dayOfWeek}` as never)} — {day.label}
                      </p>
                      <div className="divide-y divide-dark-border/30">
                        {day.exercises.map((ex, exIdx) => (
                          <ExerciseRow
                            key={exIdx}
                            ex={ex}
                            dayIdx={dayIdx}
                            exIdx={exIdx}
                            exercises={exercises}
                            equipmentLevel={config.equipmentLevel}
                            usedIds={usedIds}
                            swapKey={swapKey}
                            onSwapOpen={() => setSwapKey(`${dayIdx}-${exIdx}`)}
                            onSwapClose={() => setSwapKey(null)}
                            onSwap={(replacement) => swapExercise(dayIdx, exIdx, replacement)}
                          />
                        ))}
                      </div>
                    </Card>
                  ))}

                  {/* Volume analytics */}
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold px-1">
                      {t('qb.volumeAnalysis')}
                    </p>
                    <Card className="py-3 px-3">
                      <div className="space-y-1.5">
                        {Object.entries(routine.analytics)
                          .sort(([, a], [, b]) => b.sets - a.sets)
                          .map(([mg, vol]) => (
                            <div key={mg} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-24 shrink-0 truncate">
                                {t(`muscle.${mg}` as never)}
                              </span>
                              <div className="flex-1 h-1.5 bg-dark-muted rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', {
                                    'bg-neon-yellow': vol.status === 'low',
                                    'bg-neon-green':  vol.status === 'optimal',
                                    'bg-neon-red':    vol.status === 'high',
                                  })}
                                  style={{ width: `${Math.min(100, (vol.sets / 24) * 100)}%` }}
                                />
                              </div>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded border shrink-0', STATUS_COLORS[vol.status])}>
                                {vol.sets} {t('qb.vol.sets')} · {vol.frequency}{t('qb.vol.freq')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </Card>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-dark-border shrink-0">
          {step > 1 && !generating && (
            <NeonButton variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft size={14} /> {t('qb.back')}
            </NeonButton>
          )}
          <div className="flex-1" />
          {step < 5 && (
            <NeonButton variant="cyan" size="sm" onClick={handleNext}>
              {t('qb.next')} <ChevronRight size={14} />
            </NeonButton>
          )}
          {step === 5 && !generating && routine && (
            <NeonButton variant="green" size="sm" loading={saving} onClick={handleSave}>
              <Zap size={13} /> {saving ? t('qb.savingRoutine') : t('qb.saveRoutine')}
            </NeonButton>
          )}
        </div>
      </div>
    </div>
  );
}
