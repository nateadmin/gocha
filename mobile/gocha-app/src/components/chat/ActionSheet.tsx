import { Modal, Pressable, View, Text, StyleSheet, ScrollView } from 'react-native';

import { useGochaTheme } from '../../theme';

export type ActionSheetItem = {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title?: string;
  items: ActionSheetItem[];
  onClose: () => void;
};

export function ActionSheet({ visible, title, items, onClose }: Props) {
  const { theme } = useGochaTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          {title ? (
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 13,
                marginBottom: 8,
                textAlign: 'center',
              }}>
              {title}
            </Text>
          ) : null}
          <ScrollView>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
                style={styles.row}>
                <Text
                  style={{
                    color: item.destructive
                      ? theme.colors.destructive
                      : theme.colors.cardForeground,
                    fontFamily: theme.typography.sans,
                    fontSize: 16,
                  }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderWidth: 1,
    paddingVertical: 8,
    maxHeight: '70%',
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
