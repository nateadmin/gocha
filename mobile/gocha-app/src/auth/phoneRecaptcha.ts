export type FirebasePublicConfig = {
  apiKey: string;
  authDomain?: string | null;
  projectId: string;
  appId?: string | null;
};

export async function getPhoneRecaptchaToken(
  config: FirebasePublicConfig,
): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('Phone verification needs a browser window.');
  }

  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth, RecaptchaVerifier } = await import('firebase/auth');

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain ?? undefined,
      projectId: config.projectId,
      appId: config.appId ?? undefined,
    });
  const auth = getAuth(app);

  const existing = document.getElementById('gocha-recaptcha');
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = 'gocha-recaptcha';
  host.style.position = 'fixed';
  host.style.left = '-9999px';
  host.style.width = '1px';
  host.style.height = '1px';
  document.body.appendChild(host);

  const verifier = new RecaptchaVerifier(auth, host, { size: 'invisible' });
  try {
    return await verifier.verify();
  } finally {
    verifier.clear();
  }
}
