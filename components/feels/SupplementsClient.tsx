'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, toDateOnly, todayUTC } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAdvancedView } from '@/lib/useAdvancedView';
import { SUPPLEMENTS, type SupplementTiming } from '@/lib/supplements';
import { Flame, TrendingUp } from 'lucide-react';

const TIMING_ORDER: SupplementTiming[] = ['MORNING', 'PREWORKOUT', 'POSTWORKOUT', 'EVENING'];

interface SupplementLogEntry {
  id: string;
  supplement: string;
  taken: boolean;
  dose?: number | null;
  date: string;
}

interface FeelsLog {
  date: string;
  performance: number;
}

export function SupplementsClient() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const advancedView = useAdvancedView();
  const today = toDateOnly(todayUTC());

  const { data: todayLogs, isLoading } = useQuery<SupplementLogEntry[]>({
    queryKey: ['supplements-log', today],
    queryFn: () => fetch(`/api/supplements/log?date=${today}`).then((r) => r.json()),
  });

  const { data: histLogs } = useQuery<SupplementLogEntry[]>({
    queryKey: ['supplements-history'],
    queryFn: () => {
      const from = new Date(todayUTC());
      from.setDate(from.getDate() - 60);
      return fetch(`/api/supplements/log?from=${toDateOnly(from)}&to=${today}`).then((r) => r.json());
    },
    staleTime: 5 * 60_000,
  });

  const { data: feelsLogs } = useQuery<FeelsLog[]>({
    queryKey: ['feels'],
    queryFn: () => fetch('/api/feels?limit=60').then((r) => r.json()),
    enabled: advancedView,
    staleTime: 5 * 60_000,
  });

  async function toggleSupplement(key: string, currentTaken: boolean) {
    await fetch('/api/supplements/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplement: key, taken: !currentTaken, date: today }),
    });
    qc.invalidateQueries({ queryKey: ['supplements-log'] });
    qc.invalidateQueries({ queryKey: ['supplements-history'] });
  }

  function getStreak(supplementKey: string): number {
    if (!histLogs) return 0;
    const takenDates = new Set(
      histLogs.filter((l) => l.supplement === supplementKey && l.taken).map((l) => toDateOnly(new Date(l.date)))
    );
    let streak = 0;
    const d = new Date(todayUTC());
    while (streak < 60) {
      if (!takenDates.has(toDateOnly(d))) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function computeCorrelation(supplementKey: string) {
    if (!feelsLogs || !histLogs || feelsLogs.length < 7) return null;
    const takenDates = new Set(
      histLogs.filter((l) => l.supplement === supplementKey && l.taken).map((l) => toDateOnly(new Date(l.date)))
    );
    const withPerf: number[] = [];
    const withoutPerf: number[] = [];
    for (const fl of feelsLogs) {
      const date = toDateOnly(new Date(fl.date));
      if (takenDates.has(date)) withPerf.push(fl.performance);
      else withoutPerf.push(fl.performance);
    }
    if (withPerf.length < 3) return null;
    const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
    return {
      avgWith: Math.round(avg(withPerf) * 10) / 10,
      avgWithout: withoutPerf.length >= 3 ? Math.round(avg(withoutPerf) * 10) / 10 : null,
      nWith: withPerf.length,
      nWithout: withoutPerf.length,
    };
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  const logMap = Object.fromEntries((todayLogs ?? []).map((l) => [l.supplement, l]));

  const grouped = TIMING_ORDER.map((timing) => ({
    timing,
    supplements: SUPPLEMENTS.filter((s) => s.timing === timing),
  }));

  return (
    <div className="space-y-4">
      {grouped.map(({ timing, supplements: supps }) => (
        <Card key={timing}>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {t(`supp.${timing.toLowerCase()}`)}
          </h2>
          <div className="space-y-2">
            {supps.map((supp) => {
              const entry = logMap[supp.key];
              const taken = entry?.taken ?? false;
              const streak = getStreak(supp.key);
              const corr = advancedView ? computeCorrelation(supp.key) : null;
              return (
                <div key={supp.key}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSupplement(supp.key, taken)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSupplement(supp.key, taken)}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer select-none',
                      taken
                        ? 'bg-neon-green/10 border border-neon-green/20'
                        : 'bg-dark-muted hover:bg-dark-hover border border-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                        taken ? 'bg-neon-green border-neon-green' : 'border-slate-600'
                      )}
                    >
                      {taken && <span className="text-dark-bg text-[10px] font-black leading-none">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', taken ? 'text-neon-green' : 'text-slate-300')}>
                        {t(`supp.${supp.key}`)}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {supp.defaultDose} {supp.doseUnit}
                      </p>
                    </div>
                    {streak > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-neon-yellow font-semibold shrink-0">
                        <Flame size={10} />
                        {t('supp.streak', { n: streak })}
                      </span>
                    )}
                  </div>

                  {advancedView && corr && (
                    <div className="ml-8 mt-1 px-2.5 py-1.5 rounded-lg bg-dark-muted/50 border border-dark-border/40 flex items-center gap-2 text-[10px] text-slate-500">
                      <TrendingUp size={10} className="shrink-0 text-neon-cyan" />
                      <span>
                        {t('supp.corrDays', { n: corr.nWith })}:{' '}
                        <span className="text-neon-cyan font-semibold">{corr.avgWith}/5</span>
                        {corr.avgWithout !== null && corr.nWithout >= 3 && (
                          <>
                            {' · '}
                            {t('supp.corrWithout', { n: corr.nWithout })}:{' '}
                            <span className="text-slate-400 font-semibold">{corr.avgWithout}/5</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
