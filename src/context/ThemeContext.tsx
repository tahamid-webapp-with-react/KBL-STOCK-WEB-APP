import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, ThemeMode } from '../types';

interface ThemeConfig {
  id: ThemeName;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  isDarkByDefault?: boolean;
}

export const THEMES_LIST: ThemeConfig[] = [
  {
    id: 'corporate-light',
    name: 'Professional Corporate Light',
    description: 'Clean, crisp enterprise blue-slate palette',
    primaryColor: '#0284c7', // sky-600
    accentColor: '#0369a1',
  },
  {
    id: 'corporate-dark',
    name: 'Corporate Dark',
    description: 'Sophisticated deep charcoal & blue enterprise dark mode',
    primaryColor: '#38bdf8',
    accentColor: '#0ea5e9',
    isDarkByDefault: true,
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Maritime deep sapphire and cyan',
    primaryColor: '#2563eb',
    accentColor: '#06b6d4',
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    description: 'Fresh agricultural leaf & emerald hues',
    primaryColor: '#059669',
    accentColor: '#10b981',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Distinguished violet and indigo accents',
    primaryColor: '#7c3aed',
    accentColor: '#6366f1',
  },
  {
    id: 'slate-gray',
    name: 'Slate Gray',
    description: 'Modern minimalist slate & neutral steel',
    primaryColor: '#475569',
    accentColor: '#64748b',
  },
  {
    id: 'modern-teal',
    name: 'Modern Teal',
    description: 'Contemporary deep teal with mint vibrancy',
    primaryColor: '#0d9488',
    accentColor: '#14b8a6',
  },
  {
    id: 'executive-navy',
    name: 'Executive Navy',
    description: 'Classic deep navy with subtle amber gold',
    primaryColor: '#1e3a8a',
    accentColor: '#d97706',
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    description: 'Warm earth tones, harvest amber and terracotta',
    primaryColor: '#b45309',
    accentColor: '#d97706',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum legibility high contrast borders and surfaces',
    primaryColor: '#000000',
    accentColor: '#eab308',
  },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('potato_app_theme') as ThemeName) || 'corporate-light';
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('potato_app_mode') as ThemeMode) || 'light';
  });

  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeIsDark =
      mode === 'dark' ||
      (mode === 'system' && isSystemDark) ||
      theme === 'corporate-dark';

    setIsDark(activeIsDark);

    const root = document.documentElement;
    if (activeIsDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set theme attribute
    root.setAttribute('data-theme', theme);
  }, [theme, mode]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('potato_app_theme', newTheme);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('potato_app_mode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
