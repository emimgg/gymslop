'use client';

import { xpToNextLevel, levelTitle } from '@/lib/xp';

interface XPBarProps {
  xp: number;
  level: number;
}

export function XPBar({ xp, level }: XPBarProps) {
  const { current, needed, percent } = xpToNextLevel(xp);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neon-green px-2 py-0.5 rounded border border-neon-green/40 bg-neon-green/10">
            LVL {level}
          </span>
          <span className="text-xs text-slate-400">{levelTitle(level)}</span>
        </div>
        <span className="text-xs text-slate-500">{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
      </div>
      <div className="h-2.5 bg-dark-muted rounded-full overflow-hidden border border-dark-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-700"
          style={{
            width: `${percent}%`,
            boxShadow: '0 0 8px #39ff14, 0 0 4px #00f5ff',
          }}
        />
      </div>
    </div>
  );
}
