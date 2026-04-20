'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';
import { useI18n } from '@/components/providers/I18nProvider';
import { type Lang } from '@/lib/i18n';
import {
  LayoutDashboard, Dumbbell, UtensilsCrossed,
  Scale, Heart, TrendingUp, Trophy, Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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

const themes: { id: Theme; label: string; title: string; bg: string; accent: string }[] = [
  { id: 'minimal', label: 'Minimal', title: 'Minimal — clean dark (default)', bg: '#18181b', accent: '#4ade80' },
  { id: 'light',   label: 'Light',   title: 'Light — clean light mode',       bg: '#f8fafc', accent: '#1677eb' },
  { id: 'neon',    label: 'Neon',    title: 'Neon — cyberpunk glow',          bg: '#080b12', accent: '#39ff14' },
];

const langs: { id: Lang; flag: string; label: string }[] = [
  { id: 'es', flag: '🇪🇸', label: 'ES' },
  { id: 'en', flag: '🇬🇧', label: 'EN' },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

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

        {/* Theme switcher */}
        <div className="mt-6 px-3 border-t border-dark-border pt-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">{t('nav.theme')}</p>
          <div className="flex gap-1.5">
            {themes.map((th) => (
              <button
                key={th.id}
                title={th.title}
                onClick={() => setTheme(th.id)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg border text-[10px] transition-all duration-200',
                  theme === th.id
                    ? 'border-neon-green/50 bg-neon-green/10 text-neon-green'
                    : 'border-dark-border text-slate-500 hover:border-dark-hover hover:text-slate-300'
                )}
              >
                {/* Hardcoded inline swatch — independent of current theme */}
                <span
                  className="w-7 h-4 rounded flex items-center justify-center"
                  style={{ backgroundColor: th.bg, border: `1px solid ${th.accent}44` }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: th.accent }}
                  />
                </span>
                <span>{th.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language switcher */}
        <div className="mt-3 px-3">
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
          {tabKeys.map(({ href, icon: Icon, labelKey }) => {
            const active = pathname.startsWith(href);
            const isSocial = href === '/social';
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-all duration-200 relative min-h-[44px] justify-center',
                  active ? 'text-neon-green' : 'text-slate-500'
                )}
              >
                <div className="relative">
                  <Icon size={18} />
                  {isSocial && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-neon-pink text-[8px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="leading-none">{t(labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
