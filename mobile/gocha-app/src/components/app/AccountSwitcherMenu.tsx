import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { StoredAccount } from '../../accounts/accountStore';
import { useGochaTheme } from '../../theme';
import { ProfileAvatar } from './ProfileAvatar';

type Props = {
  visible: boolean;
  accounts: StoredAccount[];
  activeAccountId: number | null;
  menuTop: number;
  onClose: () => void;
  onSelectAccount: (userId: number) => void;
  onAddAccount: () => void;
  onManageAccounts: () => void;
};

export function AccountSwitcherMenu({
  visible,
  accounts,
  activeAccountId,
  menuTop,
  onClose,
  onSelectAccount,
  onAddAccount,
  onManageAccounts,
}: Props) {
  const { theme } = useGochaTheme();

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close account menu" />
        <View
          style={[
            styles.menu,
            {
              top: menuTop,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.primary,
            },
          ]}>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 12,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
              textTransform: 'uppercase',
            }}>
            Accounts
          </Text>

          {accounts.length === 0 ? (
            <Text
              style={{
                color: theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 14,
                paddingHorizontal: 16,
                paddingBottom: 12,
              }}>
              No saved accounts on this device yet.
            </Text>
          ) : (
            accounts.map((account, index) => {
              const active = account.userId === activeAccountId;
              return (
                <Pressable
                  key={account.userId}
                  onPress={() => {
                    onClose();
                    onSelectAccount(account.userId);
                  }}
                  style={[
                    styles.accountRow,
                    index < accounts.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}>
                  <ProfileAvatar
                    avatarUrl={account.avatarUrl}
                    displayName={account.displayName}
                    userId={account.userId}
                    size={36}
                  />
                  <View style={styles.accountText}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.colors.cardForeground,
                        fontFamily: theme.typography.sans,
                        fontSize: 15,
                        fontWeight: active ? '600' : '400',
                      }}>
                      {account.displayName}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.colors.mutedForeground,
                        fontFamily: theme.typography.sans,
                        fontSize: 13,
                      }}>
                      {account.label}
                    </Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              );
            })
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <Pressable
            onPress={() => {
              onClose();
              onAddAccount();
            }}
            style={styles.actionRow}>
            <Ionicons name="person-add-outline" size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 15 }}>
              Add account
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              onManageAccounts();
            }}
            style={styles.actionRow}>
            <Ionicons name="settings-outline" size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 15 }}>
              Manage accounts
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    position: 'absolute',
    left: 16,
    minWidth: 280,
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
