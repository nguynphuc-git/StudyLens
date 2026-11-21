import {useCallback, useEffect, useLayoutEffect, useState} from 'react';

export interface AppearancePreferences {
  theme: 'light' | 'dark';
  background: 'paper' | 'sage' | 'blue' | 'rose';
  font: 'sans' | 'serif';
  textSize: number;
  textColor: 'default' | 'blue' | 'plum';
}

export const APPEARANCE_STORAGE_KEY = 'mathfolio-appearance-v1';
export const DEFAULT_APPEARANCE: Readonly<AppearancePreferences> = Object.freeze({
  theme: 'light', background: 'paper', font: 'sans', textSize: 16,
  textColor: 'default',
});

function choice<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return typeof value === 'string' && choices.includes(value as T) ? value as T : fallback;
}

/** Only allow known preferences, including when recovering older or damaged records. */
export function parseAppearancePreferences(value: unknown,systemDark=false): AppearancePreferences {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return {
    theme: record.theme==='system'?(systemDark?'dark':'light'):choice(record.theme, ['light', 'dark'], DEFAULT_APPEARANCE.theme),
    background: choice(record.background, ['paper', 'sage', 'blue', 'rose'], DEFAULT_APPEARANCE.background),
    font: choice(record.font, ['sans', 'serif'], DEFAULT_APPEARANCE.font),
    textSize: typeof record.textSize === 'number' && Number.isFinite(record.textSize)
      ? Math.max(14, Math.min(24, Math.round(record.textSize))) : DEFAULT_APPEARANCE.textSize,
    textColor: choice(record.textColor, ['default', 'blue', 'plum'], DEFAULT_APPEARANCE.textColor),
  };
}

function browserStorage(): Storage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch { return undefined; }
}

export function loadAppearancePreferences(
  storage: Pick<Storage, 'getItem'> | undefined = browserStorage(),
): AppearancePreferences {
  try {
    const saved = storage?.getItem(APPEARANCE_STORAGE_KEY);
    return parseAppearancePreferences(saved ? JSON.parse(saved) : undefined,typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch { return {...DEFAULT_APPEARANCE}; }
}

export function saveAppearancePreferences(
  preferences: AppearancePreferences,
  storage: Pick<Storage, 'setItem'> | undefined = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(parseAppearancePreferences(preferences)));
    return true;
  } catch { return false; }
}

export interface AppearanceController {
  preferences: AppearancePreferences;
  resolvedTheme: 'light' | 'dark';
  savedLocally: boolean;
  updateAppearance: (patch: Partial<AppearancePreferences>) => void;
  resetAppearance: () => void;
}

export function useAppearance(): AppearanceController {
  const [preferences, setPreferences] = useState(loadAppearancePreferences);
  const [savedLocally, setSavedLocally] = useState(true);
  const resolvedTheme = preferences.theme;

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.paper = preferences.background;
    root.dataset.readingFont = preferences.font;
    root.dataset.ink = preferences.textColor;
    root.dataset.readingAlign = 'left';
    root.style.setProperty('--reading-size', `${preferences.textSize}px`);
  }, [preferences, resolvedTheme]);

  useEffect(() => {
    setSavedLocally(saveAppearancePreferences(preferences));
  }, [preferences]);

  const updateAppearance = useCallback((patch: Partial<AppearancePreferences>) => {
    setPreferences(current => parseAppearancePreferences({...current, ...patch}));
  }, []);
  const resetAppearance = useCallback(() => setPreferences({...DEFAULT_APPEARANCE}), []);

  return {preferences, resolvedTheme, savedLocally, updateAppearance, resetAppearance};
}
