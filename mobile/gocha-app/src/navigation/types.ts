export type RootTabParamList = {
  ChatsTab: undefined;
  CatchUpTab: undefined;
  BusinessesTab: undefined;
  CallsTab: undefined;
  SettingsTab: undefined;
};

export type ChatsStackParamList = {
  ChatsList: undefined;
  ChatDetail: { chatId: string };
};

export type BusinessesStackParamList = {
  BusinessesList: undefined;
  BusinessDetail: { businessId: string };
};
