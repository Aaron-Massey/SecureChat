import { describe, it, expect } from 'vitest';
import {
  DarkThemeStrategy,
  LightThemeStrategy,
  ThemeStrategyResolver,
} from '../themeStrategy';

describe('ThemeStrategy (GOF Strategy Pattern)', () => {
  it('DarkThemeStrategy applies dark data-theme attribute', () => {
    const dark = new DarkThemeStrategy();
    dark.applyTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('LightThemeStrategy applies light data-theme attribute', () => {
    const light = new LightThemeStrategy();
    light.applyTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('ThemeStrategyResolver returns appropriate strategy', () => {
    expect(ThemeStrategyResolver.getStrategy('dark').mode).toBe('dark');
    expect(ThemeStrategyResolver.getStrategy('light').mode).toBe('light');
  });
});
