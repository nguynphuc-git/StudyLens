import {describe, expect, it} from 'vitest';
import {
  APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE, loadAppearancePreferences,
  parseAppearancePreferences, saveAppearancePreferences,
} from '../src/appearance';

describe('recoverable appearance preferences', () => {
  it('resolves legacy System once into an explicit theme and drops obsolete alignment',()=>{
    expect(parseAppearancePreferences({theme:'system',alignment:'justify'},true).theme).toBe('dark');
    expect(parseAppearancePreferences({theme:'system'},false).theme).toBe('light');
    expect(parseAppearancePreferences({theme:'dark',alignment:'justify'})).not.toHaveProperty('alignment');
  });
  it('restores valid preferences without losing settings absent from an older record', () => {
    const preferences = loadAppearancePreferences({getItem: () => JSON.stringify({theme: 'dark', font: 'serif'})});
    expect(preferences).toEqual({...DEFAULT_APPEARANCE, theme: 'dark', font: 'serif'});
    const stored = new Map<string, string>();
    const storage = {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => { stored.set(key, value); },
    };
    const customized = {...preferences, background: 'sage' as const, textSize: 19, textColor: 'plum' as const};
    expect(saveAppearancePreferences(customized, storage)).toBe(true);
    expect(loadAppearancePreferences(storage)).toEqual(customized);
    expect(stored.has(APPEARANCE_STORAGE_KEY)).toBe(true);
    expect(saveAppearancePreferences({...DEFAULT_APPEARANCE}, storage)).toBe(true);
    expect(loadAppearancePreferences(storage)).toEqual(DEFAULT_APPEARANCE);
  });

  it('recovers malformed records and unavailable storage without breaking the page', () => {
    for (const raw of ['', '{broken', 'null', '[]', '42', '"dark"']) {
      expect(loadAppearancePreferences({getItem: () => raw})).toEqual(DEFAULT_APPEARANCE);
    }
    const unavailable = {
      getItem: () => {throw new Error('Storage is blocked');},
      setItem: () => {throw new Error('Storage is full');},
    };
    expect(loadAppearancePreferences(unavailable)).toEqual(DEFAULT_APPEARANCE);
    expect(saveAppearancePreferences({...DEFAULT_APPEARANCE, theme: 'dark'}, unavailable)).toBe(false);
  });

  it('rejects unsupported style values and keeps readable font sizes', () => {
    expect(parseAppearancePreferences({
      theme: 'pink', background: 'url(example)', font: 'comic', textSize: '100px',
      textColor: '#ffffff', alignment: 'right', unknown: 'discard',
    })).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearancePreferences({textSize: -500}).textSize).toBe(14);
    expect(parseAppearancePreferences({textSize: 500}).textSize).toBe(24);
    expect(parseAppearancePreferences({textSize: 17.6}).textSize).toBe(18);
    expect(parseAppearancePreferences({textSize: NaN}).textSize).toBe(16);
    expect(parseAppearancePreferences({textSize: Infinity}).textSize).toBe(16);
  });
});
