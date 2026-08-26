import { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { IconButton, SearchField } from '../../components/app';
import { BrandLogo } from '../../components/brand';
import { ChatListItem } from '../../components/chat';
import { chatSummaries } from '../../data/mock';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList } from '../../navigation/types';

export function ChatsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'ChatsList'>>();
  const { theme } = useGochaTheme();
  const [query, setQuery] = useState('');

  const filtered = chatSummaries.filter((chat) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      chat.name.toLowerCase().includes(q) ||
      chat.preview.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BrandLogo size={56} />
        <View style={styles.headerActions}>
          <IconButton icon="radio-button-on" accessibilityLabel="Status updates" />
          <IconButton icon="camera-outline" />
          <IconButton icon="create-outline" tone="primary" />
        </View>
      </View>
      <View style={styles.searchWrap}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search conversations"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: theme.colors.card, flex: 1 }}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            onPress={() => navigation.navigate('ChatDetail', { chatId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  list: {
    paddingBottom: 8,
  },
});
