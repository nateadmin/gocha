import type { NavigatorScreenParams } from '@react-navigation/native';

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
  MyBusinessListings: undefined;
  BusinessListingForm: { listingId?: number } | undefined;
  AdminReview: undefined;
  UsernameSettings: undefined;
  BlockedChats: undefined;
  ChatListsSettings: undefined;
  ChatLabelsSettings: undefined;
  HiddenChats: undefined;
};
