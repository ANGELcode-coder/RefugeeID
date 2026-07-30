import React, { createContext, useContext, useEffect, useState } from 'react';

export type FontSize = 'normal' | 'large' | 'xlarge';

interface WalletPrefs {
  darkMode: boolean;
  fontSize: FontSize;
  language: string;
  setDarkMode: (v: boolean) => void;
  setFontSize: (v: FontSize) => void;
  setLanguage: (v: string) => void;
}

const WalletPrefsContext = createContext<WalletPrefs | undefined>(undefined);

const LS_DARK = 'wallet_dark';
const LS_FONT = 'wallet_font';
const LS_LANG = 'wallet_lang';

export function WalletPrefsProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(() => localStorage.getItem(LS_DARK) === 'true');
  const [fontSize, setFontSizeState] = useState<FontSize>(() => (localStorage.getItem(LS_FONT) as FontSize) || 'normal');
  const [language, setLanguageState] = useState(() => localStorage.getItem(LS_LANG) || 'en');

  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem(LS_DARK, String(v));
  };

  const setFontSize = (v: FontSize) => {
    setFontSizeState(v);
    localStorage.setItem(LS_FONT, v);
  };

  const setLanguage = (v: string) => {
    setLanguageState(v);
    localStorage.setItem(LS_LANG, v);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return () => root.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const sizes: Record<FontSize, string> = { normal: '16px', large: '18px', xlarge: '21px' };
    document.documentElement.style.setProperty('--wallet-base-size', sizes[fontSize]);
  }, [fontSize]);

  return (
    <WalletPrefsContext.Provider value={{ darkMode, fontSize, language, setDarkMode, setFontSize, setLanguage }}>
      {children}
    </WalletPrefsContext.Provider>
  );
}

export function useWalletPrefs() {
  const ctx = useContext(WalletPrefsContext);
  if (!ctx) throw new Error('useWalletPrefs must be used within WalletPrefsProvider');
  return ctx;
}
