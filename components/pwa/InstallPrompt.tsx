'use client';

import { useEffect, useState } from 'react';
import { X, Share } from 'lucide-react';

type PromptState = 'hidden' | 'android' | 'ios';

const STORAGE_KEY = 'pwa-install-dismissed';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function InstallPrompt() {
  const [state, setState] = useState<PromptState>('hidden');
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    if (isIOS()) {
      // Delay slightly so it doesn't flash on first render
      const t = setTimeout(() => setState('ios'), 2000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
      setState('android');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setState('hidden');
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem(STORAGE_KEY, '1');
    setState('hidden');
    setDeferredPrompt(null);
  }

  if (state === 'hidden') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto bg-dark-card border border-dark-border rounded-2xl px-4 py-3 shadow-2xl flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-black text-neon-green">gs</span>
        </div>
        <div className="flex-1 min-w-0">
          {state === 'android' && (
            <>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                Instalá gymslop en tu pantalla de inicio
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Para acceso rápido, sin navegador</p>
              <button
                onClick={install}
                className="mt-2 px-3 py-1.5 rounded-lg bg-neon-green/15 border border-neon-green/30 text-neon-green text-xs font-semibold transition-colors hover:bg-neon-green/25"
              >
                Instalar
              </button>
            </>
          )}
          {state === 'ios' && (
            <>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                Instalá gymslop en tu iPhone
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Tocá <Share size={11} className="inline -mt-0.5 mx-0.5" /> <strong>Compartir</strong> → <strong>Agregar a pantalla de inicio</strong>
              </p>
            </>
          )}
        </div>
        <button onClick={dismiss} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 p-0.5">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
