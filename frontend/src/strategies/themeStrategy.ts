/**
 * GOF Strategy Pattern: Theme Strategy
 * Encapsulates dark mode and light mode color palette strategies for SecureChat P2P.
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeStrategy {
  readonly mode: ThemeMode;
  applyTheme(): void;
}

export class DarkThemeStrategy implements ThemeStrategy {
  readonly mode: ThemeMode = 'dark';

  applyTheme(): void {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

export class LightThemeStrategy implements ThemeStrategy {
  readonly mode: ThemeMode = 'light';

  applyTheme(): void {
    document.documentElement.setAttribute('data-theme', 'light');
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
