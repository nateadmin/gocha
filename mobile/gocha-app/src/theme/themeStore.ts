import { darkColors, lightColors, type ThemeMode } from './palette';

const STORAGE_KEY = 'gocha.theme.mode.v1';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readStoredThemeMode(): ThemeMode {
  if (!canUseStorage()) {
    return 'dark';
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function writeStoredThemeMode(mode: ThemeMode): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, mode);
}

export function applyWebThemeShell(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }

  const background = mode === 'dark' ? darkColors.background : lightColors.background;
  document.documentElement.style.backgroundColor = background;
  document.body.style.backgroundColor = background;

  const root = document.getElementById('root');
  if (root) {
    root.style.backgroundColor = background;
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', background);
  }
}
