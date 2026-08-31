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
  username: string | null;
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
  retryAfterSeconds?: number;
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

export function resetCsrfPrimed(): void {
  csrfPrimed = false;
}

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
        retryAfterSeconds: payload.retryAfterSeconds,
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

function isAuthFailure(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 401 ||
      error.status === 419 ||
      error.body.code === 'UNAUTHENTICATED' ||
      error.body.code === 'CSRF_MISMATCH')
  );
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.me);
    return payload.user;
  } catch (error) {
    if (isAuthFailure(error)) {
      resetCsrfPrimed();
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

/**
 * Exchanges a stored device token for a web session login so the server-side
 * identity actually changes when switching accounts. Returns a rotated device
 * token that must replace the presented one.
 */
export async function switchSession(deviceToken: string): Promise<OtpVerifyResult> {
  const payload = await apiRequest<OtpVerifyResult>(API_PATHS.authSwitch, {
    method: 'POST',
    body: JSON.stringify({ deviceToken }),
  });
  resetCsrfPrimed();
  return payload;
}

export async function logout(options?: { deviceOnly?: boolean }): Promise<void> {
  await apiRequest(API_PATHS.logout, {
    method: 'POST',
    body: JSON.stringify({ device_only: options?.deviceOnly ?? false }),
  });
  resetCsrfPrimed();
}

export async function issueDeviceToken(): Promise<{ deviceToken: string; account: AccountSwitcherEntry }> {
  return apiRequest(API_PATHS.deviceToken, { method: 'POST' });
}

export async function completeOnboarding(input: {
  displayName: string;
  username?: string;
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

export async function updateProfile(input: {
  displayName: string;
  status?: string;
  bio?: string;
  phone?: string;
  discoverable: boolean;
}): Promise<AuthUser> {
  const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.profileUpdate, {
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

export type GoogleReview = {
  author: string;
  rating: number | null;
  text: string;
  relativeTime: string | null;
};

export type PublicBusinessListing = {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  address: string | null;
  noPhysicalAddress: boolean;
  website: string | null;
  coverPhotoUrl: string | null;
  googleReviews: GoogleReview[];
  googleReviewsSyncedAt: string | null;
  verificationStatus: string;
  isVerified: boolean;
  chatEnabled: boolean;
  chatUserId: number;
  ownerUserId: number;
};

export type OwnerBusinessListing = PublicBusinessListing & {
  status: string;
  googleBusinessUrl: string | null;
  googlePlaceId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

export type BusinessIndustry = {
  id: string;
  label: string;
};

export type GoogleBusinessImport = {
  name: string | null;
  address: string | null;
  website: string | null;
  category: string | null;
  description: string | null;
  googleBusinessUrl: string;
  googlePlaceId: string | null;
  noPhysicalAddress: boolean;
  source: string;
};

export type BusinessListingInput = {
  name: string;
  category?: string;
  description?: string;
  address?: string;
  no_physical_address?: boolean;
  website?: string;
  google_business_url?: string;
  google_place_id?: string;
  submit?: boolean;
};

export async function fetchPublicBusinesses(): Promise<PublicBusinessListing[]> {
  const payload = await apiRequest<{ listings: PublicBusinessListing[] }>(API_PATHS.businesses);
  return payload.listings;
}

export async function fetchBusinessIndustries(): Promise<BusinessIndustry[]> {
  const payload = await apiRequest<{ industries: BusinessIndustry[] }>(API_PATHS.businessesIndustries);
  return payload.industries;
}

export async function fetchMyBusinessListings(): Promise<OwnerBusinessListing[]> {
  const payload = await apiRequest<{ listings: OwnerBusinessListing[] }>(API_PATHS.businessesMine);
  return payload.listings;
}

export async function importGoogleBusiness(url: string): Promise<GoogleBusinessImport> {
  const payload = await apiRequest<{ import: GoogleBusinessImport }>(API_PATHS.businessesImportGoogle, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return payload.import;
}

export async function submitBusinessListing(input: BusinessListingInput): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(API_PATHS.businesses, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.listing;
}

export async function updateBusinessListing(
  id: number,
  input: Partial<BusinessListingInput>,
): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.businessesMine}/${id}`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
  return payload.listing;
}

export async function saveBusinessListingDraft(
  id: number,
  input: Partial<BusinessListingInput>,
): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.businessesMine}/${id}/draft`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  return payload.listing;
}

export async function submitBusinessListingForReview(id: number): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.businessesMine}/${id}/submit`,
    { method: 'POST' },
  );
  return payload.listing;
}

export async function unpublishBusinessListing(id: number): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.businessesMine}/${id}/unpublish`,
    { method: 'POST' },
  );
  return payload.listing;
}

export async function deleteBusinessListing(id: number): Promise<void> {
  await apiRequest(`${API_PATHS.businessesMine}/${id}`, { method: 'DELETE' });
}

export async function uploadBusinessCover(id: number, file: Blob, filename = 'cover.jpg'): Promise<OwnerBusinessListing> {
  const form = new FormData();
  form.append('cover', file, filename);
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.businessesMine}/${id}/cover`,
    { method: 'POST', body: form },
  );
  return payload.listing;
}

export async function syncBusinessGoogleReviews(id: number): Promise<OwnerBusinessListing> {
  const payload = await apiRequest<{ listing: OwnerBusinessListing }>(
    `${API_PATHS.businessesMine}/${id}/sync-reviews`,
    { method: 'POST' },
  );
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

export async function updateUsername(username: string): Promise<AuthUser> {
  const payload = await apiRequest<{ user: AuthUser }>(API_PATHS.profileUsername, {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
  return payload.user;
}

export type CommunityGroupRecord = {
  id: number;
  name: string;
  description: string | null;
  privacy: 'public' | 'private';
  address: string | null;
  city: string | null;
  state: string | null;
  showInAroundMe: boolean;
  avatarLabel: string | null;
  avatarColor: string | null;
  memberCount: number;
  isPublic: boolean;
  hasLocation: boolean;
  ownerUserId: number;
};

export async function fetchDiscoverableGroups(): Promise<CommunityGroupRecord[]> {
  const payload = await apiRequest<{ groups: CommunityGroupRecord[] }>(API_PATHS.groupsDiscover);
  return payload.groups;
}

export async function fetchMyCommunityGroups(): Promise<CommunityGroupRecord[]> {
  const payload = await apiRequest<{ groups: CommunityGroupRecord[] }>(API_PATHS.groupsMine);
  return payload.groups;
}

export async function createCommunityGroup(input: {
  name: string;
  description?: string;
  privacy: 'public' | 'private';
  showInAroundMe?: boolean;
  address?: string;
  city?: string;
  state?: string;
}): Promise<CommunityGroupRecord> {
  const payload = await apiRequest<{ group: CommunityGroupRecord }>(API_PATHS.groups, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      privacy: input.privacy,
      show_in_around_me: input.showInAroundMe ?? false,
      address: input.address,
      city: input.city,
      state: input.state,
    }),
  });
  return payload.group;
}

export async function updateCommunityGroup(
  id: number,
  input: Partial<{
    name: string;
    description?: string;
    privacy: 'public' | 'private';
    showInAroundMe: boolean;
    address?: string;
    city?: string;
    state?: string;
  }>,
): Promise<CommunityGroupRecord> {
  const payload = await apiRequest<{ group: CommunityGroupRecord }>(`${API_PATHS.groups}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      privacy: input.privacy,
      show_in_around_me: input.showInAroundMe,
      address: input.address,
      city: input.city,
      state: input.state,
    }),
  });
  return payload.group;
}

export type PublicUserProfile = {
  id: number;
  username: string | null;
  displayName: string;
  status: string | null;
  bio: string | null;
  avatarUrl: string | null;
  verificationStatus: string;
  profileMode: string;
  website: string | null;
  chatUserId: number;
};

export type GlobalSearchContactResult = {
  conversationId: number;
  userId: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export type GlobalSearchMessageResult = {
  id: string;
  conversationId: number;
  conversationName: string;
  text: string;
  sentAt: string | null;
  isOutgoing: boolean;
};

export type GlobalSearchResponse = {
  contacts: GlobalSearchContactResult[];
  messages: GlobalSearchMessageResult[];
  people: PublicUserProfile[];
};

export async function searchUsers(query: string): Promise<PublicUserProfile[]> {
  const payload = await apiRequest<{ results: PublicUserProfile[] }>(
    `${API_PATHS.userSearch}?q=${encodeURIComponent(query)}`,
  );
  return payload.results;
}

export async function globalSearch(query: string): Promise<GlobalSearchResponse> {
  return apiRequest<GlobalSearchResponse>(
    `${API_PATHS.globalSearch}?q=${encodeURIComponent(query)}`,
  );
}

export type ConversationRecord = {
  id: number;
  type: string;
  name: string;
  avatarUrl: string | null;
  avatarLabel: string;
  avatarColor: string;
  otherUserId: number | null;
  preview: string;
  lastActivityAt: string | null;
  unreadCount: number;
  isBusiness: boolean;
};

export type ConversationMessageRecord = {
  id: string;
  type: string;
  text: string | null;
  sentAt: string | null;
  senderUserId?: number;
  isOutgoing: boolean;
  status?: 'sent' | 'delivered' | 'read';
};

export async function fetchConversations(): Promise<ConversationRecord[]> {
  const payload = await apiRequest<{ conversations: ConversationRecord[] }>(API_PATHS.conversations);
  return payload.conversations;
}

export async function createConversation(participantUserId: number): Promise<ConversationRecord> {
  const payload = await apiRequest<{ conversation: ConversationRecord }>(API_PATHS.conversations, {
    method: 'POST',
    body: JSON.stringify({ participantUserId }),
  });
  return payload.conversation;
}

export async function fetchConversationMessages(
  conversationId: number,
): Promise<ConversationMessageRecord[]> {
  const payload = await apiRequest<{ messages: ConversationMessageRecord[] }>(
    `${API_PATHS.conversations}/${conversationId}/messages`,
  );
  return payload.messages;
}

export async function sendConversationMessage(
  conversationId: number,
  text: string,
  type: 'text' | 'emoji' = 'text',
): Promise<ConversationMessageRecord> {
  const payload = await apiRequest<{ message: ConversationMessageRecord }>(
    `${API_PATHS.conversations}/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ text, type }),
    },
  );
  return payload.message;
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await apiRequest(`${API_PATHS.conversations}/${conversationId}/read`, {
    method: 'POST',
  });
}

export type CatchUpAttentionItem = {
  id: string;
  conversationId: number;
  tone: 'critical' | 'warning';
  text: string;
};

export type CatchUpConversationBrief = {
  id: number;
  name: string;
  avatarUrl: string | null;
  avatarLabel: string;
  unreadCount: number;
  priority: 'High' | 'Medium' | 'Low' | string;
  summary: string;
  plans: string[];
};

export type CatchUpPayload = {
  briefing: string;
  generatedAt: string | null;
  attention: CatchUpAttentionItem[];
  conversations: CatchUpConversationBrief[];
};

export async function fetchCatchUp(): Promise<CatchUpPayload> {
  return apiRequest<CatchUpPayload>(API_PATHS.catchUp);
}

export type ProfileCardType = 'professional' | 'match' | 'custom';
export type ProfileCardVisibility = 'public' | 'request' | 'private';
export type ProfileCardAccessStatus = 'pending' | 'approved' | 'declined';

export type ProfileCardBody = {
  company?: string;
  role?: string;
  location?: string;
  about?: string;
  skills?: string;
  website?: string;
  lookingFor?: string;
  interests?: string;
  details?: string;
};

export type ProfileCardSummary = {
  id: number;
  type: ProfileCardType;
  title: string;
  slug?: string | null;
  visibility: ProfileCardVisibility;
  canView: boolean;
  accessStatus: ProfileCardAccessStatus | null;
  photoUrl: string | null;
  headline: string | null;
};

export type ProfileCardRecord = ProfileCardSummary & {
  body: ProfileCardBody;
  pendingRequestCount?: number;
  owner?: {
    id: number;
    displayName: string;
    username: string | null;
  };
};

export type ProfileCardAccessRecord = {
  id: number;
  status: ProfileCardAccessStatus;
  requestedAt: string | null;
  decidedAt: string | null;
  cardId: number;
  cardTitle: string | null;
  cardType: ProfileCardType | null;
  viewer: {
    id: number;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  } | null;
};

export type ProfileCardOwnerSummary = {
  id: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export type PublicProfileCardRecord = {
  id: number;
  type: ProfileCardType;
  title: string;
  slug: string;
  headline: string | null;
  photoUrl: string | null;
  body: ProfileCardBody;
  owner: ProfileCardOwnerSummary;
  viewerIsOwner: boolean;
};

export type ProfileCardWriteInput = {
  type: ProfileCardType;
  title?: string;
  slug?: string;
  headline?: string;
  visibility?: ProfileCardVisibility;
  body?: ProfileCardBody;
};

export async function fetchPublicProfileCard(slug: string): Promise<PublicProfileCardRecord> {
  const payload = await apiRequest<{ card: PublicProfileCardRecord }>(
    API_PATHS.publicProfileCard(slug),
  );
  return payload.card;
}

export async function fetchMyProfileCards(): Promise<ProfileCardRecord[]> {
  const payload = await apiRequest<{ cards: ProfileCardRecord[] }>(API_PATHS.profileCards);
  return payload.cards;
}

export async function fetchUserProfileCards(userId: number): Promise<{
  owner: ProfileCardOwnerSummary;
  cards: ProfileCardSummary[];
}> {
  return apiRequest(API_PATHS.userProfileCards(userId));
}

export async function createProfileCard(input: ProfileCardWriteInput): Promise<ProfileCardRecord> {
  const payload = await apiRequest<{ card: ProfileCardRecord }>(API_PATHS.profileCards, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.card;
}

export async function fetchProfileCard(cardId: number): Promise<ProfileCardRecord> {
  const payload = await apiRequest<{ card: ProfileCardRecord }>(`${API_PATHS.profileCards}/${cardId}`);
  return payload.card;
}

export async function updateProfileCard(
  cardId: number,
  input: Partial<ProfileCardWriteInput>,
): Promise<ProfileCardRecord> {
  const payload = await apiRequest<{ card: ProfileCardRecord }>(`${API_PATHS.profileCards}/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return payload.card;
}

export async function deleteProfileCard(cardId: number): Promise<void> {
  await apiRequest(`${API_PATHS.profileCards}/${cardId}`, { method: 'DELETE' });
}

export async function uploadProfileCardPhoto(
  cardId: number,
  file: Blob,
  filename = 'photo.jpg',
): Promise<ProfileCardRecord> {
  const form = new FormData();
  form.append('photo', file, filename);
  const payload = await apiRequest<{ card: ProfileCardRecord }>(
    `${API_PATHS.profileCards}/${cardId}/photo`,
    { method: 'POST', body: form },
  );
  return payload.card;
}

export async function requestProfileCardAccess(cardId: number): Promise<ProfileCardSummary> {
  const payload = await apiRequest<{ card: ProfileCardSummary }>(
    `${API_PATHS.profileCards}/${cardId}/request`,
    { method: 'POST' },
  );
  return payload.card;
}

export async function grantProfileCardAccess(
  cardId: number,
  userId: number,
): Promise<ProfileCardAccessRecord> {
  const payload = await apiRequest<{ access: ProfileCardAccessRecord }>(
    `${API_PATHS.profileCards}/${cardId}/grant`,
    { method: 'POST', body: JSON.stringify({ userId }) },
  );
  return payload.access;
}

export async function fetchProfileCardRequests(): Promise<ProfileCardAccessRecord[]> {
  const payload = await apiRequest<{ requests: ProfileCardAccessRecord[] }>(
    `${API_PATHS.profileCards}/requests`,
  );
  return payload.requests;
}

export async function approveProfileCardAccess(accessId: number): Promise<ProfileCardAccessRecord> {
  const payload = await apiRequest<{ access: ProfileCardAccessRecord }>(
    `${API_PATHS.profileCards}/accesses/${accessId}/approve`,
    { method: 'POST' },
  );
  return payload.access;
}

export async function declineProfileCardAccess(accessId: number): Promise<ProfileCardAccessRecord> {
  const payload = await apiRequest<{ access: ProfileCardAccessRecord }>(
    `${API_PATHS.profileCards}/accesses/${accessId}/decline`,
    { method: 'POST' },
  );
  return payload.access;
}
