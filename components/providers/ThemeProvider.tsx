'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'minimal' | 'light' | 'neon';

const VALID_THEMES: Theme[] = ['minimal', 'light', 'neon'];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'minimal',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('minimal');

  useEffect(() => {
    const saved = localStorage.getItem('gymtracker-theme') as Theme | null;
    if (saved && VALID_THEMES.includes(saved)) {
      setThemeState(saved);
    }
    // No saved value → keep 'minimal' (already the state default)
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...VALID_THEMES.map((t) => `theme-${t}`));
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('gymtracker-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
