import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CtaButton } from '../../components/brand';
import { SettingsToggleRow } from '../../components/app';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

const LABEL_COLORS = ['#1B00D8', '#00b8ff', '#ff0055', '#00ff9f', '#f7ff00'];

export function ChatLabelsSettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useGochaTheme();
  const {
    labels,
    preferences,
    setLabelsEnabled,
    createLabel,
    deleteLabel,
    setSwipeRight,
    setSwipeLeft,
    setHiddenChatsPin,
    setChatLockPin,
  } = useChat();
  const [newName, setNewName] = useState('');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
      </Pressable>
      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 26,
          marginBottom: 16,
        }}>
        Chat labels & gestures
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
        <SettingsToggleRow
          icon="pricetag-outline"
          label="Enable custom labels"
          value={preferences.labelsEnabled}
          onValueChange={setLabelsEnabled}
        />
      </View>

      {preferences.labelsEnabled ? (
        <>
          {labels.map((label) => (
            <View
              key={label.id}
              style={[
                styles.labelRow,
                { borderColor: theme.colors.border },
              ]}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: label.color, borderRadius: theme.radii.pill },
                ]}
              />
              <Text style={{ color: theme.colors.cardForeground, flex: 1 }}>
                {label.name}
              </Text>
              <Pressable onPress={() => deleteLabel(label.id)}>
                <Text style={{ color: theme.colors.destructive }}>Delete</Text>
              </Pressable>
            </View>
          ))}
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New label name"
            placeholderTextColor={theme.colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                color: theme.colors.cardForeground,
                borderRadius: theme.radii.card,
              },
            ]}
          />
          <CtaButton
            label="Add label"
            onPress={() => {
              if (!newName.trim()) return;
              createLabel(newName.trim(), LABEL_COLORS[labels.length % LABEL_COLORS.length]);
              setNewName('');
            }}
          />
        </>
      ) : null}

      <Text style={[styles.section, { color: theme.colors.mutedForeground }]}>
        Swipe gestures
      </Text>
      <View style={styles.gestureRow}>
        <Pressable onPress={() => setSwipeRight('pin')}>
          <Text style={{ color: theme.colors.primary }}>Right: {preferences.swipeRight}</Text>
        </Pressable>
        <Pressable onPress={() => setSwipeLeft('archive')}>
          <Text style={{ color: theme.colors.primary }}>Left: {preferences.swipeLeft}</Text>
        </Pressable>
      </View>

      <Text style={[styles.section, { color: theme.colors.mutedForeground }]}>
        Security PINs (demo)
      </Text>
      <Pressable onPress={() => setHiddenChatsPin('4242')}>
        <Text style={{ color: theme.colors.cardForeground }}>Reset hidden chats PIN to 4242</Text>
      </Pressable>
      <Pressable onPress={() => setChatLockPin('0000')} style={{ marginTop: 8 }}>
        <Text style={{ color: theme.colors.cardForeground }}>Reset chat lock PIN to 0000</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  back: { marginBottom: 8 },
  card: { borderWidth: 1, paddingHorizontal: 12, marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 12, height: 12 },
  input: { borderWidth: 1, padding: 12, marginBottom: 12, marginTop: 8 },
  section: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  gestureRow: { flexDirection: 'row', gap: 16 },
});
