'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkoutStore } from '@/lib/workoutStore';
import { useI18n } from '@/components/providers/I18nProvider';
import { FloatingWorkoutPill } from './FloatingWorkoutPill';
import { WorkoutSession } from '@/components/routines/WorkoutSession';

export function WorkoutSessionWrapper() {
  const { activeWorkout, isMinimized, clearWorkout, expandWorkout } = useWorkoutStore();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Recovery: fresh page load (sessionStorage cleared on refresh) with stored workout
    if (
      typeof window !== 'undefined' &&
      !sessionStorage.getItem('gymtracker:workoutActive') &&
      useWorkoutStore.getState().activeWorkout !== null
    ) {
      setShowRecovery(true);
    }
  }, []);

  useEffect(() => {
    if (!activeWorkout) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [!!activeWorkout]);

  if (!mounted || !activeWorkout) return null;

  if (showRecovery) {
    const startDate = new Date(activeWorkout.startedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isToday = startDate.toDateString() === today.toDateString();
    const isYesterday = startDate.toDateString() === yesterday.toDateString();
    const dayLabel = isToday
      ? t('workout.recoveryToday')
      : isYesterday
      ? t('workout.recoveryYesterday')
      : startDate.toLocaleDateString();

    return (
      <div
        className="fixed left-4 right-4 z-[60] lg:left-[calc(14rem+1rem)]"
        style={{ bottom: `calc(4.5rem + env(safe-area-inset-bottom))` }}
      >
        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-dark-card border border-neon-yellow/50 shadow-[0_0_24px_rgba(250,204,21,0.15)]">
          <span className="text-xl shrink-0">⏸️</span>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-neon-yellow truncate">{activeWorkout.routine.name}</p>
            <p className="text-xs text-slate-400">{t('workout.recoveryBanner', { day: dayLabel })}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { setShowRecovery(false); clearWorkout(); }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1"
            >
              {t('workout.recoveryDiscard')}
            </button>
            <button
              onClick={() => {
                sessionStorage.setItem('gymtracker:workoutActive', '1');
                setShowRecovery(false);
                expandWorkout();
              }}
              className="text-xs font-semibold px-3 py-1 rounded-lg bg-neon-yellow/15 border border-neon-yellow/40 text-neon-yellow hover:bg-neon-yellow/25 transition-colors"
            >
              {t('workout.recoveryResume')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) return <FloatingWorkoutPill />;

  return (
    <WorkoutSession
      onComplete={() => {
        clearWorkout();
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }}
      onCancel={() => clearWorkout()}
    />
  );
}
