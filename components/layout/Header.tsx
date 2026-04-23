'use client';

'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, User, TrendingUp, Trophy, Users, Settings } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/components/providers/I18nProvider';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';
import { type Lang } from '@/lib/i18n';
import { NotificationBell } from '@/components/social/NotificationBell';
import { cn } from '@/lib/utils';

const themes: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: 'minimal', label: 'Minimal', bg: '#18181b', accent: '#4ade80' },
  { id: 'light',   label: 'Light',   bg: '#f8fafc', accent: '#1677eb' },
  { id: 'neon',    label: 'Neon',    bg: '#080b12', accent: '#39ff14' },
];

const langs: { id: Lang; flag: string; label: string }[] = [
  { id: 'es', flag: '🇪🇸', label: 'ES' },
  { id: 'en', flag: '🇬🇧', label: 'EN' },
];

export function Header({ titleKey }: { titleKey: string }) {
  const { data: session } = useSession();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-bold text-slate-100 tracking-wide">{t(titleKey)}</h1>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-neon-cyan/40 transition-all"
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center text-neon-green text-xs font-bold">
                {session?.user?.name?.[0] ?? '?'}
              </div>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-card z-20 py-1 text-sm">
                <div className="px-3 py-2 border-b border-dark-border">
                  <p className="font-medium text-slate-200 truncate">{session?.user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                </div>
                {session?.user?.id && (
                  <Link
                    href="/social/profile/me"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-neon-cyan hover:bg-dark-hover transition-colors text-sm"
                  >
                    <User size={14} />
                    {t('profile.myProfile')}
                  </Link>
                )}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 transition-colors text-sm',
                    pathname.startsWith('/settings')
                      ? 'text-neon-green'
                      : 'text-slate-400 hover:text-neon-cyan hover:bg-dark-hover'
                  )}
                >
                  <Settings size={14} />
                  {t('nav.settings')}
                </Link>
                {/* Progress / Trophies / Social — mobile only (hidden from bottom nav) */}
                <div className="lg:hidden border-t border-dark-border mt-1 pt-1">
                  <p className="px-3 pt-1 pb-1 text-[10px] text-slate-600 uppercase tracking-wider">{t('nav.more')}</p>
                  {[
                    { href: '/progress', icon: TrendingUp, labelKey: 'nav.progress' },
                    { href: '/trophies', icon: Trophy,     labelKey: 'nav.trophies' },
                    { href: '/social',   icon: Users,      labelKey: 'nav.social'   },
                  ].map(({ href, icon: Icon, labelKey }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 transition-colors text-sm',
                        pathname.startsWith(href)
                          ? 'text-neon-green'
                          : 'text-slate-400 hover:text-neon-cyan hover:bg-dark-hover'
                      )}
                    >
                      <Icon size={14} />
                      {t(labelKey)}
                    </Link>
                  ))}
                </div>
                {/* Theme + language — mobile only */}
                <div className="lg:hidden border-t border-dark-border mt-1 pt-1">
                  <p className="px-3 pt-1 pb-1 text-[10px] text-slate-600 uppercase tracking-wider">{t('nav.theme')}</p>
                  <div className="flex gap-1 px-3 pb-1">
                    {themes.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setTheme(th.id)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg border text-[10px] transition-all',
                          theme === th.id
                            ? 'border-neon-green/50 bg-neon-green/10 text-neon-green'
                            : 'border-dark-border text-slate-500 hover:text-slate-300',
                        )}
                      >
                        <span
                          className="w-6 h-3.5 rounded flex items-center justify-center"
                          style={{ backgroundColor: th.bg, border: `1px solid ${th.accent}44` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: th.accent }} />
                        </span>
                        {th.label}
                      </button>
                    ))}
                  </div>
                  <p className="px-3 pt-1 pb-1 text-[10px] text-slate-600 uppercase tracking-wider">{t('nav.language')}</p>
                  <div className="flex gap-1 px-3 pb-2">
                    {langs.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLang(l.id)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[11px] transition-all',
                          lang === l.id
                            ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                            : 'border-dark-border text-slate-500 hover:text-slate-300',
                        )}
                      >
                        {l.flag} {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-dark-border mt-1 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-dark-hover transition-colors"
                >
                  <LogOut size={14} />
                  {t('common.signOut')}
                </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
