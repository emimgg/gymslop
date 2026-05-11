'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { Modal } from '@/components/ui/Modal';
import { NeonInput } from '@/components/ui/NeonInput';
import { Trophy, Timer, Check, X, Flame, Plus, Zap, Settings2 } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import { cn } from '@/lib/utils';
import { TECHNIQUE_ORDER, TECHNIQUE_STYLES, type SetTechniqueKey } from '@/lib/techniques';
import { useWorkoutStore, type WorkoutSetEntry, type WorkoutExercise } from '@/lib/workoutStore';
import { useAdvancedView, useRestTimerPrefs } from '@/lib/useAdvancedView';
import { EXERCISE_META } from '@/lib/exerciseMetadata';
import toast from 'react-hot-toast';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

interface WorkoutSessionProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function WorkoutSession({ onComplete, onCancel }: WorkoutSessionProps) {
  const { t } = useI18n();
  const { activeWorkout, updateWorkoutState, minimizeWorkout, clearWorkout } = useWorkoutStore();
  const advancedView = useAdvancedView();
  const restTimerPrefs = useRestTimerPrefs();

  const [exercises, setExercises] = useState<WorkoutExercise[]>(activeWorkout?.exercises ?? []);
  const [sets, setSets] = useState<Record<string, WorkoutSetEntry[]>>(activeWorkout?.sets ?? {});
  const [elapsed, setElapsed] = useState(
    activeWorkout ? Math.floor((Date.now() - activeWorkout.startedAt) / 1000) : 0
  );
  const [restCountdown, setRestCountdown] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [showResult, setShowResult] = useState<{ xpEarned: number; prCount: number; newTrophies: string[] } | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [showNavGuard, setShowNavGuard] = useState(false);

  const { data: allExercises } = useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
    enabled: showAddExercise,
  });

  // Elapsed timer (continues from stored startedAt)
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Rest countdown
  useEffect(() => {
    if (restCountdown <= 0) return;
    const id = setTimeout(() => setRestCountdown((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [restCountdown]);

  // Sync exercises+sets to store whenever they change
  useEffect(() => {
    updateWorkoutState(exercises, sets);
  }, [exercises, sets]); // eslint-disable-line react-hooks/exhaustive-deps

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function toggleSet(exerciseId: string, setIdx: number) {
    const wasDone = sets[exerciseId][setIdx].done;
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? { ...s, done: !s.done } : s),
    }));
    if (!wasDone) {
      const ex = exercises.find((e) => e.exerciseId === exerciseId);
      const meta = ex ? EXERCISE_META[ex.exercise.name] : null;
      const duration = meta?.movementType === 'Compound'
        ? restTimerPrefs.compound
        : restTimerPrefs.isolation;
      setRestCountdown(duration);
    }
  }

  function updateSet(exerciseId: string, setIdx: number, field: 'reps' | 'weight', value: number) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? { ...s, [field]: value } : s),
    }));
  }

  function updateAttachedTechnique(exerciseId: string, setIdx: number, technique: SetTechniqueKey) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) =>
        i === setIdx
          ? { ...s, technique: 'NORMAL', attachedTechnique: technique === 'NORMAL' ? undefined : technique }
          : s
      ),
    }));
  }

  function updateActualRIR(exerciseId: string, setIdx: number, val: number | undefined) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? { ...s, actualRIR: val } : s),
    }));
  }

  function updateSide(exerciseId: string, setIdx: number, side: 'LEFT' | 'RIGHT' | null) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? { ...s, side } : s),
    }));
  }

  function updateActualRPE(exerciseId: string, setIdx: number, val: number | undefined) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? { ...s, actualRPE: val } : s),
    }));
  }

  function updateTempo(exerciseId: string, setIdx: number, tempo: string) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? { ...s, tempo } : s),
    }));
  }

  function addSet(exerciseId: string) {
    setSets((prev) => {
      const current = prev[exerciseId] ?? [];
      const last = current[current.length - 1];
      return {
        ...prev,
        [exerciseId]: [
          ...current,
          { setNumber: current.length + 1, reps: last?.reps ?? 10, weight: last?.weight ?? 0, done: false, technique: 'NORMAL', attachedTechnique: undefined, tempo: '' },
        ],
      };
    });
  }

  function removeSet(exerciseId: string, setIdx: number) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId]
        .filter((_, i) => i !== setIdx)
        .map((s, i) => ({ ...s, setNumber: i + 1 })),
    }));
  }

  function addExerciseToSession(ex: Exercise) {
    const re: WorkoutExercise = { exerciseId: ex.id, targetSets: 3, targetReps: 10, targetWeight: null, exercise: ex };
    setExercises((prev) => [...prev, re]);
    setSets((prev) => ({
      ...prev,
      [ex.id]: Array.from({ length: 3 }, (_, i) => ({
        setNumber: i + 1, reps: 10, weight: 0, done: false, technique: 'NORMAL', attachedTechnique: undefined, tempo: '',
      })),
    }));
    setShowAddExercise(false);
    setExSearch('');
  }

  async function completeWorkout() {
    setCompleting(true);
    try {
      const allSets = exercises.flatMap((re) =>
        (sets[re.exerciseId] ?? [])
          .filter((s) => s.done)
          .map((s) => ({
            exerciseId: re.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            isWarmup: false,
            technique: 'NORMAL',
            attachedTechnique: s.attachedTechnique ?? null,
            side: s.side ?? null,
            tempo: s.tempo || null,
            targetRIR: s.targetRIR ?? null,
            targetRPE: s.targetRPE ?? null,
            actualRIR: s.actualRIR ?? null,
            actualRPE: s.actualRPE ?? null,
          }))
      );

      if (allSets.length === 0) {
        toast.error(t('session.noSetsError'));
        setCompleting(false);
        return;
      }

      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineId: activeWorkout?.routine.id || null, sets: allSets }),
      });

      const data = await res.json();
      setShowResult(data);
    } finally {
      setCompleting(false);
    }
  }

  function handleDiscard() {
    clearWorkout();
    onCancel();
  }

  const totalSets = Object.values(sets).flat().length;
  const doneSets = Object.values(sets).flat().filter((s) => s.done).length;
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;
  const filteredExercises = allExercises?.filter((e) =>
    (e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
      t('ex.' + e.name).toLowerCase().includes(exSearch.toLowerCase())) &&
    !exercises.some((ex) => ex.exerciseId === e.id)
  ) ?? [];

  return (
    <div className="fixed inset-0 z-[100] bg-dark-bg overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-32">
        {/* Header — sticky, two rows on mobile when rest active */}
        <div className="sticky top-0 bg-dark-bg z-10 border-b border-dark-border py-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-100 truncate">{activeWorkout?.routine.name}</h2>
              <p className="text-xs text-slate-500">{t('session.setsDone', { done: doneSets, total: totalSets })}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-neon-cyan font-mono text-sm">
                <Timer size={13} />
                <span>{formatTime(elapsed)}</span>
              </div>
              <button
                onClick={() => setShowNavGuard(true)}
                className="text-slate-500 hover:text-red-400 transition-colors p-2 -mr-2"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {restCountdown > 0 && (
            <div className="flex items-center justify-end gap-1 mt-2">
              <button
                onClick={() => setRestCountdown((r) => Math.max(0, r - 15))}
                className="text-[11px] text-slate-500 hover:text-neon-yellow transition-colors px-2 py-1 rounded"
              >
                {t('session.restSub')}
              </button>
              <div className="flex items-center gap-1 text-neon-yellow text-sm font-mono px-2 py-1 rounded border border-neon-yellow/30 bg-neon-yellow/10">
                <Flame size={12} />
                {formatTime(restCountdown)}
              </div>
              <button
                onClick={() => setRestCountdown((r) => r + 15)}
                className="text-[11px] text-slate-500 hover:text-neon-yellow transition-colors px-2 py-1 rounded"
              >
                {t('session.restAdd')}
              </button>
              <button
                onClick={() => setRestCountdown(0)}
                className="text-slate-600 hover:text-slate-300 transition-colors p-1"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-dark-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-300 rounded-full"
            style={{ width: `${progress}%`, boxShadow: progress > 0 ? '0 0 6px #39ff14' : 'none' }}
          />
        </div>

        {/* Exercise cards */}
        <div className="space-y-4">
          {exercises.map((re) => (
            <ExerciseCard
              key={re.exerciseId}
              exercise={re.exercise}
              targetRIR={re.targetRIR}
              targetRPE={re.targetRPE}
              isUnilateral={re.isUnilateral}
              sets={sets[re.exerciseId] ?? []}
              advancedView={advancedView}
              onToggle={(i) => toggleSet(re.exerciseId, i)}
              onUpdate={(i, f, v) => updateSet(re.exerciseId, i, f, v)}
              onAddSet={() => addSet(re.exerciseId)}
              onRemoveSet={(i) => removeSet(re.exerciseId, i)}
              onUpdateTechnique={(i, tech) => updateAttachedTechnique(re.exerciseId, i, tech)}
              onUpdateTempo={(i, tempo) => updateTempo(re.exerciseId, i, tempo)}
              onUpdateActualRIR={(i, val) => updateActualRIR(re.exerciseId, i, val)}
              onUpdateActualRPE={(i, val) => updateActualRPE(re.exerciseId, i, val)}
              onUpdateSide={(i, side) => updateSide(re.exerciseId, i, side)}
            />
          ))}
        </div>

        <div className="mt-4">
          <NeonButton variant="ghost" className="w-full" onClick={() => setShowAddExercise(true)}>
            <Plus size={14} /> {t('session.addExercise')}
          </NeonButton>
        </div>

        <div className="mt-4">
          <NeonButton variant="green" size="lg" className="w-full" loading={completing} onClick={completeWorkout}>
            <Check size={16} /> {t('session.completeWorkout')}
          </NeonButton>
        </div>
      </div>

      {/* Nav guard dialog (z-[110] to stack above the z-[100] workout overlay) */}
      <Modal open={showNavGuard} onClose={() => setShowNavGuard(false)} title={t('workout.navGuardTitle')} zClass="z-[110]">
        <p className="text-sm text-slate-400 mb-4">{t('workout.navGuardMessage')}</p>
        <div className="flex flex-col gap-2">
          <NeonButton variant="cyan" className="w-full" onClick={() => { minimizeWorkout(); setShowNavGuard(false); }}>
            {t('workout.minimize')}
          </NeonButton>
          <NeonButton variant="danger" className="w-full" onClick={handleDiscard}>
            {t('workout.discard')}
          </NeonButton>
          <NeonButton variant="ghost" className="w-full" onClick={() => setShowNavGuard(false)}>
            {t('workout.cancel')}
          </NeonButton>
        </div>
      </Modal>

      {/* Result modal */}
      <Modal open={!!showResult} onClose={() => { setShowResult(null); clearWorkout(); onComplete(); }} title={t('session.workoutCompleteTitle')} zClass="z-[110]">
        {showResult && (
          <div className="text-center space-y-4">
            <p className="text-4xl">🎉</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/30">
                <p className="text-2xl font-black text-neon-green">+{showResult.xpEarned}</p>
                <p className="text-xs text-slate-400">{t('session.xpEarned')}</p>
              </div>
              <div className="p-4 rounded-xl bg-neon-yellow/10 border border-neon-yellow/30">
                <p className="text-2xl font-black text-neon-yellow">{showResult.prCount}</p>
                <p className="text-xs text-slate-400">{t('session.newPrs')}</p>
              </div>
            </div>
            {showResult.newTrophies.length > 0 && (
              <div className="p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/30">
                <p className="text-xs text-neon-purple mb-1">{t('session.trophiesUnlocked')}</p>
                <p className="text-sm text-slate-200">{showResult.newTrophies.join(', ')}</p>
              </div>
            )}
            <p className="text-xs text-slate-500">{t('session.duration')}: {formatTime(elapsed)}</p>
            <NeonButton variant="green" className="w-full" onClick={() => { setShowResult(null); clearWorkout(); onComplete(); }}>
              {t('session.awesome')}
            </NeonButton>
          </div>
        )}
      </Modal>

      {/* Add exercise modal */}
      <Modal open={showAddExercise} onClose={() => { setShowAddExercise(false); setExSearch(''); }} title={t('session.addExerciseTitle')} zClass="z-[110]">
        <div className="space-y-3">
          <NeonInput
            placeholder={t('session.searchPlaceholder')}
            value={exSearch}
            onChange={(e) => setExSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExerciseToSession(ex)}
                className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-dark-hover border border-transparent hover:border-dark-border transition-colors text-sm"
              >
                <span className="text-slate-200">{t('ex.' + ex.name)}</span>
                <span className="text-xs text-slate-500">{t('muscle.' + ex.muscleGroup)}</span>
              </button>
            ))}
            {filteredExercises.length === 0 && exSearch && (
              <p className="text-slate-500 text-sm text-center py-4">{t('session.noExercisesFound')}</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── ExerciseCard ────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise, sets, targetRIR, targetRPE, advancedView, isUnilateral,
  onToggle, onUpdate, onAddSet, onRemoveSet, onUpdateTechnique, onUpdateTempo,
  onUpdateActualRIR, onUpdateActualRPE, onUpdateSide,
}: {
  exercise: { id: string; name: string; muscleGroup: string };
  sets: WorkoutSetEntry[];
  targetRIR?: number | null;
  targetRPE?: number | null;
  advancedView: boolean;
  isUnilateral?: boolean;
  onToggle: (i: number) => void;
  onUpdate: (i: number, field: 'reps' | 'weight', value: number) => void;
  onAddSet: () => void;
  onRemoveSet: (i: number) => void;
  onUpdateTechnique: (i: number, technique: SetTechniqueKey) => void;
  onUpdateTempo: (i: number, tempo: string) => void;
  onUpdateActualRIR: (i: number, val: number | undefined) => void;
  onUpdateActualRPE: (i: number, val: number | undefined) => void;
  onUpdateSide: (i: number, side: 'LEFT' | 'RIGHT' | null) => void;
}) {
  const { t } = useI18n();
  const [techniquePickerFor, setTechniquePickerFor] = useState<number | null>(null);
  const [showAdvancedFor, setShowAdvancedFor] = useState<Set<number>>(new Set());

  const weekday = new Date().getDay();

  const { data: history } = useQuery<{
    lastSets: { setNumber: number; reps: number; weight: number; technique?: string; attachedTechnique?: string | null }[];
    pr: { reps: number; weight: number } | null;
  }>({
    queryKey: ['exercise-history', exercise.id, weekday],
    queryFn: () =>
      fetch(`/api/workouts/history?exerciseId=${exercise.id}&weekday=${weekday}`).then((r) => r.json()),
  });

  const doneSets = sets.filter((s) => s.done).length;

  function toggleAdvanced(i: number) {
    setShowAdvancedFor((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <Card neon={doneSets === sets.length && sets.length > 0 ? 'green' : null}>
      {/* Card header */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-200">{t('ex.' + exercise.name)}</h3>
              {isUnilateral && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan font-semibold shrink-0">
                  {t('unilateral.badge')}
                </span>
              )}
            </div>
            {advancedView && (targetRIR != null || targetRPE != null) && (
              <p className="text-[10px] text-neon-purple mt-0.5">
                {targetRIR != null && t('rir.target', { n: targetRIR })}
                {targetRIR != null && targetRPE != null && ' · '}
                {targetRPE != null && t('rpe.target', { n: targetRPE })}
              </p>
            )}
            {history?.pr && (
              <span className="flex items-center gap-1 text-xs text-neon-yellow mt-1">
                <Trophy size={10} />
                PR {history.pr.weight}kg × {history.pr.reps}
                <span className="text-[9px] text-slate-500 font-normal">· {t('session.thisDayScope')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Last workout preview */}
      {history?.lastSets && history.lastSets.length > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-dark-bg/60 border border-dark-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('session.lastWorkout')}</p>
            <span className="text-[9px] text-slate-600">· {t('session.thisDayScope')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.lastSets.map((s) => {
              const techKey = s.attachedTechnique || (s.technique && s.technique !== 'NORMAL' ? s.technique : null);
              const techStyle = techKey ? TECHNIQUE_STYLES[techKey as SetTechniqueKey] : null;
              return (
                <span key={s.setNumber} className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="text-slate-600">{s.setNumber}.</span>
                  {s.weight}kg × {s.reps}
                  {techKey && techStyle && (
                    <span className={cn('text-[9px] px-1 py-0.5 rounded-full border', techStyle.badgeClass)}>
                      + {t(techStyle.labelKey)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {history && history.lastSets.length === 0 && (
        <div className="mb-3 p-2 rounded-lg bg-dark-bg/60 border border-dark-border border-dashed">
          <p className="text-[10px] text-slate-600 italic">{t('session.noPrevRecord')}</p>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_1fr_44px_44px] gap-2 text-[10px] text-slate-500 uppercase tracking-wider mb-1 px-1">
        <span className="text-center">#</span>
        <span className="text-center">{t('session.reps')}</span>
        <span className="text-center">kg</span>
        <span className="flex justify-center"><Zap size={9} /></span>
        <span></span>
      </div>

      {/* Set rows */}
      <div className="space-y-1.5">
        {sets.map((s, i) => {
          const attachedTech = s.attachedTechnique as SetTechniqueKey | undefined;
          const attachedStyle = attachedTech && attachedTech !== 'NORMAL' ? TECHNIQUE_STYLES[attachedTech] : null;
          const isPickerOpen = techniquePickerFor === i;
          const isAdvancedOpen = showAdvancedFor.has(i);

          return (
            <div key={i} className="space-y-1">
              {/* Technique badge above row */}
              {attachedStyle && !isPickerOpen && (
                <div className="px-1">
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold inline-flex', attachedStyle.badgeClass)}>
                    + {t(attachedStyle.labelKey)}
                  </span>
                </div>
              )}

              {/* Main set row */}
              <div
                className={cn(
                  'grid grid-cols-[28px_1fr_1fr_44px_44px] gap-2 items-center px-1 py-1 rounded-xl transition-colors',
                  s.done ? 'bg-neon-green/10' : (attachedStyle?.rowBg || 'bg-dark-muted'),
                  attachedStyle?.rowBorder,
                )}
              >
                <span className="text-xs text-slate-500 text-center">{s.setNumber}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.reps || ''}
                  min={0}
                  placeholder="—"
                  onChange={(e) => onUpdate(i, 'reps', parseInt(e.target.value) || 0)}
                  className="w-full h-11 text-center bg-dark-bg border border-dark-border rounded-lg text-base text-neon-cyan focus:outline-none focus:border-neon-cyan/50"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={s.weight || ''}
                  min={0}
                  step={0.5}
                  placeholder="—"
                  onChange={(e) => onUpdate(i, 'weight', parseFloat(e.target.value) || 0)}
                  className="w-full h-11 text-center bg-dark-bg border border-dark-border rounded-lg text-base text-neon-green focus:outline-none focus:border-neon-green/50"
                />
                <button
                  onClick={() => setTechniquePickerFor(isPickerOpen ? null : i)}
                  title={t('tech.attachTitle')}
                  className={cn(
                    'h-11 w-11 flex items-center justify-center rounded-lg transition-colors',
                    attachedStyle
                      ? attachedStyle.badgeClass
                      : isPickerOpen
                      ? 'text-neon-yellow bg-neon-yellow/10 border border-neon-yellow/30'
                      : 'text-slate-600 hover:text-neon-yellow bg-dark-bg border border-dark-border',
                  )}
                >
                  <Zap size={14} />
                </button>
                <button
                  onClick={() => onToggle(i)}
                  className={cn(
                    'h-11 w-11 rounded-full border flex items-center justify-center transition-all',
                    s.done
                      ? 'bg-neon-green border-neon-green text-dark-bg'
                      : 'border-dark-border text-slate-600 hover:border-neon-green/50 hover:text-neon-green bg-dark-bg',
                  )}
                >
                  <Check size={14} />
                </button>
              </div>

              {/* Tempo input (TEMPO technique) */}
              {attachedTech === 'TEMPO' && !isPickerOpen && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-neon-yellow shrink-0">{t('tech.tempoLabel')}:</span>
                  <input
                    type="text"
                    placeholder={t('tech.tempoPlaceholder')}
                    value={s.tempo}
                    onChange={(e) => onUpdateTempo(i, e.target.value)}
                    className="flex-1 h-9 text-xs bg-dark-bg border border-neon-yellow/30 rounded-lg px-3 text-neon-yellow focus:outline-none focus:border-neon-yellow/60 font-mono"
                  />
                </div>
              )}

              {/* Unilateral side selector */}
              {isUnilateral && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-slate-500 shrink-0">{t('unilateral.sideLabel')}:</span>
                  {(['LEFT', 'RIGHT', null] as const).map((side) => (
                    <button
                      key={String(side)}
                      onClick={() => onUpdateSide(i, side)}
                      className={cn(
                        'text-xs px-3 py-2 rounded-lg border transition-all',
                        s.side === side
                          ? side === 'LEFT'
                            ? 'border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan'
                            : side === 'RIGHT'
                            ? 'border-neon-green/60 bg-neon-green/15 text-neon-green'
                            : 'border-slate-500 bg-dark-muted text-slate-300'
                          : 'border-dark-border text-slate-600 hover:border-slate-500 hover:text-slate-400',
                      )}
                    >
                      {side === 'LEFT' ? t('unilateral.left') : side === 'RIGHT' ? t('unilateral.right') : t('unilateral.both')}
                    </button>
                  ))}
                </div>
              )}

              {/* Advanced: RIR/RPE behind ⚙ gear (only after set is done) */}
              {advancedView && s.done && (
                <div className="px-1">
                  <button
                    onClick={() => toggleAdvanced(i)}
                    className={cn(
                      'flex items-center gap-1.5 text-[10px] transition-colors',
                      isAdvancedOpen ? 'text-neon-purple' : 'text-slate-600 hover:text-slate-400',
                    )}
                  >
                    <Settings2 size={11} />
                    RIR / RPE
                  </button>
                  {isAdvancedOpen && (
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-slate-600">RIR</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0} max={5}
                        placeholder="—"
                        value={s.actualRIR ?? ''}
                        onChange={(e) => onUpdateActualRIR(i, e.target.value === '' ? undefined : parseInt(e.target.value))}
                        className="w-14 h-9 text-center bg-dark-bg border border-dark-border rounded-lg text-sm text-neon-purple focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-600">RPE</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={6} max={10}
                        placeholder="—"
                        value={s.actualRPE ?? ''}
                        onChange={(e) => onUpdateActualRPE(i, e.target.value === '' ? undefined : parseInt(e.target.value))}
                        className="w-14 h-9 text-center bg-dark-bg border border-dark-border rounded-lg text-sm text-neon-pink focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Technique picker */}
              {isPickerOpen && (
                <div className="p-3 rounded-xl bg-dark-bg border border-dark-border">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t('tech.attachTitle')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TECHNIQUE_ORDER.map((key) => {
                      const style = TECHNIQUE_STYLES[key];
                      const isActive = (s.attachedTechnique ?? 'NORMAL') === key;
                      return (
                        <button
                          key={key}
                          onClick={() => { onUpdateTechnique(i, key); setTechniquePickerFor(null); }}
                          title={t(style.descKey)}
                          className={cn(
                            'text-xs px-3 py-1.5 rounded-full border transition-all',
                            isActive
                              ? cn(style.badgeClass, 'ring-1 ring-current')
                              : 'border-dark-border text-slate-400 hover:border-slate-400 hover:text-slate-200',
                          )}
                        >
                          {t(style.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                  {s.attachedTechnique === 'TEMPO' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dark-border">
                      <span className="text-[10px] text-neon-yellow shrink-0">{t('tech.tempoLabel')}:</span>
                      <input
                        type="text"
                        placeholder={t('tech.tempoPlaceholder')}
                        value={s.tempo}
                        onChange={(e) => onUpdateTempo(i, e.target.value)}
                        className="flex-1 text-xs bg-dark-muted border border-neon-yellow/30 rounded-lg px-2 py-1.5 text-neon-yellow focus:outline-none focus:border-neon-yellow/60 font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Remove set buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAddSet}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dark-border text-sm text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors"
        >
          <Plus size={13} /> {t('session.addSet')}
        </button>
        {sets.length > 1 && (
          <button
            onClick={() => onRemoveSet(sets.length - 1)}
            className="px-4 py-3 rounded-xl border border-dark-border text-sm text-slate-600 hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            {t('session.removeLast')}
          </button>
        )}
      </div>
    </Card>
  );
}
