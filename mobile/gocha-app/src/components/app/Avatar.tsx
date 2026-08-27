import { View, Text, StyleSheet } from 'react-native';

import { useGochaTheme } from '../../theme';

type Props = {
  label: string;
  color?: string;
  size?: number;
  badge?: number;
};

export function Avatar({ label, color, size = 48, badge }: Props) {
  const { theme } = useGochaTheme();

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: theme.radii.avatar,
            backgroundColor: color ?? theme.colors.muted,
          },
        ]}>
        <Text
          style={{
            color: theme.colors.primaryForeground,
            fontFamily: theme.typography.sans,
            fontSize: size * 0.32,
          }}>
          {label}
        </Text>
      </View>
      {badge != null && badge > 0 ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radii.pill,
            },
          ]}>
          <Text
            style={{
              color: theme.colors.primaryForeground,
              fontFamily: theme.typography.sans,
              fontSize: 10,
            }}>
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
