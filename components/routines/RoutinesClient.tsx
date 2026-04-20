'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { RoutineBuilder } from './RoutineBuilder';
import { WorkoutSession } from './WorkoutSession';
import { VolumeAnalytics } from './VolumeAnalytics';
import { QuickBuilder } from './QuickBuilder';
import { Plus, Play, Pencil, Trash2, ChevronLeft, ChevronDown, Zap, Dumbbell, ListChecks, BookOpen } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import { ExerciseDatabase } from './ExerciseDatabase';
import { cn } from '@/lib/utils';
import { MG_CONFIG, COLOR_STYLES } from '@/lib/muscleGroupConfig';
import { computeDaySummary } from '@/lib/routineAnalytics';
import type { AnalyticsDay } from '@/lib/routineAnalytics';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────

interface Exercise { id: string; name: string; muscleGroup: string; equipment: string; }
interface RoutineExercise {
  id: string; exerciseId: string; order: number;
  targetSets: number; targetReps: number; targetWeight: number | null;
  exercise: Exercise;
}
interface RoutineDay { id: string; dayOfWeek: number; exercises: RoutineExercise[]; }
interface Routine { id: string; name: string; days: RoutineDay[]; }

interface TemplateExercise {
  id: string; exerciseId: string; sets: number; repsDisplay: string; order: number;
  exercise: Exercise;
}
interface TemplateDay { id: string; dayOfWeek: number; label: string; exercises: TemplateExercise[]; }
interface RoutineTemplate {
  id: string; name: string; description: string; daysPerWeek: number; difficulty: string;
  days: TemplateDay[];
}

type EditDraft = {
  id?: string; name: string;
  days: { dayOfWeek: number; exercises: { exerciseId: string; order: number; targetSets: number; targetReps: number; targetWeight: number | null; exercise: Exercise }[] }[];
};

type View = 'list' | 'picker' | 'builder' | 'session';
type MainTab = 'routines' | 'exercises';

// ── Helpers ────────────────────────────────────────────────────────────────

function parseReps(display: string): number {
  if (display.includes('-')) return parseInt(display.split('-')[1]);
  return parseInt(display) || 10;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner:     'bg-neon-green/10 text-neon-green border border-neon-green/30',
  Intermediate: 'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30',
  Advanced:     'bg-neon-red/10 text-neon-red border border-neon-red/30',
};

function routineToAnalyticsDays(routine: Routine): AnalyticsDay[] {
  return routine.days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    exercises: day.exercises.map((re) => ({
      muscleGroup: re.exercise.muscleGroup,
      sets: re.targetSets,
    })),
  }));
}

function templateToAnalyticsDays(template: RoutineTemplate): AnalyticsDay[] {
  return template.days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    exercises: day.exercises.map((te) => ({
      muscleGroup: te.exercise.muscleGroup,
      sets: te.sets,
    })),
  }));
}

// ── DayMuscleTags — compact muscle group tags for a day ────────────────────

function DayMuscleTags({ exercises, t }: { exercises: { muscleGroup: string }[]; t: (k: string) => string }) {
  if (exercises.length === 0) return null;
  const summary = computeDaySummary(exercises.map((e) => ({ muscleGroup: e.muscleGroup, sets: 1 })));
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {summary.muscles.map((mg) => {
        const cfg = MG_CONFIG[mg];
        const styles = cfg ? COLOR_STYLES[cfg.color] : null;
        return (
          <span key={mg} className={cn('text-[9px] px-1.5 py-0.5 rounded-full border', styles?.badge ?? 'border-dark-border text-slate-500')}>
            {t(cfg?.labelKey ?? 'muscle.' + mg)}
          </span>
        );
      })}
    </div>
  );
}

// ── TemplateCard ───────────────────────────────────────────────────────────

function TemplateCard({ template, onUse }: { template: RoutineTemplate; onUse: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();
  const badgeClass = DIFFICULTY_STYLES[template.difficulty] ?? DIFFICULTY_STYLES.Intermediate;
  const analyticsDays = templateToAnalyticsDays(template);

  return (
    <Card>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-100">{template.name}</h3>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0', badgeClass)}>
              {t(`routines.difficulty.${template.difficulty}`)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-1.5">
            {template.daysPerWeek} {t('routines.daysPerWeek')}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">{template.description}</p>
        </div>
      </div>

      {/* Expand/collapse day preview */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-dark-border space-y-2.5">
          {template.days.map((day) => {
            const daySummary = computeDaySummary(
              day.exercises.map((te) => ({ muscleGroup: te.exercise.muscleGroup, sets: te.sets }))
            );
            return (
              <div key={day.id}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[11px] font-semibold text-slate-300">
                    {t(`day.${day.dayOfWeek}`)} — {day.label}
                  </p>
                  <span className="text-[10px] text-slate-600">
                    {daySummary.totalSets} {t('analytics.setsAbbr')} · ~{daySummary.estDurationMin} min
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {day.exercises.map((te) => (
                    <span key={te.id} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-muted border border-dark-border text-slate-400">
                      {t('ex.' + te.exercise.name)} {te.sets}×{te.repsDisplay}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          <VolumeAnalytics days={analyticsDays} />
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
          {expanded ? t('routines.hidePreview') : t('routines.previewDays')}
        </button>
        <NeonButton variant="cyan" size="sm" onClick={onUse} className="ml-auto">
          {t('routines.customizeAndSave')} →
        </NeonButton>
      </div>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function RoutinesClient() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>('routines');
  const [view, setView] = useState<View>('list');
  const [editRoutine, setEditRoutine] = useState<EditDraft | null>(null);
  const [activeSession, setActiveSession] = useState<{ routine: Routine; day: RoutineDay; isQuick: boolean } | null>(null);
  const [showQuickBuilder, setShowQuickBuilder] = useState(false);

  const { data: routines, isLoading } = useQuery<Routine[]>({
    queryKey: ['routines'],
    queryFn: () => fetch('/api/routines').then((r) => r.json()),
  });

  const { data: templates } = useQuery<RoutineTemplate[]>({
    queryKey: ['routine-templates'],
    queryFn: () => fetch('/api/routine-templates').then((r) => r.json()),
    staleTime: Infinity,
  });

  const todayDow = new Date().getDay();

  async function deleteRoutine(id: string) {
    if (!confirm(t('routines.deleteConfirm'))) return;
    await fetch(`/api/routines/${id}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ['routines'] });
    toast.success(t('routines.deletedToast'));
  }

  function startSession(routine: Routine, day: RoutineDay) {
    setActiveSession({ routine, day, isQuick: false });
    setView('session');
  }

  function startQuickWorkout() {
    const emptyDay: RoutineDay = { id: '', dayOfWeek: -1, exercises: [] };
    const quickRoutine: Routine = { id: '', name: t('routines.quickWorkout'), days: [] };
    setActiveSession({ routine: quickRoutine, day: emptyDay, isQuick: true });
    setView('session');
  }

  function useTemplate(template: RoutineTemplate) {
    const draft: EditDraft = {
      name: `${t('routines.myPrefix')}${template.name}`,
      days: template.days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        exercises: day.exercises.map((te, idx) => ({
          exerciseId: te.exercise.id,
          order: idx,
          targetSets: te.sets,
          targetReps: parseReps(te.repsDisplay),
          targetWeight: null,
          exercise: te.exercise,
        })),
      })),
    };
    setEditRoutine(draft);
    setView('builder');
  }

  if (view === 'session' && activeSession) {
    return (
      <WorkoutSession
        routine={activeSession.routine}
        day={activeSession.day}
        isQuick={activeSession.isQuick}
        onComplete={() => { setActiveSession(null); setView('list'); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); }}
        onCancel={() => { setActiveSession(null); setView('list'); }}
      />
    );
  }

  if (view === 'builder' || editRoutine) {
    return (
      <RoutineBuilder
        initial={editRoutine ?? undefined}
        onSaved={() => {
          setView('list'); setEditRoutine(null);
          queryClient.invalidateQueries({ queryKey: ['routines'] });
          toast.success(t('routines.savedToast'));
        }}
        onCancel={() => { setView('list'); setEditRoutine(null); }}
      />
    );
  }

  if (view === 'picker') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-bold text-slate-100">{t('routines.startWorkoutTitle')}</h2>
        </div>

        <button onClick={startQuickWorkout} className="w-full text-left">
          <Card neon="cyan" className="hover:border-neon-cyan/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center shrink-0">
                <Zap size={18} className="text-neon-cyan" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{t('routines.quickWorkout')}</p>
                <p className="text-xs text-slate-500">{t('routines.quickWorkoutDesc')}</p>
              </div>
            </div>
          </Card>
        </button>

        {isLoading && <Skeleton className="h-32" />}
        {routines?.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">
            {t('routines.noneYet')}{' '}
            <button onClick={() => setView('builder')} className="text-neon-cyan underline">{t('routines.createOne')}</button>
          </p>
        )}
        {routines?.map((routine) => (
          <Card key={routine.id}>
            <h3 className="font-semibold text-slate-200 mb-3">{routine.name}</h3>
            {routine.days.length === 0 && <p className="text-xs text-slate-500">{t('routines.noDays')}</p>}
            <div className="space-y-2">
              {[...routine.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((day) => {
                const isToday = day.dayOfWeek === todayDow;
                const exCount = day.exercises.length;
                const daySummary = computeDaySummary(
                  day.exercises.map((re) => ({ muscleGroup: re.exercise.muscleGroup, sets: re.targetSets }))
                );
                return (
                  <button
                    key={day.id}
                    onClick={() => startSession(routine, day)}
                    className={`w-full flex items-start justify-between p-2.5 rounded-lg border transition-colors text-left ${
                      isToday ? 'bg-neon-green/10 border-neon-green/40 hover:border-neon-green/70' : 'bg-dark-muted border-dark-border hover:border-slate-500'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200">{t(`dayFull.${day.dayOfWeek}`)}</p>
                        {isToday && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30">
                            {t('common.today')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {exCount} {exCount === 1 ? t('routines.exercise') : t('routines.exercises')}
                        {daySummary.totalSets > 0 && (
                          <> · {daySummary.totalSets} {t('analytics.setsAbbr')} · ~{daySummary.estDurationMin} min</>
                        )}
                      </p>
                      <DayMuscleTags exercises={day.exercises.map((re) => ({ muscleGroup: re.exercise.muscleGroup }))} t={t} />
                    </div>
                    <Play size={14} className={cn('shrink-0 mt-1', isToday ? 'text-neon-green' : 'text-slate-500')} />
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const tabBar = (
    <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1 mb-4">
      <button
        onClick={() => setMainTab('routines')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
          mainTab === 'routines'
            ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
            : 'text-slate-400 hover:text-slate-200',
        )}
      >
        <ListChecks size={13} /> {t('routines.myRoutines')}
      </button>
      <button
        onClick={() => setMainTab('exercises')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
          mainTab === 'exercises'
            ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
            : 'text-slate-400 hover:text-slate-200',
        )}
      >
        <Dumbbell size={13} /> {t('routines.tabExercises')}
      </button>
    </div>
  );

  if (mainTab === 'exercises') {
    return (
      <div>
        {tabBar}
        <ExerciseDatabase />
      </div>
    );
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const count = routines?.length ?? 0;

  return (
    <div className="space-y-4">
      {showQuickBuilder && <QuickBuilder onClose={() => setShowQuickBuilder(false)} />}
      {tabBar}
      <NeonButton variant="green" size="lg" className="w-full" onClick={() => setView('picker')}>
        <Play size={16} /> {t('routines.startWorkout')}
      </NeonButton>
      {/* ── My Routines (TOP) ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {t(count === 1 ? 'routines.countRoutines' : 'routines.countRoutinesPlural', { n: count })}
        </p>
        <div className="flex items-center gap-1.5">
          <NeonButton variant="ghost" size="sm" onClick={() => setView('builder')}>
            <Plus size={14} /> {t('routines.newRoutine')}
          </NeonButton>
          <NeonButton variant="cyan" size="sm" onClick={() => setShowQuickBuilder(true)}>
            <Zap size={12} /> {t('qb.openButton')}
          </NeonButton>
        </div>
      </div>

      {count === 0 && (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-slate-300 font-semibold">{t('routines.noRoutines')}</p>
          <p className="text-slate-500 text-sm mt-1">{t('routines.noRoutinesDesc')}</p>
          <NeonButton variant="cyan" className="mt-4" onClick={() => setView('builder')}>
            <Plus size={14} /> {t('routines.createRoutine')}
          </NeonButton>
        </Card>
      )}

      {routines?.map((routine) => {
        const todayDay = routine.days.find((d) => d.dayOfWeek === todayDow);
        const analyticsDays = routineToAnalyticsDays(routine);
        return (
          <Card key={routine.id} neon={todayDay ? 'green' : null}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-100 truncate">{routine.name}</h3>
                  {todayDay && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30 shrink-0">
                      {t('common.today')}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap mt-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                    const day = routine.days.find((d) => d.dayOfWeek === dow);
                    return (
                      <div
                        key={dow}
                        className={`flex flex-col items-center px-2 py-1 rounded text-[10px] border ${
                          day
                            ? dow === todayDow
                              ? 'bg-neon-green/15 border-neon-green/40 text-neon-green'
                              : 'bg-dark-muted border-dark-border text-slate-300'
                            : 'border-transparent text-slate-600'
                        }`}
                      >
                        <span>{t(`day.${dow}`)}</span>
                        {day && <span className="text-slate-500">{day.exercises.length}{t('routines.exSuffix')}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                {todayDay && (
                  <NeonButton variant="green" size="sm" onClick={() => startSession(routine, todayDay)}>
                    <Play size={12} /> {t('routines.start')}
                  </NeonButton>
                )}
                <div className="flex gap-1">
                  <NeonButton variant="ghost" size="sm" onClick={() => setEditRoutine(routine)}>
                    <Pencil size={12} />
                  </NeonButton>
                  <NeonButton variant="danger" size="sm" onClick={() => deleteRoutine(routine.id)}>
                    <Trash2 size={12} />
                  </NeonButton>
                </div>
              </div>
            </div>

            {todayDay && todayDay.exercises.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dark-border">
                <p className="text-xs text-slate-500 mb-2">{t('routines.todayExercises')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {todayDay.exercises.map((re) => (
                    <span key={re.id} className="text-xs px-2 py-1 rounded bg-dark-muted border border-dark-border text-slate-300">
                      {t('ex.' + re.exercise.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <VolumeAnalytics days={analyticsDays} />
          </Card>
        );
      })}

      {/* ── Common Routines (BELOW user routines) ─────────────────────────── */}
      {templates && templates.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-neon-purple" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {t('routines.commonRoutines')}
            </h2>
          </div>
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} onUse={() => useTemplate(template)} />
          ))}
        </div>
      )}
    </div>
  );
}
