export type AccountChannel = 'email' | 'phone';

export function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

export function normalizePhoneInput(value: string): string {
  const digits = value.replace(/\D+/g, '');
  return digits === '' ? '' : `+${digits}`;
}

export function normalizeIdentifier(channel: AccountChannel, value: string): string {
  const trimmed = value.trim();
  if (channel === 'email') {
    return trimmed.toLowerCase();
  }
  return normalizePhoneInput(trimmed);
}
