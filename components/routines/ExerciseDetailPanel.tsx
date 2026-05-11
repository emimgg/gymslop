'use client';

import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/components/providers/I18nProvider';
import { MG_CONFIG, COLOR_STYLES, NEON_CHART_COLOR } from '@/lib/muscleGroupConfig';
import { cn, formatDate } from '@/lib/utils';
import { ChevronLeft, Calendar, Dumbbell, Trophy, TrendingUp } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  isCustom: boolean;
}

interface HistoryData {
  chartData: { date: string; e1rm: number }[];
  pr: { weight: number; reps: number; e1rm: number; date: string } | null;
  timesPerformed: number;
  firstDate: string | null;
  lastDate: string | null;
  last5: { date: string; sets: { reps: number; weight: number }[] }[];
}

export function ExerciseDetailPanel({ exercise, onBack }: { exercise: Exercise; onBack: () => void }) {
  const { t } = useI18n();
  const cfg = MG_CONFIG[exercise.muscleGroup];
  const styles = cfg ? COLOR_STYLES[cfg.color] : null;

  const { data, isLoading } = useQuery<HistoryData>({
    queryKey: ['exercise-history-full', exercise.id],
    queryFn: () => fetch(`/api/exercises/${exercise.id}/history`).then((r) => r.json()),
  });

  const neonColor = cfg ? NEON_CHART_COLOR[cfg.color] : '#06b6d4';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-100 truncate">{t('ex.' + exercise.name)}</h2>
            {exercise.isCustom && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-neon-purple/40 bg-neon-purple/10 text-neon-purple font-semibold shrink-0">
                CUSTOM
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {cfg && (
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', styles?.badge ?? 'border-dark-border text-slate-500')}>
                {t(cfg.labelKey)}
              </span>
            )}
            <span className="text-[10px] text-slate-500">{t('equip.' + exercise.equipment)}</span>
          </div>
        </div>
      </div>

      {isLoading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24" />)}</div>}

      {!isLoading && !data?.pr && (
        <Card className="text-center py-12">
          <p className="text-3xl mb-3">💪</p>
          <p className="text-slate-300 font-semibold">{t('exDetail.noHistory')}</p>
          <p className="text-slate-500 text-sm mt-1">{t('exDetail.noHistoryDesc')}</p>
        </Card>
      )}

      {!isLoading && data?.pr && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="text-center p-3">
              <Trophy size={14} className={cn('mx-auto mb-1', styles?.text ?? 'text-neon-yellow')} />
              <p className="text-base font-black text-slate-100">{data.pr.weight}kg</p>
              <p className="text-[10px] text-slate-500">× {data.pr.reps}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{t('exDetail.pr')}</p>
            </Card>
            <Card className="text-center p-3">
              <Dumbbell size={14} className="mx-auto mb-1 text-neon-cyan" />
              <p className="text-base font-black text-slate-100">{data.timesPerformed}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{t('exDetail.timesPerformed')}</p>
            </Card>
            <Card className="text-center p-3">
              <TrendingUp size={14} className="mx-auto mb-1 text-neon-green" />
              <p className="text-base font-black text-slate-100">{data.pr.e1rm}kg</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{t('exDetail.e1rmLabel')}</p>
            </Card>
          </div>

          {/* Dates */}
          {(data.firstDate || data.lastDate) && (
            <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
              <Calendar size={12} className="shrink-0" />
              {data.firstDate && <span>{t('exDetail.firstDate')}: <span className="text-slate-300">{formatDate(data.firstDate)}</span></span>}
              {data.firstDate && data.lastDate && <span className="text-slate-700">·</span>}
              {data.lastDate && data.lastDate !== data.firstDate && <span>{t('exDetail.lastDate')}: <span className="text-slate-300">{formatDate(data.lastDate)}</span></span>}
            </div>
          )}

          {/* e1RM Chart */}
          {data.chartData.length > 1 && (
            <Card>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{t('exDetail.e1rmChart')}</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={data.chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickFormatter={(v) => v.slice(5)} // MM-DD
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v: number) => [`${v} kg`, t('exDetail.e1rmLabel')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="e1rm"
                    stroke={neonColor}
                    strokeWidth={2}
                    dot={{ r: 3, fill: neonColor, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Last 5 sessions */}
          {data.last5.length > 0 && (
            <Card>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{t('exDetail.recentSessions')}</p>
              <div className="space-y-2.5">
                {data.last5.map((session) => (
                  <div key={session.date} className="flex items-start gap-3">
                    <span className="text-[10px] text-slate-500 shrink-0 mt-0.5 w-16">{formatDate(session.date)}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {session.sets.map((s, i) => (
                        <span key={i} className="text-xs text-slate-300 bg-dark-muted border border-dark-border px-2 py-0.5 rounded">
                          {s.weight}kg × {s.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
