import { API_BASE_URL, API_PATHS } from '../config/api';

export type BusinessListingSummary = {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  status: string;
  verificationStatus: string;
  isVerified: boolean;
  chatEnabled: boolean;
  chatUserId: number;
};

export type AuthUser = {
  id: number;
  email: string | null;
  phone: string | null;
  primaryLoginChannel: string;
  displayName: string;
  chatDisplayName: string;
  status: string | null;
  bio: string | null;
  avatarUrl: string | null;
  discoverable: boolean;
  needsOnboarding: boolean;
  isAdmin: boolean;
  userVerificationStatus: string;
  effectiveVerificationStatus: string;
  profileMode: 'personal' | 'business';
  businessChatName: string | null;
  businessChatWebsite: string | null;
  activeBusinessListingId: number | null;
  activeBusinessListing: BusinessListingSummary | null;
};

export type AccountSwitcherEntry = {
  id: number;
  label: string;
  displayName: string;
  avatarUrl: string | null;
  primaryLoginChannel: string;
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

let activeDeviceToken: string | null = null;
let csrfPrimed = false;

export function setActiveDeviceToken(token: string | null): void {
  activeDeviceToken = token;
}

export function getActiveDeviceToken(): string | null {
  return activeDeviceToken;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

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

  if (activeDeviceToken) {
    headers.Authorization = `Bearer ${activeDeviceToken}`;
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
    if (error instanceof ApiError && (error.status === 401 || error.body.code === 'UNAUTHENTICATED')) {
      return null;
    }
    throw error;
  }
}

export type OtpAuthMode = 'signin' | 'signup';

export type OtpVerifyResult = {
  user: AuthUser;
  deviceToken: string;
  account: AccountSwitcherEntry;
};

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
): Promise<OtpVerifyResult> {
  return apiRequest(API_PATHS.otpVerify, {
    method: 'POST',
    body: JSON.stringify({ email, code, mode }),
  });
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

export async function updateProfileContact(input: {
  email?: string;
  phone?: string;
}): Promise<AuthUser> {
  const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.contact, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.user;
}

export async function updateProfileMode(input: {
  profileMode: 'personal' | 'business';
  businessChatName?: string;
  businessChatWebsite?: string;
  activeBusinessListingId?: number | null;
}): Promise<AuthUser> {
  const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.profileMode, {
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

export type PublicBusinessListing = {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  address: string | null;
  website: string | null;
  verificationStatus: string;
  isVerified: boolean;
  chatEnabled: boolean;
  chatUserId: number;
  ownerUserId: number;
};

export type OwnerBusinessListing = PublicBusinessListing & {
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

export async function fetchPublicBusinesses(): Promise<PublicBusinessListing[]> {
  const payload = await apiRequest<{ listings: PublicBusinessListing[] }>(API_PATHS.businesses);
  return payload.listings;
}

export async function fetchMyBusinessListings(): Promise<OwnerBusinessListing[]> {
  const payload = await apiRequest<{ listings: OwnerBusinessListing[] }>(API_PATHS.businessesMine);
  return payload.listings;
}

export async function submitBusinessListing(input: {
  name: string;
  category?: string;
  description?: string;
  address?: string;
  website?: string;
}): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(API_PATHS.businesses, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.listing;
}

export async function approveBusinessListing(id: number): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.adminBusinessListings}/${id}/approve`,
    { method: 'POST' },
  );
  return payload.listing;
}

export async function rejectBusinessListing(id: number, reason: string): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.adminBusinessListings}/${id}/reject`,
    { method: 'POST', body: JSON.stringify({ reason }) },
  );
  return payload.listing;
}

export async function fetchPendingBusinessListings(): Promise<OwnerBusinessListing[]> {
  const payload = await apiRequest<{ listings: OwnerBusinessListing[] }>(
    `${API_PATHS.adminBusinessListings}?status=pending_review`,
  );
  return payload.listings;
}
