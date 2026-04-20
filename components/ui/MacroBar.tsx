'use client';

import { cn } from '@/lib/utils';

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color: string;
}

export function MacroBar({ label, current, goal, unit = 'g', color }: MacroBarProps) {
  const percent = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const over = goal > 0 && current > goal;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={cn(over ? 'text-neon-pink' : 'text-slate-200')}>
          {Math.round(current)}/{goal}{unit}
        </span>
      </div>
      <div className="h-2 bg-dark-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{
            width: `${percent}%`,
            boxShadow: `0 0 6px currentColor`,
          }}
        />
      </div>
    </div>
  );
}
