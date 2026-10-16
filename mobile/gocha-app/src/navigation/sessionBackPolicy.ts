export function shouldKeepSignedInOnBack(input: {
  appPhase: 'auth' | 'onboarding' | 'consent' | 'main';
  canGoBack: boolean;
}): boolean {
  if (input.canGoBack) {
    return false;
  }
  return input.appPhase !== 'auth';
}
