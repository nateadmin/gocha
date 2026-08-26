/**
 * Planned production API host. Override with GOCHA_API_BASE_URL in native env when wired.
 */
export const API_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://gocha.ai';

export const API_PATHS = {
  health: '/api/health',
  version: '/api/version',
  csrfCookie: '/sanctum/csrf-cookie',
  otpRequest: '/api/auth/otp/request',
  otpVerify: '/api/auth/otp/verify',
  logout: '/api/auth/logout',
  me: '/api/me',
  onboarding: '/api/profile/onboarding',
  contact: '/api/profile/contact',
  profileMode: '/api/profile/mode',
  avatar: '/api/profile/avatar',
  userSearch: '/api/users/search',
  businesses: '/api/businesses',
  businessesMine: '/api/businesses/mine',
  verificationsMine: '/api/verifications/mine',
  verificationUser: '/api/verifications/user',
  adminBusinessListings: '/api/admin/business-listings',
  adminVerifications: '/api/admin/verifications',
} as const;
