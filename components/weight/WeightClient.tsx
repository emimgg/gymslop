'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonSelect } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, Scale, Settings2, AlertTriangle } from 'lucide-react';
import { formatDateShort, toDateOnly, todayUTC } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAdvancedView } from '@/lib/useAdvancedView';
import toast from 'react-hot-toast';
import { WeightWeeklySummary } from './WeightWeeklySummary';

interface WeightLog {
  id: string;
  date: string;
  weight: number;
  note: string | null;
  weighingTime?: string | null;
}

interface WeightData {
  logs: WeightLog[];
  startingWeight: number | null;
  goalWeight: number | null;
}

interface UserProfile {
  heightCm: number | null;
  age: number | null;
  sex: string | null;
  activityLevel: string | null;
  stepsPerWeek: number | null;
  liftingSessionsPerWeek: number | null;
  avgSessionDurationMin: number | null;
  weeklyGoalKg: number | null;
  caloricTarget: number | null;
  startingWeight: number | null;
}

interface TDEEBreakdown {
  bmr: number;
  neat: number;
  eat: number;
  tef: number;
  tdee: number;
  dailySteps: number;
  kcalPerSession: number;
}

// ─── TDEE calculation ────────────────────────────────────────────────────────

/** Mifflin-St Jeor BMR */
function calcBMR(weightKg: number, heightCm: number, age: number, sex: string): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'MALE' ? base + 5 : base - 161);
}

/** NEAT = 0.04 kcal per step */
function calcNEAT(dailySteps: number): number {
  return Math.round(dailySteps * 0.04);
}

/** kcal burned per lifting session: 5 kcal/min */
function sessionKcal(durationMin: number): number {
  return durationMin * 5;
}

/** EAT spread across all 7 days as a daily average */
function calcEAT(sessionsPerWeek: number, avgDurationMin: number): number {
  return Math.round((sessionsPerWeek * sessionKcal(avgDurationMin)) / 7);
}

function calcTDEEBreakdown(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: string,
  stepsPerWeek: number,
  liftingSessionsPerWeek: number,
  avgSessionDurationMin: number,
): TDEEBreakdown {
  const bmr = calcBMR(weightKg, heightCm, age, sex);
  const dailySteps = Math.round(stepsPerWeek / 7);
  const neat = calcNEAT(dailySteps);
  const eat = calcEAT(liftingSessionsPerWeek, avgSessionDurationMin);
  const tef = Math.round(bmr * 0.10);
  const tdee = bmr + neat + eat + tef;
  return {
    bmr, neat, eat, tef, tdee,
    dailySteps,
    kcalPerSession: sessionKcal(avgSessionDurationMin),
  };
}

const MAX_SAFE_DEFICIT = 500;

/** Weekly goal in kg → daily calorie delta (1 kg fat ≈ 7700 kcal) */
function weeklyGoalToDaily(weeklyKg: number): number {
  return Math.round((weeklyKg * 7700) / 7);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WeightClient() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const advancedView = useAdvancedView();
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [weighingTime, setWeighingTime] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [logging, setLogging] = useState(false);
  const [settingGoal, setSettingGoal] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [ob, setOb] = useState({
    currentWeight: '',
    heightCm: '',
    age: '',
    sex: 'MALE',
    stepsPerWeek: '35000',
    liftingSessionsPerWeek: '3',
    avgSessionDurationMin: '60',
    weeklyGoalKg: '-0.5',
  });
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  const { data, isLoading } = useQuery<WeightData>({
    queryKey: ['weight'],
    queryFn: () => fetch('/api/weight?limit=90').then((r) => r.json()),
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: () => fetch('/api/user').then((r) => r.json()),
  });

  useEffect(() => {
    if (data && userProfile && !onboardingDone) {
      const noLogs = data.logs.length === 0;
      const noProfile = !userProfile.heightCm && !userProfile.age;
      if (noLogs && noProfile) setShowOnboarding(true);
    }
  }, [data, userProfile, onboardingDone]);

  useEffect(() => {
    if (showOnboarding && userProfile) {
      setOb((prev) => ({
        ...prev,
        currentWeight: currentWeight ? String(currentWeight) : prev.currentWeight,
        heightCm: userProfile.heightCm ? String(userProfile.heightCm) : prev.heightCm,
        age: userProfile.age ? String(userProfile.age) : prev.age,
        sex: userProfile.sex ?? prev.sex,
        stepsPerWeek: userProfile.stepsPerWeek ? String(userProfile.stepsPerWeek) : prev.stepsPerWeek,
        liftingSessionsPerWeek: userProfile.liftingSessionsPerWeek != null
          ? String(userProfile.liftingSessionsPerWeek) : prev.liftingSessionsPerWeek,
        avgSessionDurationMin: userProfile.avgSessionDurationMin
          ? String(userProfile.avgSessionDurationMin) : prev.avgSessionDurationMin,
        weeklyGoalKg: userProfile.weeklyGoalKg != null ? String(userProfile.weeklyGoalKg) : prev.weeklyGoalKg,
      }));
    }
  }, [showOnboarding]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data?.goalWeight && !goalWeight) setGoalWeight(String(data.goalWeight));
  }, [data?.goalWeight]); // eslint-disable-line react-hooks/exhaustive-deps

  const obBreakdown = (() => {
    const w = parseFloat(ob.currentWeight);
    const h = parseFloat(ob.heightCm);
    const a = parseInt(ob.age);
    const steps = parseInt(ob.stepsPerWeek) || 0;
    const sessions = parseInt(ob.liftingSessionsPerWeek) || 0;
    const duration = parseInt(ob.avgSessionDurationMin) || 60;
    if (!w || !h || !a || !steps) return null;
    return calcTDEEBreakdown(w, h, a, ob.sex, steps, sessions, duration);
  })();

  const obGoalDelta = weeklyGoalToDaily(parseFloat(ob.weeklyGoalKg) || 0);
  const obDeficit = -obGoalDelta;
  const obIsAggressiveDeficit = obDeficit > MAX_SAFE_DEFICIT;

  const obCaloricTarget = (() => {
    if (!obBreakdown) return null;
    const target = obBreakdown.tdee + obGoalDelta;
    return Math.max(ob.sex === 'FEMALE' ? 1200 : 1500, target);
  })();

  async function saveOnboarding() {
    const w = parseFloat(ob.currentWeight);
    const h = parseFloat(ob.heightCm);
    const a = parseInt(ob.age);
    if (!w || !h || !a) { toast.error(t('weight.fillFieldsError')); return; }

    setSavingOnboarding(true);
    try {
      await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: w, date: toDateOnly(todayUTC()) }),
      });

      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingWeight: w,
          heightCm: h,
          age: a,
          sex: ob.sex,
          stepsPerWeek: parseInt(ob.stepsPerWeek) || 0,
          liftingSessionsPerWeek: parseInt(ob.liftingSessionsPerWeek) || 0,
          avgSessionDurationMin: parseInt(ob.avgSessionDurationMin) || 60,
          weeklyGoalKg: parseFloat(ob.weeklyGoalKg),
          caloricTarget: obCaloricTarget,
        }),
      });

      qc.invalidateQueries({ queryKey: ['weight'] });
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOnboardingDone(true);
      setShowOnboarding(false);
      toast.success(t('weight.savedToast'));
    } finally {
      setSavingOnboarding(false);
    }
  }

  async function logWeight() {
    if (!weight) return;
    setLogging(true);
    try {
      await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight, note, date: toDateOnly(todayUTC()), weighingTime: weighingTime || null }),
      });
      qc.invalidateQueries({ queryKey: ['weight'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setWeight('');
      setNote('');
      setWeighingTime('');
      toast.success(t('weight.loggedToast'));
    } finally {
      setLogging(false);
    }
  }

  async function saveGoal() {
    if (!goalWeight) return;
    setSettingGoal(true);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalWeight }),
      });
      qc.invalidateQueries({ queryKey: ['weight'] });
      toast.success(t('weight.goalUpdatedToast'));
    } finally {
      setSettingGoal(false);
    }
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const logs = [...(data?.logs ?? [])].reverse();
  const startingWeight = data?.startingWeight;
  const gw = data?.goalWeight;
  const currentWeight = data?.logs[0]?.weight ?? null;
  const last7 = data?.logs.slice(0, 7) ?? [];
  const avg7 = last7.length > 0 ? last7.reduce((s, l) => s + l.weight, 0) / last7.length : null;
  const diff = currentWeight && startingWeight ? currentWeight - startingWeight : null;
  const chartData = logs.map((l) => ({ date: formatDateShort(l.date), weight: l.weight }));

  const savedDeficit = userProfile?.weeklyGoalKg != null
    ? -(weeklyGoalToDaily(userProfile.weeklyGoalKg))
    : 0;
  const savedIsAggressiveDeficit = savedDeficit > MAX_SAFE_DEFICIT;

  const tdeeBreakdown = (() => {
    const w = currentWeight ?? userProfile?.startingWeight;
    const h = userProfile?.heightCm;
    const a = userProfile?.age;
    const s = userProfile?.sex;
    const steps = userProfile?.stepsPerWeek;
    if (!w || !h || !a || !s || !steps) return null;
    return calcTDEEBreakdown(
      w, h, a, s,
      steps,
      userProfile?.liftingSessionsPerWeek ?? 0,
      userProfile?.avgSessionDurationMin ?? 60,
    );
  })();

  function goalAdjustmentLabel(kg: number) {
    return kg < 0 ? t('weight.deficit') : kg > 0 ? t('weight.surplus') : t('weight.adjustment');
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center p-3">
          <p className="text-xs text-slate-500 mb-1">{t('weight.current')}</p>
          <p className="text-xl font-black text-neon-cyan">{currentWeight?.toFixed(1) ?? '—'}</p>
          <p className="text-xs text-slate-500">kg</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-xs text-slate-500 mb-1">{t('weight.starting')}</p>
          <p className="text-xl font-black text-slate-300">{startingWeight?.toFixed(1) ?? '—'}</p>
          <p className="text-xs text-slate-500">kg</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-xs text-slate-500 mb-1">{t('weight.sevenDayAvg')}</p>
          <p className="text-xl font-black text-neon-green">{avg7?.toFixed(1) ?? '—'}</p>
          <p className="text-xs text-slate-500">kg</p>
        </Card>
        <Card className={`text-center p-3 ${diff != null && diff < 0 ? 'border-neon-green/30' : diff != null && diff > 0 ? 'border-neon-pink/30' : ''}`}>
          <p className="text-xs text-slate-500 mb-1">{t('weight.totalChange')}</p>
          {diff != null ? (
            <div className="flex items-center justify-center gap-1">
              {diff < 0 ? <TrendingDown size={16} className="text-neon-green" /> : diff > 0 ? <TrendingUp size={16} className="text-neon-pink" /> : <Minus size={16} className="text-slate-400" />}
              <p className={`text-xl font-black ${diff < 0 ? 'text-neon-green' : diff > 0 ? 'text-neon-pink' : 'text-slate-300'}`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
              </p>
            </div>
          ) : <p className="text-xl font-black text-slate-500">—</p>}
          <p className="text-xs text-slate-500">kg</p>
        </Card>
      </div>

      {/* Caloric target banner */}
      {userProfile?.caloricTarget && (
        <Card neon="green" className="flex items-center justify-between p-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{t('weight.dailyTarget')}</p>
            <p className="text-2xl font-black text-neon-green">
              {userProfile.caloricTarget.toLocaleString()}
              <span className="text-sm font-normal text-slate-400"> kcal</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {userProfile.weeklyGoalKg != null && (
              <div className="text-right">
                <p className="text-xs text-slate-500">{t('weight.weeklyGoal')}</p>
                <p className={`text-sm font-semibold ${userProfile.weeklyGoalKg < 0 ? 'text-neon-cyan' : userProfile.weeklyGoalKg > 0 ? 'text-neon-pink' : 'text-slate-400'}`}>
                  {userProfile.weeklyGoalKg > 0 ? '+' : ''}{userProfile.weeklyGoalKg} kg/wk
                </p>
              </div>
            )}
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-slate-500 hover:text-neon-cyan transition-colors"
              title={t('weight.editSettings')}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </Card>
      )}

      {/* Aggressive deficit warning */}
      {savedIsAggressiveDeficit && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{t('weight.aggressiveWarningMain', { deficit: savedDeficit, max: MAX_SAFE_DEFICIT })}</span>
        </div>
      )}

      {/* TDEE Breakdown card — Advanced View only */}
      {advancedView && tdeeBreakdown && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{t('weight.tdeeBreakdown')}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">BMR <span className="text-xs text-slate-600">({t('weight.bmrDesc')})</span></span>
              <span className="text-slate-300 font-semibold">{tdeeBreakdown.bmr.toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                NEAT{' '}
                <span className="text-xs text-slate-600">
                  (~{tdeeBreakdown.dailySteps.toLocaleString()} {t('weight.stepsPerDay')})
                </span>
              </span>
              <span className="text-neon-cyan font-semibold">+{tdeeBreakdown.neat.toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                EAT{' '}
                <span className="text-xs text-slate-600">
                  ({t('weight.eatDesc', { sessions: userProfile?.liftingSessionsPerWeek ?? 0, kcal: tdeeBreakdown.kcalPerSession })})
                </span>
              </span>
              <span className="text-neon-cyan font-semibold">+{tdeeBreakdown.eat.toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">TEF <span className="text-xs text-slate-600">({t('weight.tefDesc')})</span></span>
              <span className="text-neon-cyan font-semibold">+{tdeeBreakdown.tef.toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center justify-between border-t border-dark-border pt-2 mt-1">
              <span className="text-slate-200 font-bold">TDEE <span className="text-xs font-normal text-slate-500">({t('weight.maintenance')})</span></span>
              <span className="text-slate-100 font-black text-base">{tdeeBreakdown.tdee.toLocaleString()} kcal</span>
            </div>
            {userProfile?.weeklyGoalKg != null && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <span>
                  {t('weight.adjustmentForGoal', {
                    label: goalAdjustmentLabel(userProfile.weeklyGoalKg),
                    kg: (userProfile.weeklyGoalKg > 0 ? '+' : '') + userProfile.weeklyGoalKg,
                  })}
                </span>
                <span className={userProfile.weeklyGoalKg < 0 ? 'text-neon-cyan' : userProfile.weeklyGoalKg > 0 ? 'text-neon-pink' : 'text-slate-400'}>
                  {weeklyGoalToDaily(userProfile.weeklyGoalKg) >= 0 ? '+' : ''}{weeklyGoalToDaily(userProfile.weeklyGoalKg)} kcal/day
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Set up profile CTA */}
      {!userProfile?.caloricTarget && !isLoading && (
        <button
          onClick={() => setShowOnboarding(true)}
          className="w-full p-3 rounded-xl border border-dashed border-neon-cyan/30 text-neon-cyan text-sm hover:bg-neon-cyan/5 transition-colors"
        >
          {t('weight.setupCta')}
        </button>
      )}

      {/* Weighing time inconsistency warning — Advanced View only */}
      {advancedView && (() => {
        const timeLogs = data?.logs.slice(0, 7).filter((l) => l.weighingTime) ?? [];
        if (timeLogs.length < 3) return null;
        const hours = timeLogs.map((l) => {
          const [h, m] = (l.weighingTime as string).split(':').map(Number);
          return h + m / 60;
        });
        const spread = Math.max(...hours) - Math.min(...hours);
        if (spread <= 2) return null;
        return (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{t('weight.timeInconsistency')}</span>
          </div>
        );
      })()}

      {/* Log weight */}
      <Card neon="cyan">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{t('weight.logSection')}</h2>
        <div className="flex gap-2 flex-wrap">
          <NeonInput
            placeholder="e.g. 78.5"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 min-w-[80px]"
          />
          <NeonInput
            placeholder={t('weight.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 min-w-[80px]"
          />
          {advancedView && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">{t('weight.weighingTime')}</label>
              <input
                type="time"
                value={weighingTime}
                onChange={(e) => setWeighingTime(e.target.value)}
                placeholder={t('weight.fastedHint')}
                className="bg-dark-muted border border-dark-border rounded-lg px-3 py-2 text-sm text-neon-cyan focus:outline-none focus:border-neon-cyan/60 w-32"
              />
            </div>
          )}
          <NeonButton variant="cyan" loading={logging} onClick={logWeight} className="self-end">
            <Scale size={14} /> {t('weight.logBtn')}
          </NeonButton>
        </div>
      </Card>

      {/* Goal weight */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{t('weight.goalSection')}</h2>
        <div className="flex gap-2">
          <NeonInput
            placeholder="e.g. 75.0"
            type="number"
            step="0.1"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            className="flex-1"
          />
          <NeonButton variant="green" loading={settingGoal} onClick={saveGoal}>{t('common.save')}</NeonButton>
        </div>
        {gw && currentWeight && (
          <p className="text-xs text-slate-500 mt-2">
            {Math.abs(currentWeight - gw).toFixed(1)} kg {currentWeight > gw ? t('weight.tolose') : t('weight.togain')} {t('weight.toReachGoal')}
          </p>
        )}
      </Card>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">{t('weight.history')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#00f5ff' }}
                formatter={(v: number) => [`${v.toFixed(1)} kg`]}
              />
              {gw && <ReferenceLine y={gw} stroke="#39ff14" strokeDasharray="4 4" label={{ value: t('weight.goalLabel'), fill: '#39ff14', fontSize: 10 }} />}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#00f5ff"
                strokeWidth={2}
                dot={{ fill: '#00f5ff', r: 3 }}
                activeDot={{ r: 5 }}
                style={{ filter: 'drop-shadow(0 0 4px #00f5ff)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Weekly summary — Advanced View only */}
      {advancedView && <WeightWeeklySummary />}

      {/* Recent entries */}
      {data?.logs && data.logs.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{t('weight.recentEntries')}</h2>
          <div className="space-y-1.5">
            {data.logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-dark-muted">
                <span className="text-slate-400">{formatDateShort(log.date)}</span>
                <span className="font-semibold text-neon-cyan">{log.weight.toFixed(1)} kg</span>
                {log.note && <span className="text-xs text-slate-500 truncate max-w-[120px]">{log.note}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── TDEE Setup / Edit modal ──────────────────────────────────────────── */}
      <Modal open={showOnboarding} onClose={() => setShowOnboarding(false)} title={t('weight.tdeeTitle')}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">{t('weight.tdeeSubtitle')}</p>

          {/* Body stats */}
          <div className="grid grid-cols-2 gap-3">
            <NeonInput
              label={t('weight.currentWeightLabel')}
              type="number"
              step="0.1"
              placeholder="e.g. 82"
              value={ob.currentWeight}
              onChange={(e) => setOb({ ...ob, currentWeight: e.target.value })}
            />
            <NeonInput
              label={t('weight.heightLabel')}
              type="number"
              placeholder="e.g. 178"
              value={ob.heightCm}
              onChange={(e) => setOb({ ...ob, heightCm: e.target.value })}
            />
            <NeonInput
              label={t('weight.ageLabel')}
              type="number"
              placeholder="e.g. 25"
              value={ob.age}
              onChange={(e) => setOb({ ...ob, age: e.target.value })}
            />
            <NeonSelect
              label={t('weight.sexLabel')}
              value={ob.sex}
              onChange={(e) => setOb({ ...ob, sex: e.target.value })}
            >
              <option value="MALE">{t('weight.male')}</option>
              <option value="FEMALE">{t('weight.female')}</option>
            </NeonSelect>
          </div>

          {/* Activity inputs */}
          <div className="border-t border-dark-border pt-3 space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t('weight.dailyActivity')}</p>
            <NeonInput
              label={t('weight.stepsPerWeek')}
              type="number"
              step="1000"
              placeholder={t('weight.stepsPlaceholder')}
              value={ob.stepsPerWeek}
              onChange={(e) => setOb({ ...ob, stepsPerWeek: e.target.value })}
            />
            {ob.stepsPerWeek && parseInt(ob.stepsPerWeek) > 0 && (
              <p className="text-xs text-slate-500 -mt-1">
                ~{Math.round(parseInt(ob.stepsPerWeek) / 7).toLocaleString()} {t('weight.stepsPerDay')}
                {' · '}
                <span className="text-neon-cyan">~{calcNEAT(Math.round(parseInt(ob.stepsPerWeek) / 7)).toLocaleString()} {t('weight.kcalFromSteps')}</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <NeonInput
                label={t('weight.sessionsPerWeek')}
                type="number"
                min="0"
                max="14"
                placeholder="e.g. 4"
                value={ob.liftingSessionsPerWeek}
                onChange={(e) => setOb({ ...ob, liftingSessionsPerWeek: e.target.value })}
              />
              <NeonInput
                label={t('weight.avgDuration')}
                type="number"
                step="5"
                placeholder="e.g. 60"
                value={ob.avgSessionDurationMin}
                onChange={(e) => setOb({ ...ob, avgSessionDurationMin: e.target.value })}
              />
            </div>
            {ob.liftingSessionsPerWeek && ob.avgSessionDurationMin && (
              <p className="text-xs text-slate-500 -mt-1">
                ~{sessionKcal(parseInt(ob.avgSessionDurationMin) || 60)} {t('weight.kcalPerSession')}
              </p>
            )}
          </div>

          {/* Weekly goal */}
          <NeonSelect
            label={t('weight.weeklyGoalLabel')}
            value={ob.weeklyGoalKg}
            onChange={(e) => setOb({ ...ob, weeklyGoalKg: e.target.value })}
          >
            <option value="-1">{t('weight.lose1')}</option>
            <option value="-0.75">{t('weight.lose075')}</option>
            <option value="-0.5">{t('weight.lose05')}</option>
            <option value="-0.25">{t('weight.lose025')}</option>
            <option value="0">{t('weight.maintain')}</option>
            <option value="0.25">{t('weight.gain025')}</option>
            <option value="0.5">{t('weight.gain05')}</option>
          </NeonSelect>

          {/* Aggressive deficit warning */}
          {obIsAggressiveDeficit && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{t('weight.aggressiveWarning', { deficit: obDeficit, max: MAX_SAFE_DEFICIT })}</span>
            </div>
          )}

          {/* Live breakdown preview */}
          {obBreakdown && obCaloricTarget && (
            <div className="p-3 rounded-xl bg-dark-muted border border-dark-border space-y-2 text-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t('weight.calcPreview')}</p>
              <div className="flex justify-between">
                <span className="text-slate-500">BMR</span>
                <span className="text-slate-300 font-semibold">{obBreakdown.bmr.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  + NEAT <span className="text-xs text-slate-600">(~{obBreakdown.dailySteps.toLocaleString()} {t('weight.stepsPerDay')})</span>
                </span>
                <span className="text-neon-cyan font-semibold">+{obBreakdown.neat.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  + EAT <span className="text-xs text-slate-600">({t('weight.liftingDesc')})</span>
                </span>
                <span className="text-neon-cyan font-semibold">+{obBreakdown.eat.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">+ TEF <span className="text-xs text-slate-600">({t('weight.tefDesc')})</span></span>
                <span className="text-neon-cyan font-semibold">+{obBreakdown.tef.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between border-t border-dark-border pt-1.5">
                <span className="text-slate-300 font-semibold">= TDEE</span>
                <span className="text-slate-100 font-black">{obBreakdown.tdee.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{goalAdjustmentLabel(parseFloat(ob.weeklyGoalKg))}</span>
                <span className={`font-semibold ${parseFloat(ob.weeklyGoalKg) < 0 ? 'text-neon-cyan' : parseFloat(ob.weeklyGoalKg) > 0 ? 'text-neon-pink' : 'text-slate-400'}`}>
                  {weeklyGoalToDaily(parseFloat(ob.weeklyGoalKg)) >= 0 ? '+' : ''}{weeklyGoalToDaily(parseFloat(ob.weeklyGoalKg))} kcal/day
                </span>
              </div>
              <div className="flex justify-between border-t border-dark-border pt-1.5">
                <span className="text-slate-300 font-semibold">{t('weight.yourDailyTarget')}</span>
                <span className="text-neon-green font-black text-base">{obCaloricTarget.toLocaleString()} kcal</span>
              </div>
            </div>
          )}

          <NeonButton variant="green" loading={savingOnboarding} onClick={saveOnboarding} className="w-full">
            {t('weight.saveApply')}
          </NeonButton>
        </div>
      </Modal>
    </div>
  );
}
