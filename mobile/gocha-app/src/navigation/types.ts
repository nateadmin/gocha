import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ProfileCardType } from '../api/client';

export type AppStackParamList = {
  Main: undefined;
  PublicProfileCard: { slug: string };
  StatusViewer: { userId: number; startItemId?: number; userIds?: number[] };
  StatusComposer: { type?: 'text' | 'media'; itemId?: number; afterSave?: 'viewer' | 'back' } | undefined;
};

export type RootTabParamList = {
  ChatsTab: NavigatorScreenParams<ChatsStackParamList> | undefined;
  CatchUpTab: undefined;
  DiscoverTab: NavigatorScreenParams<DiscoverStackParamList> | undefined;
  CallsTab: undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

export type ChatsStackParamList = {
  ChatsList: undefined;
  ChatDetail: { chatId: string };
  ChatInfo: { chatId: string };
  ProfileCardDetail: { cardId: number };
  ChatLock: { chatId: string };
  CreateGroup: undefined;
  GroupSettings: { groupId: number };
  NewBroadcast: undefined;
  BlockedChats: undefined;
  ChatListsSettings: undefined;
  ChatLabelsSettings: undefined;
  HiddenChats: undefined;
};

export type DiscoverStackParamList = {
  DiscoverHub: undefined;
  BusinessDetail: { businessId: string };
  BusinessListingForm: { listingId?: number } | undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ProfileSettings: undefined;
  Accounts: undefined;
  ProfileMode: undefined;
  SubmitBusiness: undefined;
  MyBusinessListings: { tab?: 'live' | 'drafts' | 'pending' } | undefined;
  BusinessListingForm: { listingId?: number } | undefined;
  AdminReview: undefined;
  UsernameSettings: undefined;
  LanguageSettings: undefined;
  BlockedChats: undefined;
  ChatListsSettings: undefined;
  ChatLabelsSettings: undefined;
  HiddenChats: undefined;
  ProfileCards: undefined;
  AddProfileCard: undefined;
  EditProfileCard: { cardId?: number; type?: ProfileCardType } | undefined;
  ProfileCardRequests: undefined;
  StatusSettings: undefined;
};
