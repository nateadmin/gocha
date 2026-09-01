export type MessageStatus = 'sent' | 'delivered' | 'read';

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'voice'
  | 'sticker'
  | 'emoji'
  | 'file'
  | 'offer'
  | 'poll'
  | 'rsvp';

export type OfferPost = {
  title: string;
  description: string;
  location: string;
  locationKind: string;
  imageUrl: string | null;
  status: 'available' | 'taken' | string;
  quantity: number;
  claimedCount: number;
  claimedByUserId?: number | null;
  claimedByName?: string | null;
  myClaimed: boolean;
  canClaim: boolean;
  canMarkTaken: boolean;
  canRelease: boolean;
  canUnclaim: boolean;
};

export type PollOption = {
  id: string;
  text: string;
  count: number;
  selected: boolean;
  voters: { userId: number; name: string }[];
};

export type PollPost = {
  kind: 'vote' | 'multi' | string;
  question: string;
  anonymous: boolean;
  closed: boolean;
  options: PollOption[];
  totalVotes: number;
  myChoices: string[];
  canClose: boolean;
};

export type RsvpPost = {
  title: string;
  when: string;
  where: string;
  closed: boolean;
  counts: { going: number; maybe: number; cant: number };
  voters: Record<string, { userId: number; name: string }[]>;
  myChoice: string | null;
  canClose: boolean;
};

export type MessagePost = {
  offer?: OfferPost;
  poll?: PollPost;
  rsvp?: RsvpPost;
};

export type ChatMessage = {
  id: string;
  type: MessageType;
  text?: string;
  originalText?: string;
  isTranslated?: boolean;
  sourceLanguage?: string;
  stickerKey?: string;
  fileName?: string;
  mediaUrl?: string;
  mimeType?: string;
  durationSec?: number;
  sentAt: string;
  sentAtMs?: number;
  isOutgoing: boolean;
  status?: MessageStatus;
  replyToId?: string;
  starred?: boolean;
  selfDestructSec?: number;
  senderName?: string;
  senderAvatarLabel?: string;
  post?: MessagePost;
};

export type MuteDuration = '1h' | '8h' | '1w' | 'forever';

export type SwipeAction = 'pin' | 'read' | 'archive' | 'mute' | 'delete';

export type ChatRecord = {
  id: string;
  name: string;
  avatarLabel: string;
  avatarColor: string;
  preview: string;
  dateLabel: string;
  lastActivityAt: number;
  unreadCount: number;
  pinned: boolean;
  archived: boolean;
  muted: boolean;
  muteUntil?: number | null;
  blocked: boolean;
  locked: boolean;
  hidden: boolean;
  favorite: boolean;
  markedUnread: boolean;
  isGroup: boolean;
  groupCount?: number;
  isBusiness: boolean;
  isBroadcast?: boolean;
  isOrderAssistant?: boolean;
  isSecret: boolean;
  listIds: string[];
  labelIds: string[];
  disappearingTimerSec?: number | null;
  otherUserId?: number;
  hasStatus?: boolean;
  statusUnseen?: boolean;
};

export type ChatList = {
  id: string;
  name: string;
  chatIds: string[];
  muted: boolean;
};

export type ChatLabel = {
  id: string;
  name: string;
  color: string;
};

export type ChatFilterId =
  | 'all'
  | 'unread'
  | 'groups'
  | 'favorites'
  | 'archived'
  | 'hidden';

export type ChatPreferences = {
  labelsEnabled: boolean;
  listsEnabled: boolean;
  swipeRight: SwipeAction;
  swipeLeft: SwipeAction;
  hiddenChatsPin: string | null;
  chatLockPin: string | null;
  showArchived: boolean;
};

export type ComposerMode = 'text' | 'voice' | 'sticker' | 'emoji';

export type StickerPack = {
  id: string;
  name: string;
  stickers: string[];
};
