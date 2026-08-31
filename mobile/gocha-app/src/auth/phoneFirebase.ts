import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain?: string | null;
  projectId: string;
  appId?: string | null;
};

let confirmation: ConfirmationResult | null = null;
let verifier: RecaptchaVerifier | null = null;

function mapFirebaseError(error: unknown): Error {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  const message = matchFirebaseCode(code);
  return new Error(message);
}

function matchFirebaseCode(code: string): string {
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
      return 'Confirm you are not a robot, then try again.';
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Try again.';
    case 'auth/code-expired':
      return 'This code has expired. Request a new one.';
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

function recaptchaHost(): HTMLElement {
  let host = document.getElementById('gocha-recaptcha');
  if (!host) {
    host = document.createElement('div');
    host.id = 'gocha-recaptcha';
    host.style.position = 'fixed';
    host.style.bottom = '8px';
    host.style.right = '8px';
    host.style.zIndex = '20';
    document.body.appendChild(host);
  }
  return host;
}

export async function sendPhoneSms(
  config: FirebasePublicConfig,
  phone: string,
): Promise<void> {
  const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
  const auth = await firebaseAuth(config);

  if (verifier) {
    verifier.clear();
    verifier = null;
  }

  const host = recaptchaHost();
  host.innerHTML = '';
  verifier = new RecaptchaVerifier(auth, host, { size: 'invisible' });

  try {
    confirmation = await signInWithPhoneNumber(auth, phone, verifier);
  } catch (error) {
    confirmation = null;
    throw mapFirebaseError(error);
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
    throw mapFirebaseError(error);
  }
}

export function clearPhoneSms(): void {
  confirmation = null;
  if (verifier) {
    verifier.clear();
    verifier = null;
  }
}
