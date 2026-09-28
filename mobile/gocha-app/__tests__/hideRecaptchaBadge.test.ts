/**
 * @format
 */

const created: { id?: string; textContent?: string; tagName: string }[] = [];

const fakeDocument = {
  getElementById: (id: string) => created.find((node) => node.id === id) ?? null,
  createElement: (tagName: string) => {
    const node = { id: '', textContent: '', tagName: tagName.toUpperCase() };
    return node;
  },
  head: {
    appendChild: (node: { id?: string; textContent?: string; tagName: string }) => {
      created.push(node);
    },
  },
};

(globalThis as { document?: typeof fakeDocument }).document = fakeDocument;

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { withTimeout } from '../src/auth/phoneFirebase';
import {
  hideRecaptchaBadge,
  isAuthorizedPhoneHost,
  matchFirebaseCode,
  phoneRecaptchaWidgetPresent,
  recaptchaBadgeCss,
  unauthorizedPhoneOriginMessage,
} from '../src/auth/phoneFirebase';

test('hideRecaptchaBadge injects CSS that hides the Google badge only', () => {
  created.length = 0;

  hideRecaptchaBadge();
  hideRecaptchaBadge();

  expect(created).toHaveLength(1);
  expect(created[0].id).toBe('gocha-hide-recaptcha');
  expect(created[0].textContent).toBe(recaptchaBadgeCss());
  expect(created[0].textContent).toContain('.grecaptcha-badge');
  expect(created[0].textContent).not.toContain('#gocha-recaptcha');
  expect(created[0].textContent).not.toContain('-9999px');
});

test('captcha failures tell the user to complete the visible check', () => {
  expect(matchFirebaseCode('auth/captcha-check-failed')).toContain('robot');
  expect(matchFirebaseCode('auth/missing-recaptcha-token')).toContain('robot');
});

test('invalid app credential names the current host instead of the checkbox', () => {
  (globalThis as { window?: { location?: { hostname: string } } }).window = {
    location: { hostname: 'app.gocha.ai' },
  };
  expect(matchFirebaseCode('auth/invalid-app-credential')).toContain('app.gocha.ai');
  expect(matchFirebaseCode('auth/invalid-app-credential')).toContain('Authorized domains');
  expect(matchFirebaseCode('auth/invalid-app-credential')).not.toContain('robot');
});

test('isAuthorizedPhoneHost requires exact Firebase authorized hosts', () => {
  expect(isAuthorizedPhoneHost('localhost', [])).toBe(true);
  expect(isAuthorizedPhoneHost('app.gocha.ai', ['localhost', 'gocha.ai'])).toBe(false);
  expect(isAuthorizedPhoneHost('app.gocha.ai', ['app.gocha.ai', 'gocha.ai'])).toBe(true);
  expect(unauthorizedPhoneOriginMessage('app.gocha.ai')).toContain('app.gocha.ai');
});

test('withTimeout rejects when the work never finishes', async () => {
  await expect(
    withTimeout(new Promise(() => undefined), 20, 'Phone verification is taking too long. Refresh and try again.'),
  ).rejects.toThrow('taking too long');
});

test('web index does not park the recaptcha widget off screen', () => {
  const html = readFileSync(join(__dirname, '../web/index.html'), 'utf8');
  expect(html).not.toMatch(/#gocha-recaptcha[\s\S]{0,200}-9999px/);
  expect(html).not.toContain('#gocha-recaptcha iframe');
});

test('phone recaptcha uses a visible checkbox widget and sends without a local solved flag', () => {
  const source = readFileSync(join(__dirname, '../src/auth/phoneFirebase.ts'), 'utf8');
  expect(source).toContain("size: 'normal'");
  expect(source).not.toContain("size: 'invisible'");
  expect(source).not.toContain('initializeRecaptchaConfig');
  expect(source).toContain('signInWithPhoneNumber');
  expect(source).not.toMatch(/if \(!recaptchaSolved\)/);
});

test('EmailScreen does not block send on a local recaptcha solved flag', () => {
  const source = readFileSync(
    join(__dirname, '../src/screens/auth/EmailScreen.tsx'),
    'utf8',
  );
  expect(source).toContain('sendPhoneSms');
  expect(source).not.toContain('isPhoneRecaptchaSolved');
  expect(source).not.toContain('preparePhoneRecaptcha');
  expect(source).toContain('shouldShowReviewPasswordField');
  expect(source).not.toMatch(/showPasswordField\s*=\s*!isSignUp/);
});

test('RecaptchaSlot web mounts a compact live host', () => {
  const source = readFileSync(
    join(__dirname, '../src/components/auth/RecaptchaSlot.web.tsx'),
    'utf8',
  );
  expect(source).toContain('preparePhoneRecaptcha');
  expect(source).not.toContain('backgroundColor');
  expect(source).not.toContain('-9999px');
});

test('phoneRecaptchaWidgetPresent requires the live iframe', () => {
  expect(phoneRecaptchaWidgetPresent()).toBe(false);
  const host = {
    id: 'gocha-recaptcha',
    querySelector: (selector: string) => (selector === 'iframe' ? { tagName: 'IFRAME' } : null),
  };
  fakeDocument.getElementById = (id: string) =>
    id === 'gocha-recaptcha' ? host : created.find((node) => node.id === id) ?? null;
  expect(phoneRecaptchaWidgetPresent()).toBe(true);
});
