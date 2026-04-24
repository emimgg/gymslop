'use client';

import { signIn } from 'next-auth/react';
import { Github, UserRound, Zap } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';

const IS_DEV = process.env.NODE_ENV === 'development';

export function LoginPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-pattern bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter">
            <span className="neon-text-green">gym</span>
            <span className="text-slate-400">slop</span>
          </h1>
          <p className="mt-3 text-slate-500 text-sm">{t('login.tagline')}</p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center text-xs">
          {[
            { icon: '🏋️', label: t('login.workoutTracker'), sub: t('login.prsRoutines') },
            { icon: '🥗', label: t('login.nutritionLog'),   sub: t('login.macrosCalories') },
            { icon: '🏆', label: t('login.gamification'),   sub: t('login.xpTrophies') },
          ].map((f) => (
            <div key={f.label} className="bg-dark-card border border-dark-border rounded-xl p-3">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="font-semibold text-slate-300">{f.label}</div>
              <div className="text-slate-500">{f.sub}</div>
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-3">
          <p className="text-center text-xs text-slate-500 mb-4 uppercase tracking-wider">{t('login.signIn')}</p>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-dark-border bg-dark-hover text-slate-200 hover:border-neon-cyan/40 hover:text-neon-cyan transition-all duration-200 text-sm font-medium"
          >
            <GoogleIcon />
            {t('login.continueGoogle')}
          </button>

          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-dark-border bg-dark-hover text-slate-200 hover:border-neon-green/40 hover:text-neon-green transition-all duration-200 text-sm font-medium"
          >
            <Github size={18} />
            {t('login.continueGithub')}
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-dark-card px-2 text-xs text-slate-600">o</span>
            </div>
          </div>

          <button
            onClick={() => signIn('guest', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-all duration-200 text-sm font-medium"
          >
            <UserRound size={18} />
            Entrar como invitado (Prof. Silvia)
          </button>

          {IS_DEV && (
            <>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-yellow-900/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-dark-card px-2 text-[10px] text-yellow-700 font-mono uppercase tracking-widest">dev only</span>
                </div>
              </div>

              <a
                href="/api/auth/dev-login"
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-yellow-700/40 bg-yellow-950/20 text-yellow-500 hover:border-yellow-600/60 hover:bg-yellow-950/40 hover:text-yellow-400 transition-all duration-200 text-sm font-medium"
              >
                <Zap size={16} />
                Dev Login — seed user
              </a>
            </>
          )}

          <p className="text-center text-xs text-slate-600 mt-4">{t('login.private')}</p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
