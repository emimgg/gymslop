'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import { type Lang } from '@/lib/i18n';
import {
  LayoutDashboard, Dumbbell, UtensilsCrossed,
  Scale, Heart, TrendingUp, Trophy, Users, Settings,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWorkoutStore } from '@/lib/workoutStore';
import { NeonButton } from '@/components/ui/NeonButton';
import { Modal } from '@/components/ui/Modal';

const tabKeys = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/routines',  icon: Dumbbell,        labelKey: 'nav.routines'  },
  { href: '/meals',     icon: UtensilsCrossed, labelKey: 'nav.meals'     },
  { href: '/weight',    icon: Scale,           labelKey: 'nav.weight'    },
  { href: '/feels',     icon: Heart,           labelKey: 'nav.feels'     },
  { href: '/progress',  icon: TrendingUp,      labelKey: 'nav.progress'  },
  { href: '/trophies',  icon: Trophy,          labelKey: 'nav.trophies'  },
  { href: '/social',    icon: Users,           labelKey: 'nav.social'    },
] as const;

// Mobile bottom bar shows only the core 5 tabs; progress/trophies/social live in the avatar dropdown
const mobileTabKeys = tabKeys.slice(0, 5);

const langs: { id: Lang; flag: string; label: string }[] = [
  { id: 'es', flag: '🇪🇸', label: 'ES' },
  { id: 'en', flag: '🇬🇧', label: 'EN' },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const { activeWorkout, minimizeWorkout, clearWorkout } = useWorkoutStore();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  function handleNavClick(e: React.MouseEvent, href: string) {
    if (!activeWorkout || pathname.startsWith(href)) return;
    e.preventDefault();
    setPendingHref(href);
  }

  function handleMinimizeAndNavigate() {
    minimizeWorkout();
    if (pendingHref) router.push(pendingHref);
    setPendingHref(null);
  }

  function handleDiscardAndNavigate() {
    clearWorkout();
    if (pendingHref) router.push(pendingHref);
    setPendingHref(null);
  }

  const { data: notifData } = useQuery<{ unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/social/notifications').then((r) => r.json()),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const unreadCount = notifData?.unreadCount ?? 0;

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-dark-card border-r border-dark-border px-3 py-6 fixed left-0 top-0">
        {/* Logo */}
        <div className="px-3 mb-8">
          <span className="text-lg font-bold neon-text-green tracking-widest">gym</span>
          <span className="text-lg font-bold text-slate-400 tracking-widest">slop</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {tabKeys.map(({ href, icon: Icon, labelKey }) => {
            const active = pathname.startsWith(href);
            const isSocial = href === '/social';
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                  active
                    ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                )}
              >
                <Icon size={16} />
                <span className="flex-1">{t(labelKey)}</span>
                {isSocial && unreadCount > 0 && (
                  <span className="min-w-[18px] h-4.5 px-1 rounded-full bg-neon-pink text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <Link
          href="/settings"
          onClick={(e) => handleNavClick(e, '/settings')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 mt-1',
            pathname.startsWith('/settings')
              ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
          )}
        >
          <Settings size={16} />
          <span className="flex-1">{t('nav.settings')}</span>
        </Link>

        {/* Language switcher */}
        <div className="mt-6 px-3 border-t border-dark-border pt-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">{t('nav.language')}</p>
          <div className="flex gap-1.5">
            {langs.map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[11px] transition-all duration-200',
                  lang === l.id
                    ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                    : 'border-dark-border text-slate-500 hover:border-dark-hover hover:text-slate-300'
                )}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 mt-3 text-[10px] text-slate-700">gymslop v1.0</div>
      </aside>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-card border-t border-dark-border">
        <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {mobileTabKeys.map(({ href, icon: Icon, labelKey }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-all duration-200 relative min-h-[44px] justify-center',
                  active ? 'text-neon-green' : 'text-slate-500'
                )}
              >
                <Icon size={18} />
                <span className="leading-none">{t(labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Workout nav guard dialog ──────────────────────────────────────── */}
      <Modal open={pendingHref !== null} onClose={() => setPendingHref(null)} title={t('workout.navGuardTitle')}>
        <p className="text-sm text-slate-400 mb-4">{t('workout.navGuardMessage')}</p>
        <div className="flex flex-col gap-2">
          <NeonButton variant="cyan" className="w-full" onClick={handleMinimizeAndNavigate}>
            {t('workout.minimize')}
          </NeonButton>
          <NeonButton variant="danger" className="w-full" onClick={handleDiscardAndNavigate}>
            {t('workout.discard')}
          </NeonButton>
          <NeonButton variant="ghost" className="w-full" onClick={() => setPendingHref(null)}>
            {t('workout.cancel')}
          </NeonButton>
        </div>
      </Modal>
    </>
  );
}
