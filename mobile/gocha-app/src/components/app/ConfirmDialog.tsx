import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';

import { CtaButton } from '../brand/CtaButton';
import { useGochaTheme } from '../../theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}>
            {title}
          </Text>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 16,
            }}>
            {message}
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans }}>
                Cancel
              </Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <CtaButton
                label={confirmLabel}
                compact
                onPress={() => {
                  onCancel();
                  onConfirm();
                }}
                style={destructive ? { opacity: 0.9 } : undefined}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderWidth: 1,
    padding: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
});
