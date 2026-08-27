import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EmojiPickerPanel } from './EmojiPickerPanel';
import { StickerPickerPanel } from './StickerPickerPanel';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { ActionSheet, type ActionSheetItem } from './ActionSheet';
import { useGochaTheme } from '../../theme';

type Panel = 'none' | 'emoji' | 'sticker' | 'attach' | 'voice';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend?: () => void;
  onSendEmoji?: (emoji: string) => void;
  onSendSticker?: (key: string) => void;
  onSendVoice?: (durationSec: number) => void;
  onAttachImage?: () => void;
  onAttachVideo?: () => void;
  onAttachFile?: () => void;
  replyLabel?: string;
  onCancelReply?: () => void;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  onSendEmoji,
  onSendSticker,
  onSendVoice,
  onAttachImage,
  onAttachVideo,
  onAttachFile,
  replyLabel,
  onCancelReply,
}: Props) {
  const { theme } = useGochaTheme();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const [panel, setPanel] = useState<Panel>('none');
  const [attachOpen, setAttachOpen] = useState(false);

  const webInputReset =
    Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
        } as const)
      : {};

  const attachItems: ActionSheetItem[] = [
    {
      id: 'image',
      label: 'Photo',
      onPress: () => onAttachImage?.(),
    },
    {
      id: 'video',
      label: 'Video',
      onPress: () => onAttachVideo?.(),
    },
    {
      id: 'file',
      label: 'Document',
      onPress: () => onAttachFile?.(),
    },
    {
      id: 'sticker',
      label: 'Sticker',
      onPress: () => setPanel('sticker'),
    },
  ];

  if (panel === 'voice') {
    return (
      <VoiceRecorderBar
        onComplete={(duration) => {
          onSendVoice?.(duration);
          setPanel('none');
        }}
        onCancel={() => setPanel('none')}
      />
    );
  }

  return (
    <View style={styles.root}>
      {replyLabel ? (
        <View
          style={[
            styles.replyBar,
            {
              backgroundColor: theme.colors.muted,
              borderTopColor: theme.colors.border,
            },
          ]}>
          <Ionicons name="return-down-forward" size={16} color={theme.colors.primary} />
          <View style={styles.inputWrap}>
            <TextInput
              editable={false}
              value={replyLabel}
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 13,
              }}
            />
          </View>
          <Pressable onPress={onCancelReply} hitSlop={8} style={styles.action}>
            <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      {panel === 'emoji' ? (
        <EmojiPickerPanel
          onPick={(emoji) => {
            onSendEmoji?.(emoji);
            setPanel('none');
          }}
        />
      ) : null}
      {panel === 'sticker' ? (
        <StickerPickerPanel
          onPick={(key) => {
            onSendSticker?.(key);
            setPanel('none');
          }}
        />
      ) : null}

      <View
        style={[
          styles.bar,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.card,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}>
        <Pressable
          hitSlop={8}
          style={styles.action}
          onPress={() => {
            setAttachOpen(true);
            setPanel('none');
          }}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </Pressable>
        <View style={styles.inputWrap}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Message"
            placeholderTextColor={theme.colors.mutedForeground}
            selectionColor={theme.colors.primary}
            style={[
              styles.input,
              webInputReset,
              {
                backgroundColor: theme.colors.muted,
                color: theme.colors.cardForeground,
                borderRadius: theme.radii.pill,
                fontFamily: theme.typography.sans,
                borderWidth: focused ? 1 : 0,
                borderColor: theme.colors.primary,
              },
            ]}
          />
        </View>
        <Pressable
          hitSlop={8}
          style={styles.action}
          onPress={() => setPanel(panel === 'emoji' ? 'none' : 'emoji')}>
          <Ionicons name="happy-outline" size={22} color={theme.colors.primary} />
        </Pressable>
        {value.trim() ? (
          <Pressable hitSlop={8} style={styles.action} onPress={onSend}>
            <Ionicons name="send" size={22} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <Pressable hitSlop={8} style={styles.action} onPress={() => setPanel('voice')}>
            <Ionicons name="mic-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>

      <ActionSheet
        visible={attachOpen}
        title="Attach"
        items={attachItems}
        onClose={() => setAttachOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: '100%',
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
  },
  action: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
