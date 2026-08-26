import { API_BASE_URL, API_PATHS } from '../config/api';

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
  status: string | null;
  bio: string | null;
  phone: string | null;
  avatarUrl: string | null;
  discoverable: boolean;
  needsOnboarding: boolean;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  correlationId?: string;
  retryable?: boolean;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    public readonly body: ApiErrorBody,
    public readonly status: number,
  ) {
    super(body.message);
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfPrimed = false;

async function ensureCsrfCookie(): Promise<void> {
  if (csrfPrimed) {
    return;
  }

  await fetch(`${API_BASE_URL}${API_PATHS.csrfCookie}`, {
    method: 'GET',
    credentials: 'include',
  });

  csrfPrimed = true;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      {
        code: payload.code ?? 'REQUEST_FAILED',
        message: payload.message ?? 'Request failed.',
        correlationId: payload.correlationId,
        retryable: payload.retryable,
        errors: payload.errors,
      },
      response.status,
    );
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const xsrf = readCookie('XSRF-TOKEN');
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  return parseResponse<T>(response);
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.me);
    return payload.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export type OtpAuthMode = 'signin' | 'signup';

export async function requestOtp(
  email: string,
  mode: OtpAuthMode,
): Promise<{
  message: string;
  resendAvailableInSeconds: number;
}> {
  return apiRequest(API_PATHS.otpRequest, {
    method: 'POST',
    body: JSON.stringify({ email, mode }),
  });
}

export async function verifyOtp(
  email: string,
  code: string,
  mode: OtpAuthMode,
): Promise<AuthUser> {
  const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.otpVerify, {
    method: 'POST',
    body: JSON.stringify({ email, code, mode }),
  });
  return payload.user;
}

export async function logout(): Promise<void> {
  await apiRequest(API_PATHS.logout, { method: 'POST' });
  csrfPrimed = false;
}

export async function completeOnboarding(input: {
  displayName: string;
  status?: string;
  bio?: string;
  phone?: string;
  discoverable: boolean;
}): Promise<AuthUser> {
  const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.onboarding, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.user;
}

export async function uploadAvatar(file: Blob, filename = 'avatar.png'): Promise<AuthUser> {
  const form = new FormData();
  form.append('avatar', file, filename);

  const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.avatar, {
    method: 'POST',
    body: form,
  });
  return payload.user;
}
