import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CatchUpScreen } from '../screens/catchup/CatchUpScreen';
import { CallsScreen } from '../screens/calls/CallsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ChatsStackNavigator } from './ChatsStackNavigator';
import { DiscoverStackNavigator } from './DiscoverStackNavigator';
import { MainTabBar } from './MainTabBar';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function discoverTabBarStyle(route: { name: string; key: string; params?: object }) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'DiscoverHub';
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
        name="DiscoverTab"
        component={DiscoverStackNavigator}
        options={({ route }) => ({
          tabBarStyle: discoverTabBarStyle(route),
        })}
      />
      <Tab.Screen name="CallsTab" component={CallsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
