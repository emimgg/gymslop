'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MG_CONFIG, COLOR_STYLES } from '@/lib/muscleGroupConfig';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonSelect } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, ChevronLeft, GripVertical, Zap } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import toast from 'react-hot-toast';
import { computeDaySummary } from '@/lib/routineAnalytics';
import { TECHNIQUE_ORDER, TECHNIQUE_STYLES, type SetTechniqueKey } from '@/lib/techniques';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

interface ExerciseRow {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
  setTechniques: SetTechniqueKey[];
}

interface DayPlan {
  dayOfWeek: number;
  exercises: ExerciseRow[];
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

interface RoutineBuilderProps {
  initial?: {
    id?: string;
    name: string;
    days: { dayOfWeek: number; exercises: { exerciseId: string; order: number; targetSets: number; targetReps: number; targetWeight: number | null; setTechniques?: string[]; exercise: Exercise }[] }[];
  };
  onSaved: () => void;
  onCancel: () => void;
}

function ExercisePickerRow({
  ex, added, dot, label, onClick,
}: {
  ex: Exercise; added: boolean; dot: string; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={added}
      className={cn(
        'w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-sm',
        added
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-dark-hover cursor-pointer',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      <span className={cn('flex-1 truncate', added ? 'text-slate-500' : 'text-slate-200')}>{label}</span>
      {added && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neon-green shrink-0">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function SortableExerciseRow({
  id, ex, dow, idx, t, onUpdate, onUpdateTechniques, onRemove,
}: {
  id: string; ex: ExerciseRow; dow: number; idx: number;
  t: (k: string) => string;
  onUpdate: (dow: number, idx: number, field: keyof ExerciseRow, val: string | number | null) => void;
  onUpdateTechniques: (dow: number, idx: number, techniques: SetTechniqueKey[]) => void;
  onRemove: (dow: number, idx: number) => void;
}) {
  const [techPickerFor, setTechPickerFor] = useState<number | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasAnyTech = ex.setTechniques.some((k) => k !== 'NORMAL');

  return (
    <div ref={setNodeRef} style={style} className="p-2 rounded-lg bg-dark-muted border border-dark-border">
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="text-slate-600 hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          tabIndex={-1}
        >
          <GripVertical size={14} />
        </button>
        <span className="flex-1 text-sm text-slate-200 min-w-0 truncate">{t('ex.' + ex.exerciseName)}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={ex.targetSets}
            min={1}
            onChange={(e) => onUpdate(dow, idx, 'targetSets', parseInt(e.target.value))}
            className="w-12 text-center bg-dark-bg border border-dark-border rounded text-xs text-neon-green py-1"
            title={t('builder.sets')}
          />
          <span className="text-xs text-slate-500">{t('builder.sets')}</span>
          <button
            onClick={() => setTechPickerFor(techPickerFor != null ? null : 0)}
            className={cn(
              'transition-colors',
              hasAnyTech ? 'text-neon-yellow' : 'text-slate-600 hover:text-neon-yellow',
            )}
            title={t('tech.pickTitle')}
          >
            <Zap size={12} />
          </button>
          <button onClick={() => onRemove(dow, idx)} className="text-slate-600 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Per-set technique dots (always visible when any non-NORMAL) */}
      {(hasAnyTech || techPickerFor != null) && (
        <div className="mt-1.5 ml-5 space-y-1.5">
          {Array.from({ length: ex.targetSets }, (_, si) => {
            const tech = ex.setTechniques[si] ?? 'NORMAL';
            const techStyle = TECHNIQUE_STYLES[tech];
            const isOpen = techPickerFor === si;
            return (
              <div key={si}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-600 w-4 text-right shrink-0">{si + 1}</span>
                  <button
                    onClick={() => setTechPickerFor(isOpen ? null : si)}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border transition-all',
                      tech !== 'NORMAL' ? techStyle.badgeClass : 'border-dark-border text-slate-600 hover:border-slate-500 hover:text-slate-400',
                    )}
                  >
                    {tech !== 'NORMAL' ? t(techStyle.labelKey) : '+ ' + t('tech.pickTitle')}
                  </button>
                </div>
                {isOpen && (
                  <div className="mt-1 ml-5 p-2 rounded-lg bg-dark-bg border border-dark-border">
                    <div className="flex flex-wrap gap-1">
                      {TECHNIQUE_ORDER.map((key) => {
                        const style = TECHNIQUE_STYLES[key];
                        const isActive = tech === key;
                        return (
                          <button
                            key={key}
                            title={t(style.descKey)}
                            onClick={() => {
                              const updated = [...ex.setTechniques];
                              updated[si] = key;
                              onUpdateTechniques(dow, idx, updated);
                              setTechPickerFor(null);
                            }}
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full border transition-all',
                              isActive ? cn(style.badgeClass, 'ring-1 ring-current') : 'border-dark-border text-slate-400 hover:border-slate-400',
                            )}
                          >
                            {t(style.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RoutineBuilder({ initial, onSaved, onCancel }: RoutineBuilderProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? '');
  const [days, setDays] = useState<DayPlan[]>(
    initial?.days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      exercises: d.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exercise.name,
        muscleGroup: e.exercise.muscleGroup,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetWeight: e.targetWeight,
        setTechniques: e.setTechniques?.length
          ? (e.setTechniques as SetTechniqueKey[])
          : Array(e.targetSets).fill('NORMAL') as SetTechniqueKey[],
      })),
    })) ?? []
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [customEx, setCustomEx] = useState({ name: '', muscleGroup: 'CHEST', equipment: 'BARBELL' });
  const [creatingCustom, setCreatingCustom] = useState(false);

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
  });

  const addedExerciseIds = useMemo(
    () => new Set(days.find((d) => d.dayOfWeek === selectedDay)?.exercises.map((e) => e.exerciseId) ?? []),
    [days, selectedDay]
  );

  const isSearching = exSearch.trim().length > 0;

  const filtered = useMemo(() => {
    const all = exercises ?? [];
    const q = exSearch.toLowerCase().trim();
    return q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all;
  }, [exercises, exSearch]);

  const grouped = useMemo(() => {
    if (isSearching) return null;
    const map: Record<string, typeof filtered> = {};
    for (const ex of filtered) {
      if (!map[ex.muscleGroup]) map[ex.muscleGroup] = [];
      map[ex.muscleGroup].push(ex);
    }
    for (const mg in map) map[mg].sort((a, b) => a.name.localeCompare(b.name));
    return Object.entries(map).sort(([a], [b]) => (MG_CONFIG[a]?.order ?? 99) - (MG_CONFIG[b]?.order ?? 99));
  }, [filtered, isSearching]);

  function toggleDay(dow: number) {
    const existing = days.find((d) => d.dayOfWeek === dow);
    if (existing) {
      if (confirm(t('builder.removeDay', { day: t(`dayFull.${dow}`) }))) {
        setDays(days.filter((d) => d.dayOfWeek !== dow));
        if (selectedDay === dow) setSelectedDay(null);
      }
    } else {
      setDays([...days, { dayOfWeek: dow, exercises: [] }]);
      setSelectedDay(dow);
    }
  }

  function addExercise(exercise: Exercise) {
    if (selectedDay == null) return;
    setDays(
      days.map((d) =>
        d.dayOfWeek === selectedDay
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                { exerciseId: exercise.id, exerciseName: exercise.name, muscleGroup: exercise.muscleGroup, targetSets: 3, targetReps: 10, targetWeight: null, setTechniques: Array(3).fill('NORMAL') as SetTechniqueKey[] },
              ],
            }
          : d
      )
    );
    setShowAddExercise(false);
    setExSearch('');
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || selectedDay == null) return;
    setDays(days.map((d) => {
      if (d.dayOfWeek !== selectedDay) return d;
      const oldIdx = d.exercises.findIndex((_, i) => `${selectedDay}-${i}` === active.id);
      const newIdx = d.exercises.findIndex((_, i) => `${selectedDay}-${i}` === over.id);
      return { ...d, exercises: arrayMove(d.exercises, oldIdx, newIdx) };
    }));
  }

  function removeExercise(dow: number, idx: number) {
    setDays(
      days.map((d) =>
        d.dayOfWeek === dow ? { ...d, exercises: d.exercises.filter((_, i) => i !== idx) } : d
      )
    );
  }

  function updateExercise(dow: number, idx: number, field: keyof ExerciseRow, value: string | number | null) {
    setDays(
      days.map((d) =>
        d.dayOfWeek === dow
          ? {
              ...d,
              exercises: d.exercises.map((e, i) => {
                if (i !== idx) return e;
                const updated = { ...e, [field]: value };
                if (field === 'targetSets' && typeof value === 'number') {
                  const cur = e.setTechniques;
                  updated.setTechniques = value > cur.length
                    ? [...cur, ...Array(value - cur.length).fill('NORMAL')]
                    : cur.slice(0, value);
                }
                return updated;
              }),
            }
          : d
      )
    );
  }

  function updateExerciseTechniques(dow: number, idx: number, techniques: SetTechniqueKey[]) {
    setDays(
      days.map((d) =>
        d.dayOfWeek === dow
          ? { ...d, exercises: d.exercises.map((e, i) => (i === idx ? { ...e, setTechniques: techniques } : e)) }
          : d
      )
    );
  }

  async function createCustomExercise() {
    if (!customEx.name) return;
    setCreatingCustom(true);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customEx),
      });
      const ex = await res.json();
      addExercise(ex);
      setShowCustomExercise(false);
      setCustomEx({ name: '', muscleGroup: 'CHEST', equipment: 'BARBELL' });
      toast.success(t('builder.customCreatedToast'));
    } finally {
      setCreatingCustom(false);
    }
  }

  async function save() {
    if (!name.trim()) { toast.error(t('builder.needsName')); return; }
    setSaving(true);
    try {
      const body = {
        name,
        days: days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          exercises: d.exercises.map((e, i) => ({
            exerciseId: e.exerciseId,
            order: i,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            targetWeight: e.targetWeight,
            setTechniques: e.setTechniques,
          })),
        })),
      };

      const url = initial?.id ? `/api/routines/${initial.id}` : '/api/routines';
      const method = initial?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) { toast.error(t('builder.failedSave')); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const currentDay = days.find((d) => d.dayOfWeek === selectedDay);

  const muscleGroups = ['CHEST','BACK','SHOULDERS','BICEPS','TRICEPS','FOREARMS','CORE','QUADS','HAMSTRINGS','GLUTES','CALVES','FULL_BODY','CARDIO'];
  const equipmentTypes = ['BARBELL','DUMBBELL','CABLE','MACHINE','BODYWEIGHT','KETTLEBELL','BANDS','OTHER'];

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-bold text-slate-100">{initial?.id ? t('builder.editRoutine') : t('builder.newRoutine')}</h2>
      </div>

      {/* Name */}
      <NeonInput
        label={t('builder.routineName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('builder.namePlaceholder')}
      />

      {/* Day selector */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t('builder.days')}</p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((dow) => {
            const active = days.some((d) => d.dayOfWeek === dow);
            const selected = selectedDay === dow;
            return (
              <button
                key={dow}
                onClick={() => {
                  if (active) setSelectedDay(dow);
                  else toggleDay(dow);
                }}
                onDoubleClick={() => active && toggleDay(dow)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
                    : active
                    ? 'bg-dark-muted border-dark-border text-slate-300 hover:border-slate-500'
                    : 'border-dashed border-dark-border text-slate-600 hover:border-slate-500 hover:text-slate-400'
                }`}
              >
                {t(`dayFull.${dow}`).slice(0, 3)}
                {active && <span className="ml-1 text-slate-500">({days.find((d) => d.dayOfWeek === dow)?.exercises.length ?? 0})</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-600 mt-1">{t('builder.dayHint')}</p>
      </div>

      {/* Selected day exercises */}
      {selectedDay != null && currentDay && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-200">{t(`dayFull.${selectedDay}`)}</h3>
            <NeonButton variant="cyan" size="sm" onClick={() => setShowAddExercise(true)}>
              <Plus size={12} /> {t('builder.addExercise')}
            </NeonButton>
          </div>
          {/* Per-day summary */}
          {currentDay.exercises.length > 0 && (() => {
            const summary = computeDaySummary(
              currentDay.exercises.map((e) => ({ muscleGroup: e.muscleGroup, sets: e.targetSets }))
            );
            return (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] text-slate-500">
                <span>{summary.totalSets} {t('analytics.setsAbbr')}</span>
                <span>~{summary.estDurationMin} min</span>
                <div className="flex gap-1 flex-wrap">
                  {summary.muscles.map((mg) => {
                    const cfg = MG_CONFIG[mg];
                    const styles = cfg ? COLOR_STYLES[cfg.color] : null;
                    return (
                      <span key={mg} className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', styles?.badge ?? 'border-dark-border text-slate-500')}>
                        {t(cfg?.labelKey ?? 'muscle.' + mg)}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })()}


          {currentDay.exercises.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">{t('builder.noExercisesYet')}</p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={currentDay.exercises.map((_, i) => `${selectedDay}-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {currentDay.exercises.map((ex, idx) => (
                  <SortableExerciseRow
                    key={`${selectedDay}-${idx}`}
                    id={`${selectedDay}-${idx}`}
                    ex={ex}
                    dow={selectedDay}
                    idx={idx}
                    t={t}
                    onUpdate={updateExercise}
                    onUpdateTechniques={updateExerciseTechniques}
                    onRemove={removeExercise}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </Card>
      )}

      {/* Save button */}
      <div className="flex gap-2">
        <NeonButton variant="ghost" onClick={onCancel}>{t('builder.cancel')}</NeonButton>
        <NeonButton variant="green" loading={saving} onClick={save} className="flex-1">
          {t('builder.saveRoutine')}
        </NeonButton>
      </div>

      {/* Add exercise modal */}
      <Modal open={showAddExercise} onClose={() => { setShowAddExercise(false); setExSearch(''); }} title={t('builder.addExerciseTitle')}>
        <div className="space-y-3">
          <NeonInput
            placeholder={t('builder.searchPlaceholder')}
            value={exSearch}
            onChange={(e) => setExSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto">
            {isSearching ? (
              /* Flat search results */
              <div className="space-y-0.5">
                {filtered.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">{t('builder.noExercisesFound')}</p>
                )}
                {[...filtered].sort((a, b) => a.name.localeCompare(b.name)).map((ex) => {
                  const cfg = MG_CONFIG[ex.muscleGroup];
                  const styles = cfg ? COLOR_STYLES[cfg.color] : null;
                  const added = addedExerciseIds.has(ex.id);
                  return (
                    <ExercisePickerRow
                      key={ex.id} ex={ex} added={added}
                      dot={styles?.dot ?? 'bg-slate-600'}
                      label={t('ex.' + ex.name)}
                      onClick={() => !added && addExercise(ex)}
                    />
                  );
                })}
              </div>
            ) : (
              /* Grouped view */
              <div className="space-y-3">
                {grouped?.map(([mg, exes]) => {
                  const cfg = MG_CONFIG[mg];
                  const styles = cfg ? COLOR_STYLES[cfg.color] : null;
                  const Icon = cfg?.Icon;
                  return (
                    <div key={mg}>
                      <div className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5', styles?.headerBg ?? 'bg-dark-hover')}>
                        {Icon && <Icon size={12} className={styles?.text ?? 'text-slate-400'} />}
                        <span className={cn('text-[11px] font-bold uppercase tracking-wider', styles?.text ?? 'text-slate-400')}>
                          {t(cfg?.labelKey ?? 'muscle.' + mg)}
                        </span>
                        <span className={cn('ml-auto text-[10px] px-1.5 py-0.5 rounded-full border font-medium', styles?.badge ?? 'border-dark-border text-slate-500')}>
                          {exes.length}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {exes.map((ex) => {
                          const added = addedExerciseIds.has(ex.id);
                          return (
                            <ExercisePickerRow
                              key={ex.id} ex={ex} added={added}
                              dot={styles?.dot ?? 'bg-slate-600'}
                              label={t('ex.' + ex.name)}
                              onClick={() => !added && addExercise(ex)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="border-t border-dark-border pt-3">
            <NeonButton variant="cyan" size="sm" onClick={() => { setShowAddExercise(false); setShowCustomExercise(true); }}>
              <Plus size={12} /> {t('builder.createCustom')}
            </NeonButton>
          </div>
        </div>
      </Modal>

      {/* Custom exercise modal */}
      <Modal open={showCustomExercise} onClose={() => setShowCustomExercise(false)} title={t('builder.customExerciseTitle')}>
        <div className="space-y-3">
          <NeonInput label={t('builder.exerciseName')} value={customEx.name} onChange={(e) => setCustomEx({ ...customEx, name: e.target.value })} placeholder={t('builder.customExercisePlaceholder')} />
          <NeonSelect label={t('builder.muscleGroup')} value={customEx.muscleGroup} onChange={(e) => setCustomEx({ ...customEx, muscleGroup: e.target.value })}>
            {muscleGroups.map((mg) => <option key={mg} value={mg}>{t(`muscle.${mg}`)}</option>)}
          </NeonSelect>
          <NeonSelect label={t('builder.equipment')} value={customEx.equipment} onChange={(e) => setCustomEx({ ...customEx, equipment: e.target.value })}>
            {equipmentTypes.map((eq) => <option key={eq} value={eq}>{t('equip.' + eq)}</option>)}
          </NeonSelect>
          <NeonButton variant="green" loading={creatingCustom} onClick={createCustomExercise} className="w-full">
            {t('builder.createExercise')}
          </NeonButton>
        </div>
      </Modal>
    </div>
  );
}
