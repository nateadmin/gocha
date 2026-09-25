import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain?: string | null;
  projectId: string;
  appId?: string | null;
};

export const RECAPTCHA_HOST_ID = 'gocha-recaptcha';
export const PHONE_RECAPTCHA_TIMEOUT_MS = 15000;
export const PHONE_SMS_TIMEOUT_MS = 20000;

const RECAPTCHA_BADGE_CSS =
  '.grecaptcha-badge{visibility:hidden!important;opacity:0!important;}';

const ROBOT_CHECK_MESSAGE =
  'Complete the I am not a robot check, then send the code again.';
const RECAPTCHA_TIMEOUT_MESSAGE =
  'Phone verification is taking too long. Refresh and try again.';

let confirmation: ConfirmationResult | null = null;
let verifier: RecaptchaVerifier | null = null;
let recaptchaSolved = false;
let preparePromise: Promise<void> | null = null;

function firebaseErrorCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code?: string }).code);
  }
  return '';
}

export function recaptchaBadgeCss(): string {
  return RECAPTCHA_BADGE_CSS;
}

export function isPhoneRecaptchaSolved(): boolean {
  return recaptchaSolved;
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function mapFirebasePhoneError(error: unknown): Error {
  if (error instanceof Error && error.message === RECAPTCHA_TIMEOUT_MESSAGE) {
    return error;
  }
  if (error instanceof Error && error.message === ROBOT_CHECK_MESSAGE) {
    return error;
  }
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
      return ROBOT_CHECK_MESSAGE;
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
  host.style.minHeight = '78px';
  host.style.display = 'flex';
  host.style.justifyContent = 'center';
  host.removeAttribute('aria-hidden');
  return host;
}

function clearVerifier(): void {
  recaptchaSolved = false;
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

async function createVerifier(config: FirebasePublicConfig): Promise<RecaptchaVerifier> {
  const authModule = await import('firebase/auth');
  const auth = await firebaseAuth(config);

  if (typeof authModule.initializeRecaptchaConfig === 'function') {
    try {
      await withTimeout(
        authModule.initializeRecaptchaConfig(auth),
        PHONE_RECAPTCHA_TIMEOUT_MS,
        RECAPTCHA_TIMEOUT_MESSAGE,
      );
    } catch {
      // Config preload is optional. Phone auth still uses RecaptchaVerifier.
    }
  }

  clearVerifier();
  recaptchaHost();
  const next = new authModule.RecaptchaVerifier(auth, RECAPTCHA_HOST_ID, {
    size: 'normal',
    callback: () => {
      recaptchaSolved = true;
    },
    'expired-callback': () => {
      recaptchaSolved = false;
    },
  });
  await withTimeout(next.render(), PHONE_RECAPTCHA_TIMEOUT_MS, RECAPTCHA_TIMEOUT_MESSAGE);
  verifier = next;
  return next;
}

export async function preparePhoneRecaptcha(config: FirebasePublicConfig): Promise<void> {
  if (verifier) {
    return;
  }
  if (preparePromise) {
    await preparePromise;
    return;
  }

  preparePromise = createVerifier(config).then(() => undefined);
  try {
    await preparePromise;
  } finally {
    preparePromise = null;
  }
}

export async function sendPhoneSms(
  config: FirebasePublicConfig,
  phone: string,
): Promise<void> {
  hideRecaptchaBadge();
  await preparePhoneRecaptcha(config);
  if (!recaptchaSolved) {
    throw new Error(ROBOT_CHECK_MESSAGE);
  }

  const { signInWithPhoneNumber } = await import('firebase/auth');
  const auth = await firebaseAuth(config);
  const widget = verifier;
  if (!widget) {
    throw new Error(RECAPTCHA_TIMEOUT_MESSAGE);
  }

  try {
    confirmation = await withTimeout(
      signInWithPhoneNumber(auth, phone, widget),
      PHONE_SMS_TIMEOUT_MS,
      RECAPTCHA_TIMEOUT_MESSAGE,
    );
  } catch (error) {
    confirmation = null;
    recaptchaSolved = false;
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
  preparePromise = null;
  clearVerifier();
}
