import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Preferences, preferences } from './preferences';

interface ThemeContextType {
  prefs: Preferences;
  isDark: boolean;
  updateTheme: (theme: Preferences['theme']) => Promise<void>;
  updateFontSize: (size: Preferences['fontSize']) => Promise<void>;
  updateLanguage: (lang: Preferences['language']) => Promise<void>;
  updateNotifications: (enabled: boolean) => Promise<void>;
  scaleSize: (small: number, normal: number, large: number) => number;
}

const ThemeContext = createContext<ThemeContextType>({
  prefs: { theme: 'system', fontSize: 'normal', language: 'en', notificationsEnabled: true, hasCompletedOnboarding: false },
  isDark: false,
  updateTheme: async () => {},
  updateFontSize: async () => {},
  updateLanguage: async () => {},
  updateNotifications: async () => {},
  scaleSize: (_s, n, _l) => n,
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemColor = useColorScheme();
  const [prefs, setPrefs] = useState<Preferences>({
    theme: 'system',
    fontSize: 'normal',
    language: 'en',
    notificationsEnabled: true,
    hasCompletedOnboarding: false,
  });

  useEffect(() => {
    preferences.get().then(setPrefs);
  }, []);

  const isDark =
    prefs.theme === 'dark' || (prefs.theme === 'system' && systemColor === 'dark');

  const updateTheme = async (theme: Preferences['theme']) => {
    await preferences.setTheme(theme);
    setPrefs((p) => ({ ...p, theme }));
  };

  const updateFontSize = async (fontSize: Preferences['fontSize']) => {
    await preferences.setFontSize(fontSize);
    setPrefs((p) => ({ ...p, fontSize }));
  };

  const updateLanguage = async (language: Preferences['language']) => {
    await preferences.setLanguage(language);
    setPrefs((p) => ({ ...p, language }));
  };

  const updateNotifications = async (notificationsEnabled: boolean) => {
    await preferences.setNotificationsEnabled(notificationsEnabled);
    setPrefs((p) => ({ ...p, notificationsEnabled }));
  };

  const scaleSize = (small: number, normal: number, large: number) => {
    switch (prefs.fontSize) {
      case 'small': return small;
      case 'large': return large;
      default: return normal;
    }
  };

  return (
    <ThemeContext.Provider
      value={{ prefs, isDark, updateTheme, updateFontSize, updateLanguage, updateNotifications, scaleSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const usePreferences = () => useContext(ThemeContext);
