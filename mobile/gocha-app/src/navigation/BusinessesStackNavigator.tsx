import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BusinessesScreen } from '../screens/businesses/BusinessesScreen';
import { BusinessDetailScreen } from '../screens/businesses/BusinessDetailScreen';
import type { BusinessesStackParamList } from './types';

const Stack = createNativeStackNavigator<BusinessesStackParamList>();

export function BusinessesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BusinessesList" component={BusinessesScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
    </Stack.Navigator>
  );
}
