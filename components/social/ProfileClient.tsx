'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Trophy, Dumbbell, Weight, Zap, Award, Calendar, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, formatDate } from '@/lib/utils';
import { levelTitle, xpToNextLevel } from '@/lib/xp';
import { useI18n } from '@/components/providers/I18nProvider';
import toast from 'react-hot-toast';

interface ProfileUser {
  id: string; username: string | null; name: string | null; image: string | null; createdAt: string;
  level: number; xp: number; currentStreak: number; longestStreak: number;
  lastActiveAt: string | null; totalWorkouts: number; totalWeight: number; totalPRs: number;
  trophies: Array<{ id: string; trophy: { key: string; name: string; icon: string; category: string } }>;
  weightLogs: Array<{ date: string; weight: number }>;
}
interface ActivityItem {
  type: 'workout'; date: string; xpEarned: number;
  prCount: number; totalSets: number; muscleGroups: string[];
}
interface ProfileData {
  user: ProfileUser;
  recentActivity: ActivityItem[];
  isOwn: boolean;
  accountabilityPartnerId: string | null;
}

export function ProfileClient({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const { t } = useI18n();

  const { data, isLoading, error } = useQuery<ProfileData>({
    queryKey: ['profile', userId],
    queryFn: () => fetch(`/api/social/profile/${userId}`).then((r) => r.json()),
  });

  const setAccountability = useMutation({
    mutationFn: () =>
      fetch('/api/social/accountability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: userId }),
      }).then((r) => r.json()),
    onSuccess: (d) => {
      if (d.error) { toast.error(d.error); return; }
      toast.success(t('profile.setPartnerToast'));
      qc.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  const removeAccountability = useMutation({
    mutationFn: () => fetch('/api/social/accountability', { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(t('profile.removePartnerToast'));
      qc.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  if (isLoading) return <ProfileSkeleton />;
  if (error || (data as any)?.error) {
    const apiError = (data as any)?.error;
    const isNotFriends = apiError === 'Not friends';
    const isOwnProfile = !apiError || apiError === 'User not found';
    return (
      <Card>
        <p className="text-center text-slate-400 py-6">
          {isNotFriends ? t('profile.notFriends') : t('profile.notFound')}
        </p>
        <div className="flex flex-col items-center gap-2 mt-1">
          {isOwnProfile && (
            <Link
              href="/social/profile/me"
              className="text-sm px-4 py-2 rounded-lg bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/25 transition-colors"
            >
              {t('profile.setupProfile')}
            </Link>
          )}
          <Link href="/social" className="text-neon-cyan text-sm hover:underline">{t('profile.backToSocial')}</Link>
        </div>
      </Card>
    );
  }

  const { user, recentActivity, isOwn, accountabilityPartnerId } = data!;
  const { current, needed, percent } = xpToNextLevel(user.xp);
  const title = levelTitle(user.level);
  const isAccountabilityPartner = accountabilityPartnerId === userId || accountabilityPartnerId === session?.user?.id;

  return (
    <div className="space-y-4">
      {/* Hero profile banner */}
      <Card neon="cyan" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />

        <div className="relative flex gap-4 items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ''} width={80} height={80} className="rounded-2xl border-2 border-neon-cyan/40" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-neon-cyan/20 border-2 border-neon-cyan/40 flex items-center justify-center text-neon-cyan text-3xl font-black">
                {user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-dark-card border border-neon-cyan/40 rounded-full px-1.5 py-0.5 text-[10px] text-neon-cyan font-bold">
              {user.level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-xl font-black text-slate-100 leading-none">{user.name}</h2>
                <p className="text-sm text-neon-cyan mt-0.5">{title}</p>
              </div>
              {!isOwn && (
                <div className="flex gap-2">
                  {isAccountabilityPartner ? (
                    <button
                      onClick={() => removeAccountability.mutate()}
                      className="text-xs px-3 py-1.5 rounded-lg border border-neon-yellow/40 text-neon-yellow bg-neon-yellow/10 hover:bg-neon-yellow/20 transition-colors flex items-center gap-1"
                    >
                      <Star size={11} fill="currentColor" /> {t('profile.partnerBtn')}
                    </button>
                  ) : (
                    <button
                      onClick={() => setAccountability.mutate()}
                      className="text-xs px-3 py-1.5 rounded-lg border border-dark-border text-slate-400 hover:border-neon-yellow/40 hover:text-neon-yellow hover:bg-neon-yellow/10 transition-colors flex items-center gap-1"
                    >
                      <Star size={11} /> {t('profile.setPartner')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* XP bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>{current.toLocaleString()} XP</span>
                <span>{t('profile.toLvl', { needed: needed.toLocaleString(), level: user.level + 1 })}</span>
              </div>
              <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-700"
                  style={{ width: `${percent}%`, boxShadow: '0 0 8px rgba(0,245,255,0.6)' }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-600 mt-2">
              {t('profile.memberSince', { date: formatDate(user.createdAt) })}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Dumbbell size={16} className="text-neon-green" />} label={t('profile.workoutsLabel')} value={user.totalWorkouts.toLocaleString()} color="green" />
        <StatCard icon={<Flame size={16} className="text-neon-orange" />} label={t('profile.streakLabel')} value={`${user.currentStreak}d`} color="pink" />
        <StatCard icon={<Weight size={16} className="text-neon-cyan" />} label={t('profile.totalWeightLabel')} value={`${(user.totalWeight / 1000).toFixed(1)}t`} color="cyan" />
        <StatCard icon={<Award size={16} className="text-neon-yellow" />} label={t('profile.prsLabel')} value={user.totalPRs.toLocaleString()} color="yellow" />
      </div>

      {/* Trophy showcase */}
      {user.trophies.length > 0 && (
        <Card neon="yellow">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={15} className="text-neon-yellow" />
            <p className="text-sm font-bold text-neon-yellow">{t('profile.trophiesTitle', { n: user.trophies.length })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.trophies.slice(0, 12).map(({ id, trophy }) => (
              <div key={id} title={`${trophy.name}`}
                className="w-10 h-10 rounded-xl bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-default"
              >
                {trophy.icon}
              </div>
            ))}
            {user.trophies.length > 12 && (
              <div className="w-10 h-10 rounded-xl bg-dark-hover border border-dark-border flex items-center justify-center text-xs text-slate-400">
                +{user.trophies.length - 12}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recent activity */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} className="text-neon-green" />
          <p className="text-sm font-bold text-slate-200">{t('profile.recentActivity')}</p>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-3">{t('profile.noActivity')}</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-green/15 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={14} className="text-neon-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">
                    {t('profile.workoutActivity', { muscles: item.muscleGroups.map((mg) => t('muscle.' + mg) || mg).join(', ') })}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('profile.sets', { n: item.totalSets })} · +{item.xpEarned} XP
                    {item.prCount > 0 && <span className="text-neon-yellow ml-2">🏆 {item.prCount} PR{item.prCount > 1 ? 's' : ''}</span>}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{formatDate(item.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Accountability partner info */}
      {isOwn && accountabilityPartnerId && (
        <Card neon="purple" className="flex items-center gap-3">
          <Star size={18} className="text-neon-purple flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neon-purple">{t('profile.accountabilityActive')}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t('profile.accountabilityDesc')}</p>
          </div>
          <Link href={`/social/profile/${accountabilityPartnerId}`} className="text-xs text-neon-cyan hover:underline">
            {t('profile.viewProfile')}
          </Link>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const borderMap: Record<string, string> = {
    green: 'border-neon-green/30', cyan: 'border-neon-cyan/30',
    pink: 'border-neon-pink/30', yellow: 'border-neon-yellow/30',
  };
  const textMap: Record<string, string> = {
    green: 'text-neon-green', cyan: 'text-neon-cyan',
    pink: 'text-neon-pink', yellow: 'text-neon-yellow',
  };
  return (
    <div className={cn('bg-dark-card border rounded-xl p-3 text-center', borderMap[color])}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className={cn('text-xl font-black', textMap[color])}>{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36" />
      <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      <Skeleton className="h-24" />
      <Skeleton className="h-40" />
    </div>
  );
}
