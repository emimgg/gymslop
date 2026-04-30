'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronDown, Trophy, Dumbbell, Timer, Weight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/components/providers/I18nProvider';
import { cn } from '@/lib/utils';

interface WorkoutSetEntry {
  setNumber: number;
  reps: number;
  weight: number;
  isPR: boolean;
}

interface ExerciseSummary {
  exerciseId: string;
  name: string;
  sets: WorkoutSetEntry[];
}

interface SessionSummary {
  id: string;
  startedAt: string;
  completedAt: string;
  routineId: string | null;
  routineName: string | null;
  xpEarned: number;
  totalSets: number;
  totalVolume: number;
  durationMin: number;
  prCount: number;
  exercises: ExerciseSummary[];
}

interface WeekGroup {
  weekStart: string;
  sessions: SessionSummary[];
}

function weekStartISO(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday-anchored
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function groupByWeek(sessions: SessionSummary[]): WeekGroup[] {
  const map = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const key = weekStartISO(new Date(s.startedAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([weekStart, sessions]) => ({ weekStart, sessions }));
}

export function WorkoutHistory() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: sessions, isLoading } = useQuery<SessionSummary[]>({
    queryKey: ['workoutSessions'],
    queryFn: () => fetch('/api/workouts/sessions').then((r) => r.json()),
  });

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const locale = lang === 'es' ? 'es-AR' : 'en-GB';

  function formatSessionDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale, {
      weekday: 'long', day: 'numeric', month: 'short',
    });
  }

  function formatWeekOf(dateStr: string) {
    // avoid UTC offset shift by parsing at noon
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, {
      day: 'numeric', month: 'short',
    });
  }

  const weeks = sessions ? groupByWeek(sessions) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-slate-100 text-lg">{t('history.title')}</h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      )}

      {!isLoading && sessions?.length === 0 && (
        <Card className="text-center py-16">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-slate-300 font-semibold">{t('history.empty')}</p>
          <p className="text-slate-500 text-sm mt-1">{t('history.emptyDesc')}</p>
        </Card>
      )}

      {weeks.map((week) => (
        <div key={week.weekStart}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 px-1">
            {t('history.week', { date: formatWeekOf(week.weekStart) })}
          </p>
          <div className="space-y-2">
            {week.sessions.map((session) => {
              const isExpanded = expanded.has(session.id);
              return (
                <Card key={session.id} neon={session.prCount > 0 ? 'yellow' : null}>
                  {/* Summary row — tapping expands */}
                  <button
                    onClick={() => toggleExpand(session.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-slate-200 capitalize text-sm">
                            {formatSessionDate(session.startedAt)}
                          </p>
                          {session.prCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-neon-yellow font-semibold">
                              <Trophy size={9} />
                              {t('history.prs', { n: session.prCount })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-2">
                          {session.routineName ?? t('history.freeSession')}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Dumbbell size={10} className="text-slate-500 shrink-0" />
                            {t('history.sets', { n: session.totalSets })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight size={10} className="text-slate-500 shrink-0" />
                            {t('history.volume', { n: session.totalVolume.toLocaleString() })}
                          </span>
                          {session.durationMin > 0 && (
                            <span className="flex items-center gap-1">
                              <Timer size={10} className="text-slate-500 shrink-0" />
                              {t('history.duration', { n: session.durationMin })}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        size={16}
                        className={cn('text-slate-500 shrink-0 mt-1 transition-transform duration-200', isExpanded && 'rotate-180')}
                      />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-dark-border space-y-3">
                      {session.exercises.map((ex) => (
                        <div key={ex.exerciseId}>
                          <p className="text-xs font-semibold text-slate-300 mb-1.5">
                            {t('ex.' + ex.name)}
                          </p>
                          <div className="space-y-0.5">
                            {ex.sets.map((s) => (
                              <div
                                key={s.setNumber}
                                className="flex items-center gap-3 text-xs text-slate-400 px-1"
                              >
                                <span className="text-slate-600 w-4 text-right tabular-nums">{s.setNumber}.</span>
                                <span className="tabular-nums">{s.reps} reps</span>
                                <span className="tabular-nums">{s.weight} kg</span>
                                {s.isPR && (
                                  <span className="flex items-center gap-0.5 text-neon-yellow text-[10px]">
                                    <Trophy size={9} /> PR
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
