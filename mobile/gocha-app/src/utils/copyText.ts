import { Platform } from 'react-native';

export async function copyText(text: string): Promise<boolean> {
  const value = text.trim();
  if (!value) {
    return false;
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return fallbackCopy(value);
    }
  }

  return fallbackCopy(value);
}

function fallbackCopy(text: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
