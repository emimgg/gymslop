'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/providers/I18nProvider';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  FRIEND_REQUEST: '👋',
  FRIEND_ACCEPTED: '🤝',
  TRAINING_INVITE: '🏋️',
  TRAINING_ACCEPTED: '✅',
  FRIEND_PR: '💪',
  FRIEND_TROPHY: '🏆',
  ACCOUNTABILITY_MISS: '👀',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();
  const { t, lang } = useI18n();

  const { data } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/social/notifications').then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id?: string) =>
      fetch('/api/social/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  function handleClick(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unread > 0) markRead.mutate(undefined);
        }}
        className="relative p-2 rounded-lg hover:bg-dark-hover transition-colors"
        aria-label={t('notif.title')}
      >
        <Bell size={18} className={cn(unread > 0 ? 'text-neon-cyan' : 'text-slate-400')} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-neon-pink text-[9px] font-bold text-white flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-xl shadow-card z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200">{t('notif.title')}</p>
              {unread > 0 && (
                <button
                  onClick={() => markRead.mutate(undefined)}
                  className="text-[11px] text-neon-cyan hover:underline"
                >
                  {t('notif.markAllRead')}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">{t('notif.empty')}</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-dark-border/50 hover:bg-dark-hover transition-colors flex gap-3',
                      !n.read && 'bg-neon-cyan/5',
                    )}
                  >
                    <span className="text-lg leading-none mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs leading-snug', n.read ? 'text-slate-400' : 'text-slate-200')}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-neon-cyan mt-1 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
