export const DEFAULT_REVIEW_LOGIN_EMAIL = 'google-review@gocha.ai';

export function isReviewLoginEmail(
  identifier: string,
  configuredEmail?: string | null,
): boolean {
  const email = identifier.trim().toLowerCase();
  if (!email.includes('@')) {
    return false;
  }
  if (email === DEFAULT_REVIEW_LOGIN_EMAIL) {
    return true;
  }
  if (configuredEmail && email === configuredEmail.trim().toLowerCase()) {
    return true;
  }
  return false;
}

export function shouldShowReviewPasswordField(input: {
  channel: 'email' | 'phone';
  identifier: string;
  configuredReviewEmail?: string | null;
}): boolean {
  return (
    input.channel === 'email' &&
    isReviewLoginEmail(input.identifier, input.configuredReviewEmail)
  );
}
