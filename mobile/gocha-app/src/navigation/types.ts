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
};

/** @deprecated Use DiscoverStackParamList */
export type BusinessesStackParamList = DiscoverStackParamList;
