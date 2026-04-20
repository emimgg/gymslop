'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Lang, makeT } from '@/lib/i18n';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: ReturnType<typeof makeT>;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: makeT('es'),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const saved = localStorage.getItem('gymtracker-lang') as Lang | null;
    if (saved === 'en' || saved === 'es') {
      setLangState(saved);
    } else {
      const browserLang = navigator.language.toLowerCase();
      const detected: Lang = browserLang.startsWith('es') ? 'es' : 'en';
      setLangState(detected);
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('gymtracker-lang', l);
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: makeT(lang) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
