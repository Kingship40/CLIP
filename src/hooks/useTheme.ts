import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export function useTheme() {
  const { settings, updateSettings } = useSettingsStore();
  const theme = settings.theme ?? 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: newTheme });
  };

  return { theme, setTheme };
}
