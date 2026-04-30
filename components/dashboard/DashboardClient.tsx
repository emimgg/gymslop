'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { XPBar } from '@/components/ui/XPBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { WeightSparkline } from './WeightSparkline';
import { CheckCircle, Circle, Flame, Trophy } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';

interface DashboardData {
  user: { xp: number; level: number; currentStreak: number; longestStreak: number };
  today: {
    workout: boolean;
    workoutRoutineId: string | null;
    workoutRoutineName: string | null;
    meals: boolean;
    weight: boolean;
    feels: boolean;
  };
  recentTrophies: { key: string; name: string; icon: string; unlockedAt: string }[];
  weightTrend: { date: string; weight: number }[];
}

export function DashboardClient() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const { user, today, recentTrophies, weightTrend } = data!;

  const todayItems = [
    { labelKey: 'dashboard.workout', done: today.workout, emoji: '🏋️' },
    { labelKey: 'dashboard.meals',   done: today.meals,   emoji: '🥗' },
    { labelKey: 'dashboard.weight',  done: today.weight,  emoji: '⚖️' },
    { labelKey: 'dashboard.feels',   done: today.feels,   emoji: '💙' },
  ];

  const doneCount = todayItems.filter((i) => i.done).length;

  const workoutSubtitle = today.workout
    ? today.workoutRoutineName
      ? t('dashboard.workoutDone', { name: today.workoutRoutineName })
      : t('dashboard.workoutFreeDone')
    : null;

  return (
    <div className="space-y-4">
      {/* XP & Level */}
      <Card neon="green" className="p-5">
        <XPBar xp={user.xp} level={user.level} />
        <p className="text-xs text-slate-500 mt-2">{user.xp.toLocaleString()} {t('dashboard.totalXp')}</p>
      </Card>

      {/* Today's Summary */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{t('dashboard.todaySummary')}</h2>
          <span className="text-xs text-slate-500">{t('dashboard.doneFraction', { n: doneCount })}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {todayItems.map((item) => {
            const isWorkout = item.labelKey === 'dashboard.workout';
            return (
              <div
                key={item.labelKey}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                  item.done
                    ? 'bg-neon-green/10 border-neon-green/30'
                    : 'bg-dark-muted border-dark-border'
                }`}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-xs text-slate-400">{t(item.labelKey)}</span>
                {item.done ? (
                  <>
                    <CheckCircle size={14} className="text-neon-green" />
                    {isWorkout && workoutSubtitle && (
                      <span className="text-[10px] text-neon-green/80 text-center leading-tight font-medium truncate w-full text-center">{workoutSubtitle}</span>
                    )}
                  </>
                ) : (
                  <Circle size={14} className="text-slate-600" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak */}
        <Card neon="yellow">
          <div className="flex items-center gap-3">
            <Flame size={28} className="text-neon-yellow" />
            <div>
              <p className="text-2xl font-black text-neon-yellow">{user.currentStreak}</p>
              <p className="text-xs text-slate-400">{t('dashboard.streak')}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-bold text-slate-300">{user.longestStreak}</p>
              <p className="text-xs text-slate-500">{t('dashboard.bestStreak')}</p>
            </div>
          </div>
        </Card>

        {/* Weight Sparkline */}
        {weightTrend.length > 0 && (
          <Card>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t('dashboard.weightTrend')}</p>
            <WeightSparkline data={weightTrend} />
          </Card>
        )}
      </div>

      {/* Recent Trophies */}
      {recentTrophies.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} className="text-neon-yellow" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{t('dashboard.recentTrophies')}</h2>
          </div>
          <div className="flex gap-3">
            {recentTrophies.map((tr) => (
              <div key={tr.key} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-neon-yellow/5 border border-neon-yellow/20">
                <span className="text-2xl trophy-glow">{tr.icon}</span>
                <span className="text-xs text-slate-300 text-center max-w-[80px]">{tr.name}</span>
                <span className="text-[10px] text-slate-500">{formatDateShort(tr.unlockedAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
