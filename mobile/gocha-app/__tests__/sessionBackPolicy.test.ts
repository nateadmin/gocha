import { shouldKeepSignedInOnBack } from '../src/navigation/sessionBackPolicy';

test('hardware back at the signed-in root stays in the app', () => {
  expect(
    shouldKeepSignedInOnBack({ appPhase: 'main', canGoBack: false }),
  ).toBe(true);
  expect(
    shouldKeepSignedInOnBack({ appPhase: 'onboarding', canGoBack: false }),
  ).toBe(true);
});

test('hardware back pops composer and chat screens', () => {
  expect(
    shouldKeepSignedInOnBack({ appPhase: 'main', canGoBack: true }),
  ).toBe(false);
});

test('hardware back on login is not trapped', () => {
  expect(
    shouldKeepSignedInOnBack({ appPhase: 'auth', canGoBack: false }),
  ).toBe(false);
});
