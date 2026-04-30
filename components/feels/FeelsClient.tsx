'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, toDateOnly, todayUTC, formatDateShort } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import { SupplementsClient } from './SupplementsClient';
import toast from 'react-hot-toast';

const METRIC_KEYS = ['sleep', 'performance', 'hunger', 'energy', 'stress', 'mood'] as const;
type MetricKey = typeof METRIC_KEYS[number];

const METRIC_EMOJIS: Record<MetricKey, string> = {
  sleep: '😴', performance: '⚡', hunger: '🍽️', energy: '🔋', stress: '🧠', mood: '😊',
};

const EMOJI_SCALES: Record<number, string> = { 1: '😞', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };

interface FeelsLog {
  id: string; date: string;
  sleep: number; performance: number; hunger: number;
  energy: number; stress: number; mood: number;
}

type FeelsTab = 'wellness' | 'supplements';

export function FeelsClient() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<FeelsTab>('wellness');
  const [ratings, setRatings] = useState<Record<string, number>>({
    sleep: 3, performance: 3, hunger: 3, energy: 3, stress: 2, mood: 3,
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: logs, isLoading } = useQuery<FeelsLog[]>({
    queryKey: ['feels'],
    queryFn: () => fetch('/api/feels?limit=30').then((r) => r.json()),
  });

  const todayLog = logs?.find((l) => toDateOnly(new Date(l.date)) === toDateOnly(todayUTC()));

  async function saveFeels() {
    setSaving(true);
    try {
      await fetch('/api/feels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ratings, note, date: toDateOnly(todayUTC()) }),
      });
      qc.invalidateQueries({ queryKey: ['feels'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('feels.checkinSavedToast'));
    } finally {
      setSaving(false);
    }
  }

  const insights = computeInsights(logs ?? [], t);

  if (isLoading && activeTab === 'wellness') return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  const calDays = t('feels.calHeader').split(',');

  const tabBar = (
    <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1 mb-4">
      {(['wellness', 'supplements'] as FeelsTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === tab
              ? 'bg-dark-hover text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {tab === 'wellness' ? `💚 ${t('feels.tabWellness')}` : `💊 ${t('feels.tabSupplements')}`}
        </button>
      ))}
    </div>
  );

  if (activeTab === 'supplements') {
    return (
      <div className="space-y-4">
        {tabBar}
        <SupplementsClient />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tabBar}
      {/* Today's check-in */}
      <Card neon={todayLog ? 'green' : 'cyan'}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{t('feels.dailyCheckin')}</h2>
          {todayLog && <span className="text-xs text-neon-green px-2 py-0.5 rounded-full border border-neon-green/30 bg-neon-green/10">{t('feels.doneToday')}</span>}
        </div>

        <div className="space-y-4">
          {METRIC_KEYS.map((key) => {
            const val = todayLog ? todayLog[key] as number : ratings[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">{METRIC_EMOJIS[key]} {t(`feels.${key}`)}</span>
                  <span className="text-sm font-bold text-slate-200">{EMOJI_SCALES[val]} {t(`feels.${key}.${val}`)}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      disabled={!!todayLog}
                      onClick={() => setRatings({ ...ratings, [key]: n })}
                      className={cn(
                        'flex-1 h-8 rounded-lg border text-xs font-bold transition-all',
                        val === n
                          ? 'bg-neon-cyan/20 border-neon-cyan/60 text-neon-cyan'
                          : 'bg-dark-muted border-dark-border text-slate-500 hover:border-slate-400 disabled:cursor-default'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {!todayLog && (
            <>
              <textarea
                placeholder={t('feels.notesPlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full bg-dark-muted border border-dark-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-neon-cyan/60 resize-none"
              />
              <NeonButton variant="cyan" loading={saving} onClick={saveFeels} className="w-full">
                {t('feels.saveCheckin')}
              </NeonButton>
            </>
          )}
        </div>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{t('feels.insights')}</h2>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-dark-muted text-sm">
                <span className="text-neon-cyan shrink-0">💡</span>
                <span className="text-slate-300">{insight}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Calendar */}
      {logs && logs.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{t('feels.last30Days')}</h2>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((d) => (
              <div key={d} className="text-center text-[10px] text-slate-600 pb-1">{d}</div>
            ))}
            {generateCalendarCells(logs).map((cell, i) => (
              <div
                key={i}
                title={cell.date ? `${formatDateShort(cell.date)}: Avg ${cell.avg?.toFixed(1)}` : ''}
                className={cn(
                  'aspect-square rounded-sm transition-colors',
                  !cell.date && 'bg-transparent',
                  cell.date && !cell.avg && 'bg-dark-muted',
                  cell.avg && cell.avg >= 4 && 'bg-neon-green/60',
                  cell.avg && cell.avg >= 3 && cell.avg < 4 && 'bg-neon-cyan/40',
                  cell.avg && cell.avg >= 2 && cell.avg < 3 && 'bg-neon-yellow/30',
                  cell.avg && cell.avg < 2 && 'bg-neon-pink/40',
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-neon-green/60" /> {t('feels.great')}</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-neon-cyan/40" /> {t('feels.good')}</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-neon-yellow/30" /> {t('feels.okay')}</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-neon-pink/40" /> {t('feels.rough')}</div>
          </div>
        </Card>
      )}
    </div>
  );
}

function computeInsights(logs: FeelsLog[], t: (k: string) => string): string[] {
  if (logs.length < 7) return [];
  const insights: string[] = [];

  const withGoodSleep = logs.filter((l) => l.sleep >= 4);
  if (withGoodSleep.length >= 3) {
    const avgPerf = withGoodSleep.reduce((s, l) => s + l.performance, 0) / withGoodSleep.length;
    if (avgPerf >= 4) insights.push(t('feels.insight.sleepPerf'));
  }

  const recentEnergy = logs.slice(0, 7).reduce((s, l) => s + l.energy, 0) / Math.min(7, logs.length);
  const olderEnergy = logs.slice(7, 14).reduce((s, l) => s + l.energy, 0) / Math.min(7, logs.slice(7).length);
  if (recentEnergy > olderEnergy + 0.5) insights.push(t('feels.insight.energyUp'));
  if (recentEnergy < olderEnergy - 0.5) insights.push(t('feels.insight.energyDown'));

  const highStress = logs.filter((l) => l.stress >= 4);
  if (highStress.length >= 3) {
    const avgMood = highStress.reduce((s, l) => s + l.mood, 0) / highStress.length;
    if (avgMood <= 2) insights.push(t('feels.insight.stressMood'));
  }

  return insights;
}

function generateCalendarCells(logs: FeelsLog[]) {
  const today = todayUTC();
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  const startDow = start.getDay();
  const cells: { date: string | null; avg: number | null }[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ date: null, avg: null });
  const logMap = Object.fromEntries(logs.map((l) => [toDateOnly(new Date(l.date)), l]));
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = toDateOnly(d);
    const log = logMap[dateStr];
    const avg = log ? (log.sleep + log.performance + log.energy + log.mood) / 4 : null;
    cells.push({ date: dateStr, avg });
  }
  return cells;
}
