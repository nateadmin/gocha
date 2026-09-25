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
  matchFirebaseCode,
  recaptchaBadgeCss,
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
  expect(matchFirebaseCode('auth/invalid-app-credential')).toContain('robot');
});

test('withTimeout rejects when the work never finishes', async () => {
  await expect(
    withTimeout(new Promise(() => undefined), 20, 'Phone verification is taking too long. Refresh and try again.'),
  ).rejects.toThrow('taking too long');
});

test('web index does not park the recaptcha widget off screen', () => {
  const html = readFileSync(join(__dirname, '../web/index.html'), 'utf8');
  expect(html).not.toMatch(/#gocha-recaptcha[\s\S]{0,200}-9999px/);
});
