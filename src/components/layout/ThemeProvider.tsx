// src/components/layout/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { defaultGameRules } from '@/lib/game-rules';

type Theme = 'theme-default' | 'theme-forest' | 'theme-ocean' | 'theme-crimson';
type Mode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => (defaultGameRules.theme as Theme) || 'theme-default');
  const [mode, setModeState] = useState<Mode>('dark');

  const applyTheme = useCallback((themeToApply: Theme, modeToApply: Mode) => {
    const root = window.document.documentElement;
    
    // Remove old theme classes
    root.classList.remove('theme-default', 'theme-forest', 'theme-ocean', 'theme-crimson');
    
    // Add new theme class
    root.classList.add(themeToApply);

    // Handle dark/light mode
    if (modeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to local storage
    localStorage.setItem('ui-theme', themeToApply);
    localStorage.setItem('ui-mode', modeToApply);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('ui-theme') as Theme | null;
    const savedMode = localStorage.getItem('ui-mode') as Mode | null;
    
    const initialTheme = savedTheme || (defaultGameRules.theme as Theme) || 'theme-default';
    const initialMode = savedMode || 'dark';

    setThemeState(initialTheme);
    setModeState(initialMode);
    applyTheme(initialTheme, initialMode);
  }, [applyTheme]);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme, mode);
  };

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setModeState(newMode);
    applyTheme(theme, newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
