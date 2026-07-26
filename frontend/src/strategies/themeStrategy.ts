/**
 * Theme Manager & Strategy Helpers
 * Encapsulates dark and light mode theme application.
 */

export type ThemeMode = 'dark' | 'light';

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode);
}

export interface ThemeStrategy {
  readonly mode: ThemeMode;
  applyTheme(): void;
}

export class DarkThemeStrategy implements ThemeStrategy {
  readonly mode: ThemeMode = 'dark';
  applyTheme(): void {
    applyTheme('dark');
  }
}

export class LightThemeStrategy implements ThemeStrategy {
  readonly mode: ThemeMode = 'light';
  applyTheme(): void {
    applyTheme('light');
  }
}

export class ThemeStrategyResolver {
  private static strategies: Record<ThemeMode, ThemeStrategy> = {
    dark: new DarkThemeStrategy(),
    light: new LightThemeStrategy(),
  };

  static getStrategy(mode: ThemeMode): ThemeStrategy {
    return this.strategies[mode] || this.strategies.dark;
  }
}
