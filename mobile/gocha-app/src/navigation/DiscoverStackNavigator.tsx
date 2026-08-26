import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DiscoverHubScreen } from '../screens/discover/DiscoverHubScreen';
import { BusinessDetailScreen } from '../screens/businesses/BusinessDetailScreen';
import type { DiscoverStackParamList } from './types';

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export function DiscoverStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverHub" component={DiscoverHubScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
    </Stack.Navigator>
  );
}
