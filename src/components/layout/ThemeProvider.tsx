
// src/components/layout/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { GameRules } from '@/types/game';

type Theme = 'theme-default' | 'theme-forest' | 'theme-ocean' | 'theme-crimson' | 'theme-pixel';
type Mode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  toggleMode: () => void;
  initializeTheme: (rules: GameRules) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('theme-default');
  const [mode, setModeState] = useState<Mode>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  const applyTheme = useCallback((themeToApply: Theme, modeToApply: Mode) => {
    const root = window.document.documentElement;
    
    // Remove old theme classes
    root.classList.remove('theme-default', 'theme-forest', 'theme-ocean', 'theme-crimson', 'theme-pixel');
    
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

  const initializeTheme = useCallback((rules: GameRules) => {
    const savedTheme = localStorage.getItem('ui-theme') as Theme | null;
    const savedMode = localStorage.getItem('ui-mode') as Mode | null;
    
    const initialTheme = savedTheme || (rules.theme as Theme) || 'theme-default';
    const initialMode = savedMode || 'dark';

    setThemeState(initialTheme);
    setModeState(initialMode);
    applyTheme(initialTheme, initialMode);
    setIsInitialized(true);
  }, [applyTheme]);

  // Effect for non-game pages
  useEffect(() => {
    if (!isInitialized) {
        const savedTheme = localStorage.getItem('ui-theme') as Theme | null;
        const savedMode = localStorage.getItem('ui-mode') as Mode | null;
        
        const initialTheme = savedTheme || 'theme-default';
        const initialMode = savedMode || 'dark';

        setThemeState(initialTheme);
        setModeState(initialMode);
        applyTheme(initialTheme, initialMode);
    }
  }, [isInitialized, applyTheme]);
  
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
    <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode, initializeTheme }}>
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

    