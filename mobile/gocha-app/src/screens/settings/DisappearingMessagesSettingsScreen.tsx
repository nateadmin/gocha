import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { DurationPickerSheet } from '../../components/chat/DurationPickerSheet';
import { useChat } from '../../chat/ChatContext';
import {
  disappearingSettingSummary,
  formatDurationLabel,
} from '../../chat/disappearingMessages';
import { useGochaTheme } from '../../theme';

export function DisappearingMessagesSettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useGochaTheme();
  const { preferences, setDefaultDisappearingTimer } = useChat();
  const [pickerOpen, setPickerOpen] = useState(false);

  const defaultSec = preferences.defaultDisappearingTimerSec;
  const summary =
    defaultSec === null
      ? 'Off'
      : formatDurationLabel(defaultSec);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 16 }}>
          Settings
        </Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 8,
        }}>
        Disappearing messages
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 20,
        }}>
        Choose a default timer for new chats. Individual chats can keep this default, turn
        disappearing messages off, or use their own timer.
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Pressable onPress={() => setPickerOpen(true)} style={styles.linkRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
              Default timer
            </Text>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 13,
                marginTop: 4,
              }}>
              {summary}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
      </View>

      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 13,
          lineHeight: 18,
        }}>
        Chats using the account default will show:{' '}
        {disappearingSettingSummary(undefined, defaultSec)}.
      </Text>

      <DurationPickerSheet
        visible={pickerOpen}
        title="Default disappearing messages"
        showOff
        offLabel="Off"
        onClose={() => setPickerOpen(false)}
        onSelect={(selection) => {
          if (selection === 'inherit') {
            return;
          }
          setDefaultDisappearingTimer(selection);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  card: {
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
});
