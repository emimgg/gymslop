'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChevronLeft, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import { cn } from '@/lib/utils';

interface DayData {
  date: string;
  weight: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface WeeklySummaryData {
  tdee: number | null;
  caloricTarget: number | null;
  proteinTargetG: number | null;
  days: DayData[];
}

function getMonday(date: Date): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtRange(start: Date): string {
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(start.getUTCDate())}/${pad(start.getUTCMonth() + 1)} – ${pad(end.getUTCDate())}/${pad(end.getUTCMonth() + 1)}`;
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({
  label, value, sub, accent, wide,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'cyan';
  wide?: boolean;
}) {
  const valueClass =
    accent === 'green' ? 'text-neon-green' :
    accent === 'red'   ? 'text-neon-pink'  :
    accent === 'cyan'  ? 'text-neon-cyan'  :
    'text-slate-200';
  return (
    <div className={cn('bg-dark-muted rounded-lg p-2.5', wide && 'col-span-2')}>
      <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm font-bold', valueClass)}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeightWeeklySummary() {
  const { t } = useI18n();
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  const weekStartStr = toDateStr(weekStart);
  const currentMondayStr = toDateStr(getMonday(new Date()));
  const isCurrentWeek = weekStartStr === currentMondayStr;

  const { data, isLoading } = useQuery<WeeklySummaryData>({
    queryKey: ['weekly-summary', weekStartStr],
    queryFn: () => fetch(`/api/weight/weekly-summary?start=${weekStartStr}`).then((r) => r.json()),
    staleTime: 2 * 60_000,
  });

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setUTCDate(d.getUTCDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    if (isCurrentWeek) return;
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setUTCDate(d.getUTCDate() + 7);
      return d;
    });
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const days = data?.days ?? [];
  const tdee = data?.tdee ?? null;
  const proteinTargetG = data?.proteinTargetG ?? null;

  const trackedDays = days.filter((d) => d.calories !== null);
  const daysTracked = trackedDays.length;
  const weightDays  = days.filter((d) => d.weight !== null);

  const totalKcal   = trackedDays.reduce((s, d) => s + (d.calories ?? 0), 0);
  const avgKcal     = daysTracked > 0 ? Math.round(totalKcal / daysTracked) : null;
  const avgProtein  = daysTracked > 0 ? Math.round(trackedDays.reduce((s, d) => s + (d.protein ?? 0), 0) / daysTracked * 10) / 10 : null;
  const avgCarbs    = daysTracked > 0 ? Math.round(trackedDays.reduce((s, d) => s + (d.carbs   ?? 0), 0) / daysTracked * 10) / 10 : null;
  const avgFat      = daysTracked > 0 ? Math.round(trackedDays.reduce((s, d) => s + (d.fat     ?? 0), 0) / daysTracked * 10) / 10 : null;

  const weeklyBalance = tdee != null && daysTracked > 0
    ? trackedDays.reduce((s, d) => s + (tdee - (d.calories ?? 0)), 0)
    : null;
  const isDeficit = weeklyBalance != null && weeklyBalance > 0;

  const expectedWeightChange = weeklyBalance != null ? -(weeklyBalance / 7700) : null;

  const firstWeight = weightDays.at(0)?.weight ?? null;
  const lastWeight  = weightDays.at(-1)?.weight ?? null;
  const actualWeightChange =
    firstWeight != null && lastWeight != null && weightDays.length > 1
      ? lastWeight - firstWeight
      : null;

  const discrepancy =
    expectedWeightChange != null && actualWeightChange != null
      ? Math.abs(expectedWeightChange - actualWeightChange)
      : null;

  const proteinOk = avgProtein != null && proteinTargetG != null && avgProtein >= proteinTargetG;

  // ── Chart data ─────────────────────────────────────────────────────────────
  // Day labels: number of the month (compact, language-agnostic)
  const chartData = days.map((d) => ({
    day: d.date.slice(8), // "14" etc.
    calories: d.calories,
    weight: d.weight,
  }));

  // ── Helpers ────────────────────────────────────────────────────────────────
  const sign = (n: number) => (n > 0 ? '+' : '');
  const fmtKg = (n: number) => `${sign(n)}${n.toFixed(2)} kg`;

  return (
    <Card>
      {/* Header + week nav */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {t('weight.weeklySummary')}
        </h2>
        <div className="flex items-center gap-1.5">
          <button onClick={prevWeek} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-slate-400 font-mono min-w-[108px] text-center">
            {fmtRange(weekStart)}
          </span>
          <button
            onClick={nextWeek}
            disabled={isCurrentWeek}
            className={cn(
              'p-1 transition-colors',
              isCurrentWeek ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-slate-600 text-sm animate-pulse">
          …
        </div>
      ) : (
        <>
          {/* Not-enough-data warning */}
          {daysTracked < 3 && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 mb-3">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{t('weight.notEnoughData')}</span>
            </div>
          )}

          {/* Combo chart — calories bars + weight line + TDEE reference */}
          {(daysTracked > 0 || weightDays.length > 0) && (
            <div className="mb-4">
              <ResponsiveContainer width="100%" height={148}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                  <YAxis
                    yAxisId="cal"
                    orientation="left"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    width={36}
                  />
                  <YAxis
                    yAxisId="kg"
                    orientation="right"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    width={32}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0d1117',
                      border: '1px solid #1e2d3d',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'calories') return [`${value} kcal`, t('weight.kcalLogged')];
                      if (name === 'weight')   return [`${value?.toFixed(1)} kg`, t('weight.current')];
                      return [value, name];
                    }}
                  />
                  {tdee != null && (
                    <ReferenceLine
                      yAxisId="cal"
                      y={tdee}
                      stroke="#f97316"
                      strokeDasharray="4 3"
                      label={{ value: 'TDEE', fill: '#f97316', fontSize: 8, position: 'insideTopRight' }}
                    />
                  )}
                  <Bar
                    yAxisId="cal"
                    dataKey="calories"
                    fill="rgba(0,245,255,0.35)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    yAxisId="kg"
                    type="monotone"
                    dataKey="weight"
                    stroke="#39ff14"
                    strokeWidth={2}
                    dot={{ fill: '#39ff14', r: 2.5 }}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                    style={{ filter: 'drop-shadow(0 0 3px #39ff14)' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-neon-cyan/40 inline-block" />
                  {t('weight.kcalLogged')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 border-t-2 border-neon-green" />
                  {t('weight.current')}
                </span>
                {tdee != null && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-4 border-t border-dashed border-orange-500" />
                    TDEE
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCell
              label={t('weight.kcalLogged')}
              value={totalKcal > 0 ? `${totalKcal.toLocaleString()} kcal` : '—'}
              sub={avgKcal != null ? `${avgKcal.toLocaleString()} kcal / ${t('weight.avgPerDay')}` : undefined}
              accent="cyan"
            />
            <StatCell
              label={t('weight.daysTracked')}
              value={`${daysTracked} / 7`}
              sub={t('weight.daysTrackedSub')}
            />
            <StatCell
              label={t('weight.avgProtein')}
              value={avgProtein != null ? `${avgProtein} g` : '—'}
              sub={proteinTargetG != null ? `${t('weight.target')}: ${proteinTargetG} g` : undefined}
              accent={avgProtein != null ? (proteinOk ? 'green' : 'red') : undefined}
            />
            <StatCell
              label={t('weight.avgCarbs')}
              value={avgCarbs != null ? `${avgCarbs} g` : '—'}
            />
            <StatCell
              label={t('weight.avgFat')}
              value={avgFat != null ? `${avgFat} g` : '—'}
            />
            <StatCell
              label={isDeficit ? t('weight.weeklyDeficitLabel') : t('weight.weeklySurplusLabel')}
              value={weeklyBalance != null ? `${Math.abs(Math.round(weeklyBalance)).toLocaleString()} kcal` : '—'}
              accent={weeklyBalance != null ? (isDeficit ? 'green' : 'red') : undefined}
            />
            <StatCell
              label={t('weight.expectedChange')}
              value={expectedWeightChange != null ? fmtKg(expectedWeightChange) : '—'}
              accent={expectedWeightChange != null ? (expectedWeightChange <= 0 ? 'green' : 'red') : undefined}
            />
            <StatCell
              label={t('weight.actualChange')}
              value={actualWeightChange != null ? fmtKg(actualWeightChange) : '—'}
              sub={weightDays.length === 0 ? t('weight.noWeightThisWeek') : undefined}
              accent={actualWeightChange != null ? (actualWeightChange <= 0 ? 'green' : 'red') : undefined}
            />
          </div>

          {/* Discrepancy note */}
          {discrepancy != null && discrepancy > 0.3 && (
            <div className="flex items-start gap-2 mt-3 p-2.5 rounded-xl bg-dark-muted border border-dark-border text-[11px] text-slate-500">
              <Info size={12} className="mt-0.5 shrink-0 text-slate-600" />
              <span>{t('weight.discrepancyNote')}</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
