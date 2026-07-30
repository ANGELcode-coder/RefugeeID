export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'normal' | 'large';
export type Language = 'en' | 'fr' | 'ar' | 'sw';

export interface Preferences {
  theme: ThemeMode;
  fontSize: FontSize;
  language: Language;
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

const PREFS_KEY = '@refugeeid_preferences';

const DEFAULT_PREFS: Preferences = {
  theme: 'system',
  fontSize: 'normal',
  language: 'en',
  notificationsEnabled: true,
  hasCompletedOnboarding: false,
};

function readPrefs(): Preferences {
  try {
    const json = localStorage.getItem(PREFS_KEY);
    return json ? { ...DEFAULT_PREFS, ...JSON.parse(json) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: Preferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export const preferences = {
  async get(): Promise<Preferences> {
    return readPrefs();
  },

  async set(prefs: Partial<Preferences>): Promise<void> {
    const current = readPrefs();
    writePrefs({ ...current, ...prefs });
  },

  async setTheme(theme: ThemeMode): Promise<void> {
    await this.set({ theme });
  },

  async setFontSize(fontSize: FontSize): Promise<void> {
    await this.set({ fontSize });
  },

  async setLanguage(language: Language): Promise<void> {
    await this.set({ language });
  },

  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await this.set({ notificationsEnabled: enabled });
  },

  async completeOnboarding(): Promise<void> {
    await this.set({ hasCompletedOnboarding: true });
  },
};

export const LANGUAGES: Record<Language, string> = {
  en: 'English',
  fr: 'Fran\u00e7ais',
  ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
  sw: 'Kiswahili',
};

export const FONT_SIZES: Record<FontSize, string> = {
  small: 'Small',
  normal: 'Normal',
  large: 'Large',
};

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};
