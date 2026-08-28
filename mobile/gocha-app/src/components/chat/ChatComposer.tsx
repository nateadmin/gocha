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

import type { PickedMedia } from '../../chat/pickMedia';
import { pickCameraPhoto, pickDocument } from '../../chat/pickMedia';
import type { RecordedVoice } from '../../chat/voiceRecording';
import { EmojiStickerPickerPanel } from './EmojiStickerPickerPanel';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { useGochaTheme } from '../../theme';

type Panel = 'none' | 'sticker' | 'voice';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend?: () => void;
  onSendEmoji?: (emoji: string) => void;
  onSendSticker?: (key: string) => void;
  onSendVoice?: (voice: RecordedVoice) => void;
  onAttachImage?: (media: PickedMedia) => void;
  onAttachVideo?: (media: PickedMedia) => void;
  onAttachFile?: (media: PickedMedia) => void;
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

  const webActionStyle =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

  async function handleCameraPress() {
    setPanel('none');
    const media = await pickCameraPhoto();
    if (media) {
      onAttachImage?.(media);
    }
  }

  async function handleFilePress() {
    setPanel('none');
    const media = await pickDocument();
    if (!media) {
      return;
    }

    if (media.mimeType.startsWith('image/')) {
      onAttachImage?.(media);
      return;
    }

    if (media.mimeType.startsWith('video/')) {
      onAttachVideo?.(media);
      return;
    }

    onAttachFile?.(media);
  }

  if (panel === 'voice') {
    return (
      <VoiceRecorderBar
        onComplete={(voice) => {
          onSendVoice?.(voice);
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
          <View style={styles.replyTextWrap}>
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
          <Pressable onPress={onCancelReply} hitSlop={8} style={[styles.outsideAction, webActionStyle]}>
            <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      {panel === 'sticker' ? (
        <EmojiStickerPickerPanel
          onPickEmoji={(emoji) => {
            onSendEmoji?.(emoji);
            setPanel('none');
          }}
          onPickSticker={(key) => {
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
        <View
          style={[
            styles.fieldShell,
            {
              backgroundColor: theme.colors.muted,
              borderRadius: theme.radii.pill,
              borderColor: focused ? theme.colors.primary : 'transparent',
              borderWidth: focused ? 1 : 0,
            },
          ]}>
          <Pressable
            hitSlop={6}
            style={[styles.inlineAction, webActionStyle]}
            accessibilityLabel="Emoji and stickers"
            onPress={() => setPanel(panel === 'sticker' ? 'none' : 'sticker')}>
            <Ionicons name="happy-outline" size={22} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            hitSlop={6}
            style={[styles.inlineAction, webActionStyle]}
            accessibilityLabel="Attach file"
            onPress={handleFilePress}>
            <Ionicons name="attach" size={22} color={theme.colors.primary} />
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
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                },
              ]}
            />
          </View>
          <Pressable
            hitSlop={6}
            style={[styles.inlineAction, webActionStyle]}
            accessibilityLabel="Camera"
            onPress={handleCameraPress}>
            <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>

        {value.trim() ? (
          <Pressable hitSlop={8} style={[styles.outsideAction, webActionStyle]} onPress={onSend}>
            <Ionicons name="send" size={22} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <Pressable
            hitSlop={8}
            style={[styles.outsideAction, webActionStyle]}
            accessibilityLabel="Record voice message"
            onPress={() => setPanel('voice')}>
            <Ionicons name="mic-outline" size={24} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>
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
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: '100%',
  },
  fieldShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
  inlineAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    flexShrink: 0,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 16,
  },
  outsideAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    flexShrink: 0,
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
  replyTextWrap: {
    flex: 1,
    minWidth: 0,
  },
});
