import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatsScreen } from '../screens/chats/ChatsScreen';
import { ChatDetailScreen } from '../screens/chats/ChatDetailScreen';
import type { ChatsStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export function ChatsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatsList" component={ChatsScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </Stack.Navigator>
  );
}
