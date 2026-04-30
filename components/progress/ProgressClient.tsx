'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Trophy, Plus, Ruler, Zap, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import { cn } from '@/lib/utils';
import { TECHNIQUE_STYLES, TECHNIQUE_ORDER } from '@/lib/techniques';
import { MG_CONFIG, COLOR_STYLES } from '@/lib/muscleGroupConfig';
import toast from 'react-hot-toast';

interface PR { exerciseId: string; exerciseName: string; muscleGroup: string; weight: number; reps: number; date: string; }
interface Measurement {
  id: string; date: string;
  neck: number | null; chest: number | null; waist: number | null; hips: number | null;
  leftArm: number | null; rightArm: number | null; leftThigh: number | null; rightThigh: number | null;
}
interface ProgressData { prs: PR[]; measurements: Measurement[]; }

export function ProgressClient() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'prs' | 'measurements' | 'techniques'>('prs');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const measurementFields = [
    { key: 'neck',       labelKey: 'progress.neck'       },
    { key: 'chest',      labelKey: 'progress.chest'      },
    { key: 'waist',      labelKey: 'progress.waist'      },
    { key: 'hips',       labelKey: 'progress.hips'       },
    { key: 'leftArm',    labelKey: 'progress.leftArm'    },
    { key: 'rightArm',   labelKey: 'progress.rightArm'   },
    { key: 'leftThigh',  labelKey: 'progress.leftThigh'  },
    { key: 'rightThigh', labelKey: 'progress.rightThigh' },
  ];

  const { data, isLoading } = useQuery<ProgressData>({
    queryKey: ['progress'],
    queryFn: () => fetch('/api/progress').then((r) => r.json()),
  });

  const { data: techniquesCounts } = useQuery<Record<string, number>>({
    queryKey: ['weekly-techniques'],
    queryFn: () => fetch('/api/workouts/techniques').then((r) => r.json()),
    enabled: activeTab === 'techniques',
    staleTime: 5 * 60_000,
  });

  async function saveMeasurements() {
    setSaving(true);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(measurements),
      });
      qc.invalidateQueries({ queryKey: ['progress'] });
      setShowMeasurements(false);
      setMeasurements({});
      toast.success(t('progress.savedToast'));
    } finally {
      setSaving(false);
    }
  }

  function toggleGroup(mg: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(mg) ? next.delete(mg) : next.add(mg);
      return next;
    });
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  const { prs, measurements: savedMeasurements } = data ?? { prs: [], measurements: [] };

  const techEntries = techniquesCounts
    ? TECHNIQUE_ORDER
        .filter((k) => k !== 'NORMAL' && techniquesCounts[k] > 0)
        .map((k) => ({ key: k, count: techniquesCounts[k] }))
    : [];

  const totalTechSets = techEntries.reduce((sum, e) => sum + e.count, 0);

  // Group PRs by muscle group, sorted by MG_CONFIG order
  const prsByMuscle = prs.reduce<Record<string, PR[]>>((acc, pr) => {
    const mg = pr.muscleGroup ?? 'FULL_BODY';
    if (!acc[mg]) acc[mg] = [];
    acc[mg].push(pr);
    return acc;
  }, {});

  const muscleGroups = Object.keys(prsByMuscle).sort((a, b) => {
    const orderA = MG_CONFIG[a]?.order ?? 99;
    const orderB = MG_CONFIG[b]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <NeonButton variant={activeTab === 'prs' ? 'yellow' : 'ghost'} size="sm" onClick={() => setActiveTab('prs')}>
          <Trophy size={12} /> {t('progress.prWall', { n: prs.length })}
        </NeonButton>
        <NeonButton variant={activeTab === 'measurements' ? 'cyan' : 'ghost'} size="sm" onClick={() => setActiveTab('measurements')}>
          <Ruler size={12} /> {t('progress.measurements')}
        </NeonButton>
        <NeonButton variant={activeTab === 'techniques' ? 'orange' : 'ghost'} size="sm" onClick={() => setActiveTab('techniques')}>
          <Zap size={12} /> {t('tech.sectionTitle')}
        </NeonButton>
      </div>

      {activeTab === 'prs' && (
        <>
          {prs.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-3xl mb-3">🏆</p>
              <p className="text-slate-300 font-semibold">{t('progress.noPRs')}</p>
              <p className="text-slate-500 text-sm mt-1">{t('progress.noPRsDesc')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {muscleGroups.map((mg) => {
                const cfg = MG_CONFIG[mg];
                const styles = cfg ? COLOR_STYLES[cfg.color] : null;
                const mgPRs = prsByMuscle[mg];
                const isCollapsed = collapsedGroups.has(mg);
                return (
                  <div key={mg} className={cn('rounded-xl border overflow-hidden', styles?.border ?? 'border-dark-border')}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(mg)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5',
                        styles?.headerBg ?? 'bg-dark-muted'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {cfg?.Icon && <cfg.Icon size={14} className={styles?.text ?? 'text-slate-400'} />}
                        <span className={cn('text-sm font-semibold', styles?.text ?? 'text-slate-300')}>
                          {t(cfg?.labelKey ?? `muscle.${mg}`)}
                        </span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', styles?.badge ?? 'bg-dark-muted text-slate-500')}>
                          {mgPRs.length}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn('text-slate-500 transition-transform duration-200', isCollapsed && 'rotate-180')}
                      />
                    </button>

                    {/* PR cards */}
                    {!isCollapsed && (
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-dark-bg/40">
                        {mgPRs.map((pr) => (
                          <PRCard key={pr.exerciseId} pr={pr} repsLabel={t('progress.reps')} t={t} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'measurements' && (
        <>
          <NeonButton variant="cyan" size="sm" onClick={() => setShowMeasurements(true)}>
            <Plus size={12} /> {t('progress.logMeasurements')}
          </NeonButton>

          {savedMeasurements.length === 0 ? (
            <Card className="text-center py-10">
              <p className="text-3xl mb-2">📏</p>
              <p className="text-slate-400 text-sm">{t('progress.noMeasurements')}</p>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-dark-border">
                      <th className="text-left py-2 pr-4">{t('common.date')}</th>
                      {measurementFields.map((f) => (
                        <th key={f.key} className="text-right py-2 px-2">{t(f.labelKey)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savedMeasurements.map((m) => (
                      <tr key={m.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                        <td className="py-2 pr-4 text-slate-400">{formatDate(m.date)}</td>
                        {measurementFields.map((f) => {
                          const val = m[f.key as keyof Measurement] as number | null;
                          return (
                            <td key={f.key} className="text-right py-2 px-2 text-slate-300">
                              {val != null ? `${val} cm` : <span className="text-slate-600">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'techniques' && (
        <div className="space-y-3">
          {techEntries.length === 0 ? (
            <Card className="text-center py-10">
              <p className="text-3xl mb-2">⚡</p>
              <p className="text-slate-400 text-sm">{t('tech.noTechniques')}</p>
            </Card>
          ) : (
            <Card>
              <div className="space-y-2.5">
                {techEntries.map(({ key, count }) => {
                  const style = TECHNIQUE_STYLES[key as keyof typeof TECHNIQUE_STYLES];
                  const pct = Math.round((count / totalTechSets) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', style.dotClass)} />
                      <span className={cn('text-sm w-36 shrink-0', style.badgeClass.includes('text-') ? style.badgeClass.split(' ').find(c => c.startsWith('text-')) : 'text-slate-300')}>
                        {t(style.labelKey)}
                      </span>
                      <div className="flex-1 h-1.5 bg-dark-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', style.dotClass)}
                          style={{ width: `${pct}%`, opacity: 0.7 }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right shrink-0">
                        {count} {t('analytics.setsAbbr')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-dark-border">
                {totalTechSets} {t('analytics.setsAbbr')} {t('tech.sectionTitle').toLowerCase()}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Log measurements modal */}
      <Modal open={showMeasurements} onClose={() => setShowMeasurements(false)} title={t('progress.logBodyTitle')}>
        <div className="grid grid-cols-2 gap-3">
          {measurementFields.map((f) => (
            <NeonInput
              key={f.key}
              label={`${t(f.labelKey)} (cm)`}
              type="number"
              step="0.1"
              placeholder="—"
              value={measurements[f.key] ?? ''}
              onChange={(e) => setMeasurements({ ...measurements, [f.key]: e.target.value })}
            />
          ))}
        </div>
        <NeonButton variant="cyan" loading={saving} onClick={saveMeasurements} className="w-full mt-4">
          {t('progress.saveMeasurements')}
        </NeonButton>
      </Modal>
    </div>
  );
}

function PRCard({ pr, repsLabel, t }: { pr: PR; repsLabel: string; t: (k: string) => string }) {
  const isHeavy = pr.weight >= 100;
  return (
    <div className={`relative rounded-xl border p-3 transition-all hover:scale-[1.01] ${
      isHeavy
        ? 'bg-gradient-to-br from-neon-yellow/10 to-neon-orange/5 border-neon-yellow/40'
        : 'bg-dark-card border-dark-border hover:border-neon-yellow/30'
    }`}>
      {isHeavy && <div className="absolute top-2 right-2 text-neon-yellow text-base">🏆</div>}
      <h3 className="font-bold text-slate-200 text-sm mb-1 pr-6 truncate">
        {t('ex.' + pr.exerciseName)}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className={`text-xl font-black ${isHeavy ? 'text-neon-yellow' : 'text-slate-100'}`}>
          {pr.weight}<span className="text-xs font-normal text-slate-400">kg</span>
        </span>
        <span className="text-slate-500 text-xs">× {pr.reps} {repsLabel}</span>
      </div>
      <p className="text-[10px] text-slate-600 mt-1">{formatDate(pr.date)}</p>
    </div>
  );
}
