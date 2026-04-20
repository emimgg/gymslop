'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Dumbbell, Flame, Trophy, Award, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { levelTitle } from '@/lib/xp';
import { useI18n } from '@/components/providers/I18nProvider';

type Category = 'workouts' | 'weight' | 'streak' | 'trophies' | 'prs';
type Period = 'week' | 'month' | 'alltime';

interface LeaderboardRow {
  id: string; name: string | null; image: string | null;
  level: number; xp: number; isMe: boolean;
  workouts: number; totalWeight: number; streak: number; trophies: number; prs: number;
}

const RANK_STYLES = [
  'text-neon-yellow border-neon-yellow/50 bg-neon-yellow/10',
  'text-slate-300 border-slate-400/40 bg-slate-400/10',
  'text-neon-orange border-neon-orange/50 bg-neon-orange/10',
];

export function LeaderboardClient() {
  const [category, setCategory] = useState<Category>('workouts');
  const [period, setPeriod] = useState<Period>('alltime');
  const { t } = useI18n();

  const CATEGORIES: { key: Category; labelKey: string; icon: React.ReactNode; stat: (r: LeaderboardRow) => string }[] = [
    { key: 'workouts', labelKey: 'lb.workouts', icon: <Dumbbell size={14} />, stat: (r) => r.workouts.toLocaleString() },
    { key: 'weight', labelKey: 'lb.weightMoved', icon: <TrendingUp size={14} />, stat: (r) => `${(r.totalWeight / 1000).toFixed(1)}t` },
    { key: 'streak', labelKey: 'lb.streak', icon: <Flame size={14} />, stat: (r) => `${r.streak}d` },
    { key: 'trophies', labelKey: 'lb.trophies', icon: <Trophy size={14} />, stat: (r) => r.trophies.toLocaleString() },
    { key: 'prs', labelKey: 'lb.prsBroken', icon: <Award size={14} />, stat: (r) => r.prs.toLocaleString() },
  ];

  const PERIODS: { key: Period; labelKey: string }[] = [
    { key: 'week', labelKey: 'lb.thisWeek' },
    { key: 'month', labelKey: 'lb.thisMonth' },
    { key: 'alltime', labelKey: 'lb.allTime' },
  ];

  const { data, isLoading } = useQuery<{ rows: LeaderboardRow[] }>({
    queryKey: ['leaderboard', category, period],
    queryFn: () => fetch(`/api/social/leaderboard?category=${category}&period=${period}`).then((r) => r.json()),
  });

  const rows = data?.rows ?? [];
  const myRank = rows.findIndex((r) => r.isMe) + 1;
  const catConfig = CATEGORIES.find((c) => c.key === category)!;

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
              period === p.key ? 'bg-neon-green/15 border-neon-green/40 text-neon-green' : 'border-dark-border text-slate-400 hover:border-slate-400 hover:text-slate-200',
            )}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all',
              category === c.key ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan' : 'border-dark-border text-slate-400 hover:border-slate-400',
            )}
          >
            {c.icon}
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6 text-sm">{t('lb.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            return (
              <Link
                key={row.id}
                href={`/social/profile/${row.id}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]',
                  row.isMe ? 'bg-neon-cyan/5 border-neon-cyan/30' : 'bg-dark-card border-dark-border hover:border-dark-hover',
                )}
              >
                {/* Rank badge */}
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-black flex-shrink-0',
                  isTop3 ? RANK_STYLES[rank - 1] : 'border-dark-border text-slate-500 bg-dark-hover',
                )}>
                  {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                </div>

                {/* Avatar */}
                {row.image ? (
                  <Image src={row.image} alt={row.name ?? ''} width={36} height={36} className="rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center text-neon-green text-sm font-bold flex-shrink-0">
                    {row.name?.[0] ?? '?'}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn('text-sm font-semibold truncate', row.isMe ? 'text-neon-cyan' : 'text-slate-200')}>
                      {row.name} {row.isMe && <span className="text-[10px] text-neon-cyan/70">({t('lb.you')})</span>}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">Lv.{row.level} · {levelTitle(row.level)}</p>
                </div>

                {/* Stat */}
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-lg font-black', isTop3 ? ['text-neon-yellow', 'text-slate-300', 'text-neon-orange'][rank - 1] : 'text-slate-200')}>
                    {catConfig.stat(row)}
                  </p>
                  <p className="text-[10px] text-slate-600 capitalize flex items-center justify-end gap-0.5">
                    {catConfig.icon} {t(catConfig.labelKey)}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* My position if outside top 5 */}
          {myRank > 5 && (
            <div className="pt-2 border-t border-dark-border">
              <p className="text-xs text-slate-500 text-center mb-2">{t('lb.yourPosition')}</p>
              {rows.filter((r) => r.isMe).map((row) => (
                <div key={row.id} className="flex items-center gap-3 p-3 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5">
                  <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/40 flex items-center justify-center text-sm font-black text-neon-cyan flex-shrink-0">
                    #{myRank}
                  </div>
                  {row.image ? (
                    <Image src={row.image} alt={row.name ?? ''} width={36} height={36} className="rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan text-sm font-bold">
                      {row.name?.[0] ?? '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neon-cyan">{row.name}</p>
                    <p className="text-[11px] text-slate-500">Lv.{row.level}</p>
                  </div>
                  <p className="text-lg font-black text-neon-cyan">{catConfig.stat(row)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
