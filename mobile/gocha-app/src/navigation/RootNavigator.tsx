import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CatchUpScreen } from '../screens/catchup/CatchUpScreen';
import { CallsScreen } from '../screens/calls/CallsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ChatsStackNavigator } from './ChatsStackNavigator';
import { BusinessesStackNavigator } from './BusinessesStackNavigator';
import { MainTabBar } from './MainTabBar';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function businessesTabBarStyle(route: { name: string; key: string; params?: object }) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'BusinessesList';
  if (routeName === 'BusinessDetail') {
    return { display: 'none' } as const;
  }
  return undefined;
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="ChatsTab" component={ChatsStackNavigator} />
      <Tab.Screen name="CatchUpTab" component={CatchUpScreen} />
      <Tab.Screen
        name="BusinessesTab"
        component={BusinessesStackNavigator}
        options={({ route }) => ({
          tabBarStyle: businessesTabBarStyle(route),
        })}
      />
      <Tab.Screen name="CallsTab" component={CallsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
