'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { useWorkoutStore } from '@/lib/workoutStore';
import { useI18n } from '@/components/providers/I18nProvider';

export function FloatingWorkoutPill() {
  const { activeWorkout, expandWorkout } = useWorkoutStore();
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!activeWorkout) return;
    const tick = () => setElapsed(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkout?.startedAt]);

  if (!mounted || !activeWorkout) return null;

  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');

  return (
    <div
      className="fixed left-4 right-4 z-[60] lg:left-[calc(14rem+1rem)]"
      style={{ bottom: `calc(4.5rem + env(safe-area-inset-bottom))` }}
    >
      <button
        onClick={expandWorkout}
        className="workout-pill-pulse w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-dark-card/95 border border-neon-green/50 backdrop-blur-md hover:border-neon-green/80 transition-all shadow-[0_0_24px_rgba(57,255,20,0.2)]"
        aria-label={t('workout.pillLabel')}
      >
        <span className="text-xl shrink-0">💪</span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-neon-green truncate">
            {activeWorkout.routine.name}
          </p>
          <p className="text-[10px] text-slate-500">{t('workout.pillLabel')}</p>
        </div>
        <div className="flex items-center gap-1.5 text-neon-cyan font-mono text-sm shrink-0">
          <Timer size={14} />
          {m}:{s}
        </div>
      </button>
    </div>
  );
}
