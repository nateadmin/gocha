import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatsScreen } from '../screens/chats/ChatsScreen';
import { ChatDetailScreen } from '../screens/chats/ChatDetailScreen';
import { ChatInfoScreen } from '../screens/chats/ChatInfoScreen';
import { ChatLockScreen } from '../screens/chats/ChatLockScreen';
import { ChatListsSettingsScreen } from '../screens/chats/ChatListsSettingsScreen';
import { ChatLabelsSettingsScreen } from '../screens/chats/ChatLabelsSettingsScreen';
import { HiddenChatsScreen } from '../screens/chats/HiddenChatsScreen';
import type { ChatsStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export function ChatsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatsList" component={ChatsScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="ChatInfo" component={ChatInfoScreen} />
      <Stack.Screen name="ChatLock" component={ChatLockScreen} />
      <Stack.Screen name="ChatListsSettings" component={ChatListsSettingsScreen} />
      <Stack.Screen name="ChatLabelsSettings" component={ChatLabelsSettingsScreen} />
      <Stack.Screen name="HiddenChats" component={HiddenChatsScreen} />
    </Stack.Navigator>
  );
}
