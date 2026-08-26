import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../../components/app';
import type { GochaTheme } from '../../theme/palette';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList } from '../../navigation/types';

export function ChatInfoScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatsStackParamList, 'ChatInfo'>>();
  const { theme } = useGochaTheme();
  const chatApi = useChat();
  const chat = chatApi.getChat(route.params.chatId);

  if (!chat) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
      </Pressable>
      <View style={styles.hero}>
        <Avatar label={chat.avatarLabel} color={chat.avatarColor} size={72} />
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.serif,
            fontSize: 22,
            marginTop: 12,
          }}>
          {chat.name}
        </Text>
        {chat.isGroup ? (
          <Text style={{ color: theme.colors.mutedForeground }}>
            {chat.groupCount ?? 0} members
          </Text>
        ) : null}
      </View>

      <InfoRow
        icon="notifications-outline"
        label={chat.muted ? 'Muted' : 'Notifications on'}
        theme={theme}
      />
      <InfoRow
        icon="timer-outline"
        label={
          chat.disappearingTimerSec
            ? `Disappearing: ${chat.disappearingTimerSec}s`
            : 'Disappearing messages off'
        }
        theme={theme}
      />
      <InfoRow
        icon="shield-checkmark-outline"
        label={chat.isSecret ? 'Secret chat enabled' : 'Regular chat'}
        theme={theme}
      />
      <InfoRow
        icon="lock-closed-outline"
        label={chat.locked ? 'Chat locked' : 'Chat not locked'}
        theme={theme}
      />

      <Text style={[styles.section, { color: theme.colors.mutedForeground }]}>
        Lists
      </Text>
      {chatApi.lists
        .filter((list) => chat.listIds.includes(list.id))
        .map((list) => (
          <Text key={list.id} style={{ color: theme.colors.cardForeground, marginBottom: 6 }}>
            {list.name}
          </Text>
        ))}

      {chatApi.preferences.labelsEnabled ? (
        <>
          <Text style={[styles.section, { color: theme.colors.mutedForeground }]}>
            Labels
          </Text>
          {chatApi.labels
            .filter((label) => chat.labelIds.includes(label.id))
            .map((label) => (
              <View
                key={label.id}
                style={[
                  styles.labelChip,
                  { backgroundColor: label.color, borderRadius: theme.radii.pill },
                ]}>
                <Text style={{ color: '#fff' }}>{label.name}</Text>
              </View>
            ))}
        </>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: GochaTheme;
}) {
  return (
    <View style={[styles.row, { borderColor: theme.colors.border }]}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.sans,
          fontSize: 15,
        }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { marginBottom: 12 },
  hero: { alignItems: 'center', marginBottom: 24 },
  section: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
});
