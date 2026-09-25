/**
 * @format
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  DEFAULT_REVIEW_LOGIN_EMAIL,
  shouldShowReviewPasswordField,
} from '../src/auth/reviewLogin';

test('review password field shows for the store email on create-account and sign-in', () => {
  expect(
    shouldShowReviewPasswordField({
      channel: 'email',
      identifier: DEFAULT_REVIEW_LOGIN_EMAIL,
    }),
  ).toBe(true);
  expect(
    shouldShowReviewPasswordField({
      channel: 'email',
      identifier: 'GOOGLE-REVIEW@GOCHA.AI',
      configuredReviewEmail: null,
    }),
  ).toBe(true);
  expect(
    shouldShowReviewPasswordField({
      channel: 'email',
      identifier: 'google-review@gocha.ai',
      configuredReviewEmail: 'other-review@gocha.ai',
    }),
  ).toBe(true);
});

test('review password field stays hidden for normal emails and phone', () => {
  expect(
    shouldShowReviewPasswordField({
      channel: 'email',
      identifier: 'nate@wefoundd.com',
    }),
  ).toBe(false);
  expect(
    shouldShowReviewPasswordField({
      channel: 'phone',
      identifier: DEFAULT_REVIEW_LOGIN_EMAIL,
    }),
  ).toBe(false);
});

test('review helper does not take signup vs sign-in as an input', () => {
  const source = readFileSync(join(__dirname, '../src/auth/reviewLogin.ts'), 'utf8');
  expect(source).not.toMatch(/isSignUp|signup/);
});

test('EmailScreen uses the review helper and does not hide it on signup', () => {
  const source = readFileSync(
    join(__dirname, '../src/screens/auth/EmailScreen.tsx'),
    'utf8',
  );
  expect(source).toContain('shouldShowReviewPasswordField');
  expect(source).not.toMatch(/showPasswordField\s*=\s*!isSignUp/);
  expect(source).toContain('DEFAULT_REVIEW_LOGIN_EMAIL');
});
