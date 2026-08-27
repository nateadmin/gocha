import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

export type DropdownMenuItem = {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  anchor?: 'right' | 'left';
  items: DropdownMenuItem[];
  onClose: () => void;
};

export function DropdownMenu({ visible, anchor = 'right', items, onClose }: Props) {
  const { theme } = useGochaTheme();

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.menu,
            anchor === 'right' ? styles.menuRight : styles.menuLeft,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.primary,
            },
          ]}>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={[
                styles.row,
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
              ]}>
              {item.icon ? (
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={item.destructive ? theme.colors.destructive : theme.colors.primary}
                />
              ) : null}
              <Text
                style={{
                  color: item.destructive ? theme.colors.destructive : theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 15,
                }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    position: 'absolute',
    top: 72,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  menuRight: { right: 16 },
  menuLeft: { left: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
