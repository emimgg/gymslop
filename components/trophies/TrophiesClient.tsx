'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';

const CATEGORIES = ['CONSISTENCY', 'STRENGTH', 'NUTRITION', 'WELLNESS', 'MILESTONES', 'MISC'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  CONSISTENCY: '🔥', STRENGTH: '💪', NUTRITION: '🥗', WELLNESS: '🧘', MILESTONES: '🎯', MISC: '🎲',
};

const LUCIDE_TROPHY_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Stethoscope,
};

interface Trophy {
  id: string; key: string; name: string; description: string;
  icon: string; category: string; xpReward: number; unobtainable: boolean;
  unlocked: boolean; unlockedAt: string | null;
}

interface TrophyData { trophies: Trophy[]; total: number; unlocked: number; }

export function TrophiesClient() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery<TrophyData>({
    queryKey: ['trophies'],
    queryFn: () => fetch('/api/trophies').then((r) => r.json()),
  });

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const { trophies, total, unlocked } = data!;
  const percent = total > 0 ? Math.floor((unlocked / total) * 100) : 0;
  const filtered = filter ? trophies.filter((tr) => tr.category === filter) : trophies;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card neon="yellow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-black text-neon-yellow">{unlocked}<span className="text-slate-500 text-lg font-normal"> / {total}</span></p>
            <p className="text-xs text-slate-400">{t('trophies.unlocked')}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-200">{percent}%</p>
            <p className="text-xs text-slate-500">{t('trophies.completion')}</p>
          </div>
        </div>
        <div className="h-2 bg-dark-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-yellow to-neon-orange transition-all duration-700"
            style={{ width: `${percent}%`, boxShadow: '0 0 8px #ffff00' }}
          />
        </div>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
            !filter ? 'bg-neon-green/15 border-neon-green/40 text-neon-green' : 'bg-dark-muted border-dark-border text-slate-400 hover:border-slate-400'
          )}
        >
          {t('trophies.all')}
        </button>
        {CATEGORIES.map((cat) => {
          const catUnlocked = trophies.filter((tr) => tr.category === cat && tr.unlocked).length;
          const catTotal = trophies.filter((tr) => tr.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? null : cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                filter === cat ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan' : 'bg-dark-muted border-dark-border text-slate-400 hover:border-slate-400'
              )}
            >
              {CATEGORY_ICONS[cat]} {t(`trophies.${cat}`)} ({catUnlocked}/{catTotal})
            </button>
          );
        })}
      </div>

      {/* Trophies grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered
          .sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1))
          .map((trophy) => (
            <TrophyCard key={trophy.id} trophy={trophy} rewardLabel={t('trophies.reward')} xpEarnedLabel={t('trophies.xpEarned')} />
          ))}
      </div>
    </div>
  );
}

function TrophyIcon({ icon, unlocked }: { icon: string; unlocked: boolean }) {
  if (icon.startsWith('lucide:')) {
    const name = icon.slice(7);
    const Icon = LUCIDE_TROPHY_ICONS[name];
    if (Icon) return <Icon size={30} className={unlocked ? 'text-neon-yellow drop-shadow-[0_0_6px_#facc15]' : 'text-slate-600'} />;
  }
  return <span className={cn('text-3xl', unlocked && 'trophy-glow')}>{icon}</span>;
}

function TrophyCard({ trophy, rewardLabel, xpEarnedLabel }: { trophy: Trophy; rewardLabel: string; xpEarnedLabel: string }) {
  const isLocked = !trophy.unlocked;
  const isUnobtainable = trophy.unobtainable;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col items-center gap-2 text-center transition-all',
        trophy.unlocked
          ? 'bg-gradient-to-b from-neon-yellow/10 to-transparent border-neon-yellow/40 hover:scale-[1.03]'
          : isUnobtainable
          ? 'bg-dark-card border-dark-border/50 opacity-40'
          : 'bg-dark-card border-dark-border opacity-50 grayscale'
      )}
    >
      {isUnobtainable && isLocked ? (
        <Lock size={28} className="text-slate-700" />
      ) : (
        <TrophyIcon icon={trophy.icon} unlocked={trophy.unlocked} />
      )}
      <div>
        <p className={cn('text-sm font-bold', trophy.unlocked ? 'text-slate-100' : 'text-slate-400')}>{trophy.name}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{trophy.description}</p>
        {trophy.unlocked && trophy.unlockedAt && (
          <p className="text-[10px] text-neon-yellow/70 mt-1">{formatDate(trophy.unlockedAt)}</p>
        )}
        {isLocked && !isUnobtainable && trophy.xpReward > 0 && (
          <p className="text-[10px] text-slate-600 mt-1">{rewardLabel}: +{trophy.xpReward} XP</p>
        )}
        {trophy.unlocked && trophy.xpReward > 0 && (
          <p className="text-[10px] text-neon-green mt-1">+{trophy.xpReward} XP {xpEarnedLabel}</p>
        )}
      </div>
    </div>
  );
}
