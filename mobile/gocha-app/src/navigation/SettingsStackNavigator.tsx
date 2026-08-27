import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminReviewScreen } from '../screens/settings/AdminReviewScreen';
import { AccountsScreen } from '../screens/settings/AccountsScreen';
import { ProfileModeScreen } from '../screens/settings/ProfileModeScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { SubmitBusinessScreen } from '../screens/settings/SubmitBusinessScreen';
import { ChatLabelsSettingsScreen } from '../screens/chats/ChatLabelsSettingsScreen';
import { ChatListsSettingsScreen } from '../screens/chats/ChatListsSettingsScreen';
import { HiddenChatsScreen } from '../screens/chats/HiddenChatsScreen';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Accounts" component={AccountsScreen} />
      <Stack.Screen name="ProfileMode" component={ProfileModeScreen} />
      <Stack.Screen name="SubmitBusiness" component={SubmitBusinessScreen} />
      <Stack.Screen name="AdminReview" component={AdminReviewScreen} />
      <Stack.Screen name="ChatListsSettings" component={ChatListsSettingsScreen} />
      <Stack.Screen name="ChatLabelsSettings" component={ChatLabelsSettingsScreen} />
      <Stack.Screen name="HiddenChats" component={HiddenChatsScreen} />
    </Stack.Navigator>
  );
}
