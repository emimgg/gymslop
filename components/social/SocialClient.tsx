'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, UserPlus, Check, X, Trash2, Send, Flame, Users, Calendar, BarChart2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { cn, formatDate } from '@/lib/utils';
import { levelTitle } from '@/lib/xp';
import { useI18n } from '@/components/providers/I18nProvider';
import toast from 'react-hot-toast';

interface FriendUser {
  id: string; name: string | null; email: string | null;
  image: string | null; level: number; xp: number;
  currentStreak?: number; lastActiveAt?: string | null;
}
interface FriendRow { id: string; friend: FriendUser; since: string; }
interface PendingRow { id: string; sender?: FriendUser; receiver?: FriendUser; }
interface TrainingInvite {
  id: string; muscleGroup: string; proposedTime: string;
  message: string | null; status: string;
  sender: FriendUser; receiver: FriendUser;
}
interface FriendsData {
  friends: FriendRow[];
  pendingReceived: PendingRow[];
  pendingSent: PendingRow[];
}
interface InvitesData { received: TrainingInvite[]; sent: TrainingInvite[]; }

const MUSCLE_GROUPS = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'FULL_BODY'];
const MG_EMOJIS: Record<string, string> = {
  CHEST: '💪', BACK: '🏋️', LEGS: '🦵', SHOULDERS: '🔝', ARMS: '💪', FULL_BODY: '🔥',
};

function Avatar({ user, size = 32 }: { user: FriendUser; size?: number }) {
  if (user.image) {
    return <Image src={user.image} alt={user.name ?? ''} width={size} height={size} className="rounded-full" />;
  }
  return (
    <div
      className="rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center text-neon-green font-bold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {user.name?.[0] ?? '?'}
    </div>
  );
}

function isOnline(lastActiveAt?: string | null) {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 15 * 60 * 1000;
}

export function SocialClient() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const { t } = useI18n();
  const [tab, setTab] = useState<'friends' | 'invites' | 'search'>('friends');
  const [searchQ, setSearchQ] = useState('');
  const [showInviteModal, setShowInviteModal] = useState<FriendUser | null>(null);

  const { data: friendsData, isLoading: friendsLoading } = useQuery<FriendsData>({
    queryKey: ['friends'],
    queryFn: () => fetch('/api/social/friends').then((r) => r.json()),
  });

  const { data: invitesData, isLoading: invitesLoading } = useQuery<InvitesData>({
    queryKey: ['invites'],
    queryFn: () => fetch('/api/social/invites').then((r) => r.json()),
  });

  const { data: searchData, isLoading: searchLoading } = useQuery<{ users: FriendUser[] }>({
    queryKey: ['userSearch', searchQ],
    queryFn: () => fetch(`/api/social/friends/search?q=${encodeURIComponent(searchQ)}`).then((r) => r.json()),
    enabled: searchQ.length >= 2,
  });

  const respondFriend = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      fetch(`/api/social/friends/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(action === 'accept' ? t('social.requestAccepted') : t('social.requestDeclined'));
    },
  });

  const removeFriend = useMutation({
    mutationFn: (id: string) => fetch(`/api/social/friends/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['friends'] }); toast.success(t('social.friendRemoved')); },
  });

  const sendRequest = useMutation({
    mutationFn: (receiverId: string) =>
      fetch('/api/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['userSearch', searchQ] });
      toast.success(t('social.requestSent'));
    },
  });

  const respondInvite = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      fetch(`/api/social/invites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['invites'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(action === 'accept' ? t('social.inviteAccepted') : t('social.inviteDeclined'));
    },
  });

  const pendingCount = (friendsData?.pendingReceived?.length ?? 0) + (invitesData?.received?.filter((i) => i.status === 'PENDING').length ?? 0);

  return (
    <div className="space-y-4">
      {/* Leaderboard shortcut */}
      <Link
        href="/social/leaderboard"
        className="flex items-center justify-between p-3 rounded-xl border border-neon-yellow/30 bg-neon-yellow/5 hover:bg-neon-yellow/10 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-neon-yellow" />
          <span className="text-sm font-semibold text-neon-yellow">{t('social.leaderboardTitle')}</span>
        </div>
        <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{t('social.viewRankings')}</span>
      </Link>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1">
        {(['friends', 'invites', 'search'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize flex items-center justify-center gap-1.5',
              tab === tabKey ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {tabKey === 'friends' && <Users size={13} />}
            {tabKey === 'invites' && <Calendar size={13} />}
            {tabKey === 'search' && <Search size={13} />}
            {tabKey === 'friends'
              ? t('social.tabFriends', { n: friendsData?.friends?.length ?? 0 })
              : tabKey === 'invites'
              ? `${t('social.tabTraining')}${pendingCount > 0 ? ` (${pendingCount})` : ''}`
              : t('social.tabSearch')}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {(friendsData?.pendingReceived?.length ?? 0) > 0 && (
            <Card neon="cyan">
              <p className="text-xs font-semibold text-neon-cyan mb-3">
                {t('social.pendingRequests', { n: friendsData!.pendingReceived.length })}
              </p>
              <div className="space-y-2">
                {friendsData!.pendingReceived.map((req) => (
                  <div key={req.id} className="flex items-center gap-3">
                    {req.sender && <Avatar user={req.sender} size={36} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{req.sender?.name}</p>
                      <p className="text-xs text-slate-500">Level {req.sender?.level} · {levelTitle(req.sender?.level ?? 1)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => respondFriend.mutate({ id: req.id, action: 'accept' })}
                        className="p-1.5 rounded-lg bg-neon-green/15 text-neon-green hover:bg-neon-green/25 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => respondFriend.mutate({ id: req.id, action: 'decline' })}
                        className="p-1.5 rounded-lg bg-dark-hover text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {friendsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (friendsData?.friends?.length ?? 0) === 0 ? (
            <Card>
              <p className="text-center text-slate-500 text-sm py-4">{t('social.noFriends')}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {friendsData!.friends.map(({ id: friendshipId, friend }) => (
                <Card key={friendshipId} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar user={friend} size={40} />
                    <span className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-card',
                      isOnline(friend.lastActiveAt) ? 'bg-neon-green' : 'bg-slate-600',
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/social/profile/${friend.id}`} className="text-sm font-semibold text-slate-200 hover:text-neon-cyan transition-colors">
                      {friend.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Lv.{friend.level}</span>
                      <span>·</span>
                      <Flame size={11} className="text-neon-orange" />
                      <span>{friend.currentStreak ?? 0}d</span>
                      <span>·</span>
                      <span>
                        {isOnline(friend.lastActiveAt)
                          ? t('social.onlineNow')
                          : friend.lastActiveAt
                          ? t('social.active', { date: formatDate(friend.lastActiveAt) })
                          : t('social.neverActive')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowInviteModal(friend)}
                      className="p-1.5 rounded-lg text-neon-cyan hover:bg-neon-cyan/15 transition-colors"
                      title={t('social.sendInviteTitle')}
                    >
                      <Send size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(t('social.removeConfirm', { name: friend.name ?? '' }))) removeFriend.mutate(friendshipId); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title={t('social.removeFriendTitle')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Training Invites Tab */}
      {tab === 'invites' && (
        <div className="space-y-4">
          {invitesLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (
            <>
              {(invitesData?.received?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t('social.received')}</p>
                  <div className="space-y-2">
                    {invitesData!.received.map((inv) => (
                      <Card key={inv.id} neon={inv.status === 'PENDING' ? 'pink' : null} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar user={inv.sender} size={36} />
                          <div className="flex-1">
                            <p className="text-sm text-slate-200">
                              <span className="font-semibold text-neon-pink">{inv.sender.name}</span>
                              {' '}{t('social.challengedYou', { muscle: t('muscle.' + inv.muscleGroup) || inv.muscleGroup })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(inv.proposedTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {inv.message && <p className="text-xs text-slate-400 italic mt-1">"{inv.message}"</p>}
                          </div>
                        </div>
                        {inv.status === 'PENDING' && (
                          <div className="flex gap-2 pt-1">
                            <NeonButton variant="green" size="sm" onClick={() => respondInvite.mutate({ id: inv.id, action: 'accept' })} className="flex-1">
                              {t('social.accept')}
                            </NeonButton>
                            <NeonButton variant="pink" size="sm" onClick={() => respondInvite.mutate({ id: inv.id, action: 'decline' })} className="flex-1">
                              {t('social.decline')}
                            </NeonButton>
                          </div>
                        )}
                        {inv.status !== 'PENDING' && (
                          <span className={cn('text-xs font-medium', inv.status === 'ACCEPTED' ? 'text-neon-green' : 'text-slate-500')}>
                            {inv.status === 'ACCEPTED' ? t('social.accepted') : t('social.declined')}
                          </span>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {(invitesData?.sent?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t('social.sent')}</p>
                  <div className="space-y-2">
                    {invitesData!.sent.map((inv) => (
                      <Card key={inv.id} className="flex items-center gap-3">
                        <Avatar user={inv.receiver} size={36} />
                        <div className="flex-1">
                          <p className="text-sm text-slate-300">
                            {t('muscle.' + inv.muscleGroup) || inv.muscleGroup} with <span className="font-semibold">{inv.receiver.name}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(inv.proposedTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          inv.status === 'ACCEPTED' ? 'bg-neon-green/15 text-neon-green' :
                          inv.status === 'DECLINED' ? 'bg-red-400/15 text-red-400' :
                          'bg-neon-yellow/15 text-neon-yellow',
                        )}>
                          {inv.status}
                        </span>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {(invitesData?.received?.length ?? 0) === 0 && (invitesData?.sent?.length ?? 0) === 0 && (
                <Card>
                  <p className="text-center text-slate-500 text-sm py-4">{t('social.noInvites')}</p>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div className="space-y-3">
          <NeonInput
            placeholder={t('social.searchPlaceholder')}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {searchLoading && searchQ.length >= 2 && (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          )}
          {(searchData?.users ?? []).length > 0 && (
            <div className="space-y-2">
              {searchData!.users.map((user) => (
                <Card key={user.id} className="flex items-center gap-3">
                  <Avatar user={user} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500">Level {user.level} · {levelTitle(user.level)}</p>
                  </div>
                  <button
                    onClick={() => sendRequest.mutate(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/15 text-neon-green border border-neon-green/30 text-xs font-medium hover:bg-neon-green/25 transition-colors"
                  >
                    <UserPlus size={12} />
                    {t('social.add')}
                  </button>
                </Card>
              ))}
            </div>
          )}
          {searchQ.length >= 2 && !searchLoading && (searchData?.users ?? []).length === 0 && (
            <Card><p className="text-center text-slate-500 text-sm py-3">{t('social.noUsersFound', { q: searchQ })}</p></Card>
          )}
          {searchQ.length > 0 && searchQ.length < 2 && (
            <p className="text-xs text-slate-500 text-center">{t('social.searchHint')}</p>
          )}

          {(friendsData?.pendingSent?.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t('social.pendingSent')}</p>
              <div className="space-y-2">
                {friendsData!.pendingSent.map((req) => (
                  <Card key={req.id} className="flex items-center gap-3">
                    {req.receiver && <Avatar user={req.receiver} size={32} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{req.receiver?.name}</p>
                      <p className="text-xs text-slate-500">{t('social.requestPending')}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showInviteModal && (
        <TrainingInviteModal
          friend={showInviteModal}
          onClose={() => setShowInviteModal(null)}
          onSent={() => { setShowInviteModal(null); qc.invalidateQueries({ queryKey: ['invites'] }); }}
        />
      )}
    </div>
  );
}

function TrainingInviteModal({ friend, onClose, onSent }: { friend: FriendUser; onClose: () => void; onSent: () => void }) {
  const [muscleGroup, setMuscleGroup] = useState('CHEST');
  const [proposedTime, setProposedTime] = useState('');
  const [message, setMessage] = useState('');
  const { t } = useI18n();

  const send = useMutation({
    mutationFn: () =>
      fetch('/api/social/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: friend.id, muscleGroup, proposedTime, message }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      toast.success(t('social.inviteSent', { name: friend.name ?? '' }));
      onSent();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card border border-neon-pink/40 rounded-2xl p-6 w-full max-w-sm shadow-card-pink space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neon-pink">{t('social.challengeTitle', { name: friend.name ?? '' })}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">{t('social.muscleGroupLabel')}</p>
          <div className="grid grid-cols-3 gap-2">
            {MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                onClick={() => setMuscleGroup(mg)}
                className={cn(
                  'py-2 rounded-lg text-xs font-medium border transition-all',
                  muscleGroup === mg ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink' : 'border-dark-border text-slate-400 hover:border-slate-400',
                )}
              >
                {MG_EMOJIS[mg]} {t('muscle.' + mg)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">{t('social.proposedDateTime')}</p>
          <input
            type="datetime-local"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            className="w-full bg-dark-hover border border-dark-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-neon-pink/50"
          />
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">{t('social.messageOptional')}</p>
          <input
            type="text"
            placeholder={t('social.messagePlaceholder', { muscle: t('muscle.' + muscleGroup) })}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-dark-hover border border-dark-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neon-pink/50"
          />
        </div>

        <NeonButton
          variant="pink"
          className="w-full"
          onClick={() => send.mutate()}
          disabled={!proposedTime || send.isPending}
        >
          {send.isPending ? t('social.sending') : t('social.sendChallenge')}
        </NeonButton>
      </div>
    </div>
  );
}
