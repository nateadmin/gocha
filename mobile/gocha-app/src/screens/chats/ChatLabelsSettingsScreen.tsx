import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CtaButton } from '../../components/brand';
import { SettingsToggleRow } from '../../components/app';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

const LABEL_COLORS = ['#1B00D8', '#00b8ff', '#ff0055', '#00ff9f', '#f7ff00', '#ff8800', '#9b59b6'];

function LabelColorPicker({
  colors,
  selected,
  onSelect,
}: {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
}) {
  const { theme } = useGochaTheme();

  return (
    <View style={styles.colorRow}>
      {colors.map((color) => (
        <Pressable
          key={color}
          onPress={() => onSelect(color)}
          style={[
            styles.colorSwatch,
            { backgroundColor: color },
            selected === color && {
              borderColor: theme.colors.primary,
              borderWidth: 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ChatLabelsSettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useGochaTheme();
  const {
    labels,
    preferences,
    setLabelsEnabled,
    createLabel,
    updateLabel,
    deleteLabel,
    setSwipeRight,
    setSwipeLeft,
    setHiddenChatsPin,
    setChatLockPin,
  } = useChat();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(LABEL_COLORS[0]);

  function startEditing(labelId: string) {
    const label = labels.find((item) => item.id === labelId);
    if (!label) return;
    setEditingId(labelId);
    setEditName(label.name);
    setEditColor(label.color);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
    setEditColor(LABEL_COLORS[0]);
  }

  function saveEditing() {
    if (!editingId || !editName.trim()) return;
    updateLabel(editingId, { name: editName.trim(), color: editColor });
    cancelEditing();
  }

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
                styles.labelCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.card,
                },
              ]}>
              {editingId === label.id ? (
                <>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Label name"
                    placeholderTextColor={theme.colors.mutedForeground}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.cardForeground,
                        borderRadius: theme.radii.card,
                      },
                    ]}
                  />
                  <LabelColorPicker colors={LABEL_COLORS} selected={editColor} onSelect={setEditColor} />
                  <View style={styles.editActions}>
                    <Pressable onPress={cancelEditing}>
                      <Text style={{ color: theme.colors.mutedForeground }}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={saveEditing}>
                      <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Save</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.labelRow}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: label.color, borderRadius: theme.radii.pill },
                    ]}
                  />
                  <Text style={{ color: theme.colors.cardForeground, flex: 1 }}>{label.name}</Text>
                  <Pressable onPress={() => startEditing(label.id)} style={styles.actionButton}>
                    <Text style={{ color: theme.colors.primary }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteLabel(label.id)} style={styles.actionButton}>
                    <Text style={{ color: theme.colors.destructive }}>Delete</Text>
                  </Pressable>
                </View>
              )}
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
          <LabelColorPicker colors={LABEL_COLORS} selected={newColor} onSelect={setNewColor} />
          <CtaButton
            label="Add label"
            onPress={() => {
              if (!newName.trim()) return;
              createLabel(newName.trim(), newColor);
              setNewName('');
              setNewColor(LABEL_COLORS[(labels.length + 1) % LABEL_COLORS.length]);
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
  labelCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: { width: 12, height: 12 },
  input: { borderWidth: 1, padding: 12, marginBottom: 4 },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionButton: {
    paddingHorizontal: 4,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  gestureRow: { flexDirection: 'row', gap: 16 },
});
