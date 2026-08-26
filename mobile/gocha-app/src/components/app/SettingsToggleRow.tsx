import { Switch, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingsToggleRow({ icon, label, value, onValueChange }: Props) {
  const { theme } = useGochaTheme();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.muted, borderRadius: theme.radii.pill },
          ]}>
          <Ionicons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: theme.typography.body,
          }}>
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.primaryForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
