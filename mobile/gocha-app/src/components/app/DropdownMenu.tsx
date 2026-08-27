import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
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
  menuTop?: number;
  items: DropdownMenuItem[];
  onClose: () => void;
};

export function DropdownMenu({
  visible,
  anchor = 'right',
  menuTop = 72,
  items,
  onClose,
}: Props) {
  const { theme } = useGochaTheme();

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlayMenu.backdropColor }]}
          onPress={onClose}
          accessibilityLabel="Close menu"
        />
        <View
          style={[
            styles.menu,
            anchor === 'right' ? styles.menuRight : styles.menuLeft,
            {
              top: menuTop,
              minWidth: theme.overlayMenu.panelMinWidth,
              maxHeight: theme.overlayMenu.panelMaxHeight,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.primary,
              zIndex: theme.overlayMenu.zIndex,
            },
          ]}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
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
          </ScrollView>
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
  },
  menu: {
    position: 'absolute',
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
