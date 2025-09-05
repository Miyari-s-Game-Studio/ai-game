
// src/components/layout/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { GameRules } from '@/types/game';

type Theme = 'theme-default' | 'theme-pixel' | 'theme-scifi' | 'theme-darksouls';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initializeTheme: (rules: GameRules) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('theme-default');
  const [isInitialized, setIsInitialized] = useState(false);

  const applyTheme = useCallback((themeToApply: Theme) => {
    const root = window.document.documentElement;
    
    // Remove old theme classes
    root.classList.remove('theme-default', 'theme-pixel', 'theme-scifi', 'theme-darksouls');
    
    // Add new theme class
    root.classList.add(themeToApply);

    if (themeToApply === 'theme-pixel') {
        root.classList.add('font-pixel');
    } else {
        root.classList.remove('font-pixel');
    }

    // Always apply dark mode
    root.classList.add('dark');
    
    // Save to local storage
    localStorage.setItem('ui-theme', themeToApply);
  }, []);

  const initializeTheme = useCallback((rules: GameRules) => {
    const savedTheme = localStorage.getItem('ui-theme') as Theme | null;
    
    const initialTheme = savedTheme || (rules.theme as Theme) || 'theme-default';

    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setIsInitialized(true);
  }, [applyTheme]);

  // Effect for non-game pages
  useEffect(() => {
    if (!isInitialized) {
        const savedTheme = localStorage.getItem('ui-theme') as Theme | null;
        
        const initialTheme = savedTheme || 'theme-default';

        setThemeState(initialTheme);
        applyTheme(initialTheme);
    }
  }, [isInitialized, applyTheme]);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, initializeTheme }}>
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
