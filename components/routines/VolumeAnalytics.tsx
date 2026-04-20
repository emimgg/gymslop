'use client';

import { useState } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MG_CONFIG, COLOR_STYLES } from '@/lib/muscleGroupConfig';
import { useI18n } from '@/components/providers/I18nProvider';
import {
  computeWeeklyStats,
  computeHeatmap,
  type AnalyticsDay,
} from '@/lib/routineAnalytics';

const UNDERTRAINED = 10;
const OVERTRAINED = 25;
const MAX_BAR_SETS = 30;

interface VolumeAnalyticsProps {
  days: AnalyticsDay[];
}

export function VolumeAnalytics({ days }: VolumeAnalyticsProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (days.length === 0) return null;

  const stats = computeWeeklyStats(days);
  const heatmap = computeHeatmap(days);

  if (stats.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-dark-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 w-full text-left group"
      >
        <ChevronDown
          size={13}
          className={cn('text-slate-500 transition-transform shrink-0', open && 'rotate-180')}
        />
        <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-wider">
          {t('analytics.title')}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {/* Weekly volume list */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
              {t('analytics.weeklyVolume')}
            </p>
            {stats.map(({ mg, totalSets, frequency }) => {
              const cfg = MG_CONFIG[mg];
              const styles = cfg ? COLOR_STYLES[cfg.color] : null;
              const barPct = Math.min((totalSets / MAX_BAR_SETS) * 100, 100);
              const warn = totalSets < UNDERTRAINED ? 'under' : totalSets > OVERTRAINED ? 'over' : null;
              const freqClass =
                frequency >= 2
                  ? 'bg-neon-green/15 text-neon-green border-neon-green/30'
                  : frequency === 1
                  ? 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/30'
                  : 'bg-neon-red/15 text-neon-red border-neon-red/30';
              return (
                <div key={mg} className="flex items-center gap-2">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles?.dot ?? 'bg-slate-500')} />
                  <span className={cn('text-[11px] w-24 shrink-0 truncate', styles?.text ?? 'text-slate-400')}>
                    {t(cfg?.labelKey ?? 'muscle.' + mg)}
                  </span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0', freqClass)}>
                    {t('analytics.freqBadge', { n: frequency })}
                  </span>
                  <div className="flex-1 h-1.5 bg-dark-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', styles?.dot ?? 'bg-slate-500')}
                      style={{ width: `${barPct}%`, opacity: 0.65 }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-9 text-right shrink-0">
                    {totalSets} {t('analytics.setsAbbr')}
                  </span>
                  {warn && (
                    <AlertTriangle
                      size={11}
                      className={cn('shrink-0', warn === 'under' ? 'text-neon-yellow' : 'text-neon-red')}
                    />
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-4 mt-1 pt-1 border-t border-dark-border/50">
              <span className="flex items-center gap-1 text-[10px] text-neon-yellow">
                <AlertTriangle size={9} /> {t('analytics.undertrainedNote')}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-neon-red">
                <AlertTriangle size={9} /> {t('analytics.overtrainedNote')}
              </span>
            </div>
          </div>

          {/* Heatmap */}
          {heatmap.rows.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                {t('analytics.heatmap')}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse min-w-0">
                  <thead>
                    <tr>
                      <th className="text-left text-slate-600 font-normal py-0.5 pr-2 w-24" />
                      {heatmap.activeDays.map((dow) => (
                        <th
                          key={dow}
                          className="text-center text-slate-500 font-semibold py-0.5 px-1 min-w-[28px]"
                        >
                          {t(`day.${dow}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.rows.map(({ mg, cells }) => {
                      const cfg = MG_CONFIG[mg];
                      const colorName = cfg?.color ?? 'cyan';
                      return (
                        <tr key={mg}>
                          <td
                            className={cn(
                              'pr-2 py-0.5 truncate text-[10px]',
                              cfg ? COLOR_STYLES[cfg.color].text : 'text-slate-400',
                            )}
                          >
                            {t(cfg?.labelKey ?? 'muscle.' + mg)}
                          </td>
                          {cells.map((sets, i) => {
                            const intensity =
                              sets === 0
                                ? 0
                                : sets <= 3
                                ? 0.18
                                : sets <= 6
                                ? 0.32
                                : sets <= 9
                                ? 0.5
                                : 0.72;
                            return (
                              <td key={i} className="text-center py-0.5 px-1">
                                {sets > 0 ? (
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded font-bold"
                                    style={{
                                      backgroundColor: `rgb(var(--neon-${colorName}) / ${intensity})`,
                                      color: `rgb(var(--neon-${colorName}))`,
                                      fontSize: '9px',
                                    }}
                                  >
                                    {sets}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 text-slate-700">
                                    –
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
