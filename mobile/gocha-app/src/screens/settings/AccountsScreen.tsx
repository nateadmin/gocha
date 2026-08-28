import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CtaButton } from '../../components/brand/CtaButton';
import { SectionLabel } from '../../components/app';
import { useAccounts } from '../../context/AccountsContext';
import { useAuth } from '../../context/AuthContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function AccountsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { accounts, activeAccountId, switchAccount, removeAccount, beginAddAccount } = useAccounts();
  const { refresh } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.navigate('SettingsHome')} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Settings</Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 12,
        }}>
        Accounts
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16, fontFamily: theme.typography.sans }}>
        Switch between accounts like Telegram. Add another without signing everyone out.
      </Text>

      <SectionLabel>ON THIS DEVICE</SectionLabel>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        {accounts.map((account) => {
          const active = account.userId === activeAccountId;
          return (
            <Pressable
              key={account.userId}
              onPress={async () => {
                if (account.userId === activeAccountId) return;
                const switched = await switchAccount(account.userId);
                if (switched) {
                  await refresh();
                }
              }}
              style={[styles.row, { borderColor: theme.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontWeight: '600' }}>
                  {account.displayName}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans, fontSize: 14 }}>
                  {account.label}
                </Text>
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
              ) : null}
              <Pressable
                onPress={() => removeAccount(account.userId)}
                hitSlop={12}
                style={{ marginLeft: 12 }}>
                <Ionicons name="close-circle-outline" size={22} color={theme.colors.mutedForeground} />
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      <CtaButton label="Add account" onPress={beginAddAccount} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  card: { borderWidth: 1, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
