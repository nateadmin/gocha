import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain?: string | null;
  projectId: string;
  appId?: string | null;
};

export const RECAPTCHA_HOST_ID = 'gocha-recaptcha';

const RECAPTCHA_BADGE_CSS =
  '.grecaptcha-badge{visibility:hidden!important;opacity:0!important;}';

let confirmation: ConfirmationResult | null = null;
let verifier: RecaptchaVerifier | null = null;

function firebaseErrorCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code?: string }).code);
  }
  return '';
}

export function recaptchaBadgeCss(): string {
  return RECAPTCHA_BADGE_CSS;
}

export function mapFirebasePhoneError(error: unknown): Error {
  return new Error(matchFirebaseCode(firebaseErrorCode(error)));
}

export function matchFirebaseCode(code: string): string {
  switch (code) {
    case 'auth/billing-not-enabled':
      return 'Firebase billing must be on (Blaze) before SMS can send.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled in Firebase.';
    case 'auth/invalid-phone-number':
      return 'Enter a valid phone number with country code.';
    case 'auth/too-many-requests':
      return 'Too many SMS attempts. Wait and try again.';
    case 'auth/quota-exceeded':
      return 'Too many SMS codes today. Try again tomorrow.';
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
    case 'auth/missing-recaptcha-token':
      return 'Complete the I am not a robot check, then send the code again.';
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Try again.';
    case 'auth/code-expired':
      return 'This code has expired. Request a new one.';
    case 'auth/unauthorized-domain':
      return 'This site is not allowed for phone sign-in. Add it in Firebase Auth domains.';
    default:
      return 'Could not send an SMS code. Try again.';
  }
}

async function firebaseAuth(config: FirebasePublicConfig) {
  if (typeof document === 'undefined') {
    throw new Error('Phone verification needs a browser window.');
  }

  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain ?? undefined,
      projectId: config.projectId,
      appId: config.appId ?? undefined,
    });

  return getAuth(app);
}

export function hideRecaptchaBadge(): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (!document.getElementById('gocha-hide-recaptcha')) {
    const style = document.createElement('style');
    style.id = 'gocha-hide-recaptcha';
    style.textContent = RECAPTCHA_BADGE_CSS;
    document.head.appendChild(style);
  }
}

function recaptchaHost(): HTMLElement {
  hideRecaptchaBadge();
  let host = document.getElementById(RECAPTCHA_HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = RECAPTCHA_HOST_ID;
    document.body.appendChild(host);
  }
  host.style.position = '';
  host.style.left = '';
  host.style.width = '';
  host.style.height = '';
  host.style.overflow = '';
  host.style.minHeight = '78px';
  host.style.display = 'flex';
  host.style.justifyContent = 'center';
  host.removeAttribute('aria-hidden');
  return host;
}

function clearVerifier(): void {
  if (!verifier) {
    return;
  }
  try {
    verifier.clear();
  } catch {
    // Widget may already be gone.
  }
  verifier = null;
}

async function createVerifier(
  config: FirebasePublicConfig,
  size: 'invisible' | 'normal',
): Promise<RecaptchaVerifier> {
  const { RecaptchaVerifier } = await import('firebase/auth');
  const auth = await firebaseAuth(config);
  clearVerifier();
  const host = recaptchaHost();
  host.innerHTML = '';
  const next = new RecaptchaVerifier(auth, host, { size });
  await next.render();
  verifier = next;
  return next;
}

export async function sendPhoneSms(
  config: FirebasePublicConfig,
  phone: string,
): Promise<void> {
  hideRecaptchaBadge();
  const { signInWithPhoneNumber } = await import('firebase/auth');
  const auth = await firebaseAuth(config);

  try {
    const widget = verifier ?? (await createVerifier(config, 'invisible'));
    confirmation = await signInWithPhoneNumber(auth, phone, widget);
  } catch (error) {
    confirmation = null;
    const code = firebaseErrorCode(error);
    if (
      code === 'auth/captcha-check-failed' ||
      code === 'auth/invalid-app-credential' ||
      code === 'auth/missing-recaptcha-token'
    ) {
      try {
        const widget = await createVerifier(config, 'normal');
        confirmation = await signInWithPhoneNumber(auth, phone, widget);
        return;
      } catch (retryError) {
        confirmation = null;
        throw mapFirebasePhoneError(retryError);
      }
    }
    throw mapFirebasePhoneError(error);
  }
}

export async function confirmPhoneSms(code: string): Promise<string> {
  if (!confirmation) {
    throw new Error('Request a new code.');
  }

  try {
    const credential = await confirmation.confirm(code);
    const token = await credential.user.getIdToken();
    const { signOut, getAuth } = await import('firebase/auth');
    await signOut(getAuth());
    return token;
  } catch (error) {
    throw mapFirebasePhoneError(error);
  }
}

export function clearPhoneSms(): void {
  confirmation = null;
  clearVerifier();
}
