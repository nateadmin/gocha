import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CatchUpScreen } from '../screens/catchup/CatchUpScreen';
import { CallsScreen } from '../screens/calls/CallsScreen';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { ChatsStackNavigator } from './ChatsStackNavigator';
import { DiscoverStackNavigator } from './DiscoverStackNavigator';
import { MainTabBar } from './MainTabBar';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function discoverTabBarStyle(route: { name: string; key: string; params?: object }) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'DiscoverHub';
  if (routeName === 'BusinessDetail' || routeName === 'BusinessListingForm') {
    return { display: 'none' } as const;
  }
  return undefined;
}

function chatsTabBarStyle(route: { name: string; key: string; params?: object }) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'ChatsList';
  const hideOn = new Set([
    'ChatDetail',
    'ChatInfo',
    'ChatLock',
    'CreateGroup',
    'GroupSettings',
    'NewBroadcast',
    'BlockedChats',
    'ChatListsSettings',
    'ChatLabelsSettings',
    'HiddenChats',
  ]);
  if (hideOn.has(routeName)) {
    return {
      display: 'none',
      height: 0,
      minHeight: 0,
      overflow: 'hidden',
      opacity: 0,
      pointerEvents: 'none',
    } as const;
  }
  return undefined;
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStackNavigator}
        options={({ route }) => ({
          tabBarStyle: chatsTabBarStyle(route),
        })}
      />
      <Tab.Screen name="CatchUpTab" component={CatchUpScreen} />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverStackNavigator}
        options={({ route }) => ({
          tabBarStyle: discoverTabBarStyle(route),
        })}
      />
      <Tab.Screen name="CallsTab" component={CallsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}
