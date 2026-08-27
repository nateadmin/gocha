import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';

import { useChat } from '../../chat/ChatContext';
import type { ChatFilterId } from '../../chat/types';
import { useGochaTheme } from '../../theme';

type Props = {
  onManageLists?: () => void;
  onOpenHidden?: () => void;
};

export function ChatFilterBar({ onManageLists, onOpenHidden }: Props) {
  const { theme } = useGochaTheme();
  const {
    activeFilter,
    setActiveFilter,
    lists,
    labels,
    preferences,
    archivedChats,
    hiddenChats,
  } = useChat();

  const filters: { id: ChatFilterId | string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'groups', label: 'Groups' },
    { id: 'favorites', label: 'Favorites' },
    ...lists.map((list) => ({ id: `list:${list.id}`, label: list.name })),
    ...(preferences.labelsEnabled
      ? labels.map((label) => ({ id: `label:${label.id}`, label: label.name }))
      : []),
    ...(archivedChats.length > 0 ? [{ id: 'archived', label: 'Archived' }] : []),
    ...(hiddenChats.length > 0 ? [{ id: 'hidden', label: 'Hidden' }] : []),
  ];

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {filters.map((filter) => {
          const active = activeFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => {
                if (filter.id === 'hidden') {
                  onOpenHidden?.();
                  return;
                }
                setActiveFilter(filter.id);
              }}
              onLongPress={() => {
                if (filter.id.startsWith('list:')) onManageLists?.();
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.muted,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.pill,
                },
              ]}>
              <Text
                style={{
                  color: active
                    ? theme.colors.primaryForeground
                    : theme.colors.mutedForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 11,
                }}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onManageLists}
          style={[
            styles.chip,
            styles.addChip,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radii.pill,
            },
          ]}>
          <Text style={{ color: theme.colors.primary, fontSize: 11 }}>+ List</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  row: {
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addChip: {
    backgroundColor: 'transparent',
  },
});
