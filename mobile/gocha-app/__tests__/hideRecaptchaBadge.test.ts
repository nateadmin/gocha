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

import { hideRecaptchaBadge } from '../src/auth/phoneFirebase';

test('hideRecaptchaBadge injects CSS that hides the Google badge', () => {
  created.length = 0;

  hideRecaptchaBadge();
  hideRecaptchaBadge();

  expect(created).toHaveLength(1);
  expect(created[0].id).toBe('gocha-hide-recaptcha');
  expect(created[0].textContent).toContain('.grecaptcha-badge');
  expect(created[0].textContent).toContain('visibility:hidden');
});
