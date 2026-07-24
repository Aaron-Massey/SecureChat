/**
 * Theme Manager Composable
 * Manages active theme state, persists selection to localStorage, and handles theme strategy changes.
 */

import { ref, onMounted } from 'vue';
import { ThemeStrategyResolver, type ThemeMode } from '@/strategies/themeStrategy';

const CURRENT_THEME_KEY = 'securechat_theme';

export function useTheme() {
  const currentTheme = ref<ThemeMode>('dark');

  const setTheme = (mode: ThemeMode) => {
    currentTheme.value = mode;
    const strategy = ThemeStrategyResolver.getStrategy(mode);
    strategy.applyTheme();
    try {
      localStorage.setItem(CURRENT_THEME_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = currentTheme.value === 'dark' ? 'light' : 'dark';
    setTheme(nextMode);
  };

  onMounted(() => {
    let savedMode: ThemeMode | null = null;
    try {
      savedMode = localStorage.getItem(CURRENT_THEME_KEY) as ThemeMode | null;
    } catch {
      savedMode = null;
    }

    if (savedMode === 'light' || savedMode === 'dark') {
      setTheme(savedMode);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(prefersLight ? 'light' : 'dark');
    }
  });

  return {
    currentTheme,
    setTheme,
    toggleTheme,
  };
}
