import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Text,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { filesFromClipboardData, pickedMediaFromImageFile } from '../../chat/clipboardImage';
import type { PickedMedia } from '../../chat/pickMedia';
import { pickCameraPhoto, pickDocument } from '../../chat/pickMedia';
import type { RecordedVoice } from '../../chat/voiceRecording';
import { EmojiStickerPickerPanel } from './EmojiStickerPickerPanel';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { useLanguage } from '../../i18n/LanguageContext';
import { useGochaTheme } from '../../theme';

type Panel = 'none' | 'sticker' | 'voice';

export type ComposerAttachmentKind = 'image' | 'video' | 'file';

export type ComposerAttachment = {
  kind: ComposerAttachmentKind;
  media: PickedMedia;
};

export type ComposerSendPayload = {
  text: string;
  attachment?: ComposerAttachment;
};

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend?: (payload: ComposerSendPayload) => void;
  onSendEmoji?: (emoji: string) => void;
  onSendSticker?: (key: string) => void;
  onSendVoice?: (voice: RecordedVoice) => void;
  onOpenGroupPosts?: () => void;
  replyLabel?: string;
  onCancelReply?: () => void;
  onDraftBlur?: () => void;
  onTypingActivity?: (active: boolean) => void;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  onSendEmoji,
  onSendSticker,
  onSendVoice,
  onOpenGroupPosts,
  replyLabel,
  onCancelReply,
  onDraftBlur,
  onTypingActivity,
}: Props) {
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const [panel, setPanel] = useState<Panel>('none');
  const [pendingAttachment, setPendingAttachment] = useState<ComposerAttachment | null>(null);
  const lastPasteAt = useRef(0);

  const stageAttachment = useCallback((kind: ComposerAttachmentKind, media: PickedMedia) => {
    setPendingAttachment({ kind, media });
  }, []);

  const attachPastedImages = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        return false;
      }
      const now = Date.now();
      if (now - lastPasteAt.current < 200) {
        return true;
      }
      lastPasteAt.current = now;
      const file = files[files.length - 1];
      stageAttachment('image', pickedMediaFromImageFile(file));
      return true;
    },
    [stageAttachment],
  );

  useEffect(() => {
    if (!focused || typeof document === 'undefined') {
      return;
    }
    const onPaste = (event: ClipboardEvent) => {
      const files = filesFromClipboardData(event.clipboardData);
      if (attachPastedImages(files)) {
        event.preventDefault();
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [attachPastedImages, focused]);

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

  function submitMessage() {
    const trimmed = value.trim();
    if (!trimmed && !pendingAttachment) {
      return;
    }
    onTypingActivity?.(false);
    onSend?.({
      text: trimmed,
      attachment: pendingAttachment ?? undefined,
    });
    onChangeText('');
    setPendingAttachment(null);
  }

  const canSend = Boolean(value.trim() || pendingAttachment);

  const webSendButtonStyle =
    Platform.OS === 'web'
      ? ({
          border: 0,
          background: 'transparent',
          padding: 0,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          flexShrink: 0,
          cursor: 'pointer',
        } as const)
      : null;

  async function handleCameraPress() {
    setPanel('none');
    const media = await pickCameraPhoto();
    if (media) {
      stageAttachment('image', media);
    }
  }

  async function handleFilePress() {
    setPanel('none');
    const media = await pickDocument();
    if (!media) {
      return;
    }

    if (media.mimeType.startsWith('image/')) {
      stageAttachment('image', media);
      return;
    }

    if (media.mimeType.startsWith('video/')) {
      stageAttachment('video', media);
      return;
    }

    stageAttachment('file', media);
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

      {pendingAttachment ? (
        <View
          style={[
            styles.attachmentBar,
            {
              backgroundColor: theme.colors.muted,
              borderTopColor: theme.colors.border,
            },
          ]}>
          {pendingAttachment.kind === 'image' ? (
            <Image
              source={{ uri: pendingAttachment.media.uri }}
              style={styles.attachmentThumb}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.attachmentThumb,
                styles.attachmentIconWrap,
                { backgroundColor: theme.colors.card },
              ]}>
              <Ionicons
                name={pendingAttachment.kind === 'video' ? 'videocam-outline' : 'document-outline'}
                size={22}
                color={theme.colors.primary}
              />
            </View>
          )}
          <View style={styles.attachmentMeta}>
            <Text
              numberOfLines={1}
              style={{
                color: theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 14,
                fontWeight: '600',
              }}>
              {pendingAttachment.kind === 'image'
                ? 'Photo'
                : pendingAttachment.kind === 'video'
                  ? 'Video'
                  : 'File'}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 12,
                marginTop: 2,
              }}>
              {pendingAttachment.media.fileName}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityLabel="Remove attachment"
            onPress={() => setPendingAttachment(null)}
            style={[styles.outsideAction, webActionStyle]}>
            <Ionicons name="close-circle" size={22} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
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
          {onOpenGroupPosts ? (
            <Pressable
              hitSlop={6}
              style={[styles.inlineAction, webActionStyle]}
              accessibilityLabel="Offer, poll, RSVP"
              onPress={onOpenGroupPosts}>
              <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
            </Pressable>
          ) : null}
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
              onChangeText={(text) => {
                onChangeText(text);
                onTypingActivity?.(text.trim().length > 0);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                onTypingActivity?.(false);
                onDraftBlur?.();
              }}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={theme.colors.mutedForeground}
              selectionColor={theme.colors.primary}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={submitMessage}
              {...(Platform.OS === 'web'
                ? {
                    onKeyDown: (event: {
                      key?: string;
                      shiftKey?: boolean;
                      preventDefault?: () => void;
                    }) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault?.();
                        submitMessage();
                      }
                    },
                    onPaste: (event: {
                      clipboardData?: DataTransfer | null;
                      nativeEvent?: { clipboardData?: DataTransfer | null };
                      preventDefault?: () => void;
                    }) => {
                      const data = event.clipboardData ?? event.nativeEvent?.clipboardData;
                      const files = filesFromClipboardData(data);
                      if (attachPastedImages(files)) {
                        event.preventDefault?.();
                      }
                    },
                  }
                : {})}
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

        {canSend ? (
          Platform.OS === 'web' ? (
            <button
              type="button"
              aria-label="Send message"
              style={webSendButtonStyle ?? undefined}
              onClick={submitMessage}>
              <Ionicons name="send" size={22} color={theme.colors.primary} />
            </button>
          ) : (
            <Pressable hitSlop={8} style={[styles.outsideAction, webActionStyle]} onPress={submitMessage}>
              <Ionicons name="send" size={22} color={theme.colors.primary} />
            </Pressable>
          )
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
    flexShrink: 0,
    zIndex: 2,
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
  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  attachmentThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  attachmentIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentMeta: {
    flex: 1,
    minWidth: 0,
  },
});
