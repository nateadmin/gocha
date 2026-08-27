import { FlatList, Pressable, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ChatListItem } from '../../components/chat';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

export function BlockedChatsScreen() {
  const navigation = useNavigation();
  const { theme } = useGochaTheme();
  const { blockedChats, unblockChat } = useChat();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
        </Pressable>
        <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.serif, fontSize: 22 }}>
          Blocked
        </Text>
      </View>
      <FlatList
        data={blockedChats}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.mutedForeground, padding: 16 }}>No blocked chats.</Text>
        }
        renderItem={({ item }) => (
          <View>
            <ChatListItem chat={item} onPress={() => {}} />
            <Pressable onPress={() => unblockChat(item.id)} style={styles.unblock}>
              <Text style={{ color: theme.colors.primary }}>Unblock</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  unblock: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
