'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { useI18n } from '@/components/providers/I18nProvider';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';
import { type Lang } from '@/lib/i18n';
import { useUserProfile, useAdvancedView } from '@/lib/useAdvancedView';
import { cn } from '@/lib/utils';
import { LogOut, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

const themes: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: 'minimal', label: 'Minimal', bg: '#18181b', accent: '#4ade80' },
  { id: 'light',   label: 'Light',   bg: '#f8fafc', accent: '#1677eb' },
  { id: 'neon',    label: 'Neon',    bg: '#080b12', accent: '#39ff14' },
];

const langs: { id: Lang; flag: string; label: string }[] = [
  { id: 'es', flag: '🇪🇸', label: 'Español' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3 px-1">{title}</p>
  );
}

export function SettingsClient() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading } = useUserProfile();
  const advancedView = useAdvancedView();

  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [togglingAdvanced, setTogglingAdvanced] = useState(false);

  // Sync name from profile once loaded
  const resolvedName = displayName !== '' ? displayName : (userProfile?.name ?? session?.user?.name ?? '');

  async function handleToggleAdvancedView() {
    setTogglingAdvanced(true);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advancedView: !advancedView }),
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success(t('settings.saved'));
    } finally {
      setTogglingAdvanced(false);
    }
  }

  async function handleSaveName() {
    if (!resolvedName.trim()) return;
    setSavingName(true);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: resolvedName.trim() }),
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success(t('settings.saved'));
    } finally {
      setSavingName(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-dark-card border border-dark-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl">

      {/* ── Perfil ────────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title={t('settings.profile')} />
        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="avatar"
                width={48}
                height={48}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center text-neon-green font-bold text-lg shrink-0">
                {resolvedName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-100 truncate">{resolvedName || session?.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <NeonInput
              label={t('settings.displayName')}
              value={resolvedName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('settings.displayNamePlaceholder')}
              className="flex-1"
            />
            <NeonButton
              variant="cyan"
              size="sm"
              loading={savingName}
              onClick={handleSaveName}
              className="mb-px"
            >
              {t('common.save')}
            </NeonButton>
          </div>
        </Card>
      </section>

      {/* ── Preferencias ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title={t('settings.preferences')} />
        <Card className="space-y-5">
          <div>
            <p className="text-xs text-slate-400 mb-2">{t('settings.language')}</p>
            <div className="flex gap-2">
              {langs.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-all',
                    lang === l.id
                      ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                      : 'border-dark-border text-slate-400 hover:border-slate-500 hover:text-slate-200',
                  )}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">{t('settings.theme')}</p>
            <div className="flex gap-2">
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs transition-all',
                    theme === th.id
                      ? 'border-neon-green/50 bg-neon-green/10 text-neon-green'
                      : 'border-dark-border text-slate-500 hover:border-slate-500 hover:text-slate-300',
                  )}
                >
                  <span
                    className="w-8 h-5 rounded flex items-center justify-center"
                    style={{ backgroundColor: th.bg, border: `1px solid ${th.accent}44` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: th.accent }} />
                  </span>
                  {th.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* ── Vista ─────────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title={t('settings.view')} />
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-200 text-sm">{t('settings.advancedView')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('settings.advancedViewDesc')}</p>
              <p className={cn(
                'text-xs mt-2 font-medium',
                advancedView ? 'text-neon-cyan' : 'text-slate-500',
              )}>
                {advancedView ? t('settings.advancedOn') : t('settings.advancedOff')}
              </p>
            </div>
            <button
              onClick={handleToggleAdvancedView}
              disabled={togglingAdvanced}
              className={cn(
                'shrink-0 w-12 h-6 rounded-full border-2 transition-all duration-200 relative',
                advancedView
                  ? 'bg-neon-cyan border-neon-cyan/50'
                  : 'bg-dark-muted border-dark-border',
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                advancedView ? 'left-6' : 'left-0.5',
              )} />
              <span className="sr-only">{t('settings.advancedView')}</span>
            </button>
          </div>

          {advancedView && (
            <div className="mt-3 pt-3 border-t border-dark-border">
              <p className="text-[11px] text-slate-500 font-medium mb-1.5">{t('settings.advancedView')} unlocks:</p>
              <ul className="space-y-0.5 text-[11px] text-slate-600">
                {[
                  'Routines: volume analytics, frequency heatmap, sets per muscle chart',
                  'Workout: RIR/RPE inputs per set with target tracking',
                  'Weight: full TDEE breakdown, rolling averages',
                  'Meals: full macro breakdown per meal, weekly charts',
                  'Progress: PR history, e1RM charts',
                  'Feels: correlation analysis',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-neon-cyan shrink-0 mt-0.5">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      {/* ── Cuenta ────────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title={t('settings.account')} />
        <Card>
          <NeonButton
            variant="danger"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={14} />
            {t('settings.signOut')}
          </NeonButton>
        </Card>
      </section>

    </div>
  );
}
