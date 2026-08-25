/**
 * Planned production API host. Override with GOCHA_API_BASE_URL in native env when wired.
 */
export const API_BASE_URL = 'https://gocha.ai';

export const API_PATHS = {
  health: '/api/health',
  version: '/api/version',
} as const;
