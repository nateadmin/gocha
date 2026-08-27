export type RootTabParamList = {
  ChatsTab: undefined;
  CatchUpTab: undefined;
  DiscoverTab: undefined;
  CallsTab: undefined;
  SettingsTab: undefined;
};

export type ChatsStackParamList = {
  ChatsList: undefined;
  ChatDetail: { chatId: string };
  ChatInfo: { chatId: string };
  ChatLock: { chatId: string };
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
  Accounts: undefined;
  ProfileMode: undefined;
  SubmitBusiness: undefined;
  MyBusinessListings: undefined;
  BusinessListingForm: { listingId?: number } | undefined;
  AdminReview: undefined;
  ChatListsSettings: undefined;
  ChatLabelsSettings: undefined;
  HiddenChats: undefined;
};
