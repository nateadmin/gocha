import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useLanguage } from '../i18n/LanguageContext';
import type { StringKey } from '../i18n/strings';
import { useGochaTheme } from '../theme';

const TAB_META: Record<
  string,
  { labelKey: StringKey; icon: keyof typeof Ionicons.glyphMap; rootScreen?: string }
> = {
  ChatsTab: { labelKey: 'tabs.chats', icon: 'chatbubble-outline', rootScreen: 'ChatsList' },
  CatchUpTab: { labelKey: 'tabs.catchUp', icon: 'sparkles-outline' },
  DiscoverTab: { labelKey: 'tabs.discover', icon: 'compass-outline', rootScreen: 'DiscoverHub' },
  CallsTab: { labelKey: 'tabs.calls', icon: 'call-outline' },
  SettingsTab: { labelKey: 'tabs.settings', icon: 'settings-outline', rootScreen: 'SettingsHome' },
};

export function MainTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useGochaTheme();
  const { t } = useLanguage();

  const focusedRoute = state.routes[state.index];
  const tabBarStyle = descriptors[focusedRoute.key]?.options?.tabBarStyle;

  if (
    tabBarStyle &&
    typeof tabBarStyle === 'object' &&
    'display' in tabBarStyle &&
    tabBarStyle.display === 'none'
  ) {
    return null;
  }

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const meta = TAB_META[route.name];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) {
            return;
          }

          if (meta?.rootScreen) {
            navigation.navigate(route.name, { screen: meta.rootScreen });
            return;
          }

          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tab}>
            <Ionicons
              name={meta?.icon ?? 'ellipse-outline'}
              size={22}
              color={isFocused ? theme.colors.primary : theme.colors.mutedForeground}
            />
            <Text
              style={{
                color: isFocused ? theme.colors.primary : theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 11,
              }}>
              {meta ? t(meta.labelKey) : route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
});
