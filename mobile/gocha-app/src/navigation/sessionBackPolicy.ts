export function shouldKeepSignedInOnBack(input: {
  appPhase: 'auth' | 'onboarding' | 'main';
  canGoBack: boolean;
}): boolean {
  if (input.canGoBack) {
    return false;
  }
  return input.appPhase === 'main' || input.appPhase === 'onboarding';
}
