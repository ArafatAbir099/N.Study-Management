export type ThemeMode = 'dark' | 'light';

export function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem('study_os_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark'; // Default dark theme for OS
}

export function applyTheme(theme: ThemeMode): void {
  localStorage.setItem('study_os_theme', theme);
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
