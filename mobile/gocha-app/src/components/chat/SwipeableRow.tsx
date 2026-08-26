import { useRef, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  View,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';
import type { SwipeAction } from '../../chat/types';

const SWIPE_THRESHOLD = 72;
const MAX_SWIPE = 96;

type Props = {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export function SwipeableRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Pin',
  leftLabel = 'Archive',
  rightIcon = 'pin-outline',
  leftIcon = 'archive-outline',
  style,
}: Props) {
  const { theme } = useGochaTheme();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        const clamped = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, gesture.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD && onSwipeRight) {
          onSwipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD && onSwipeLeft) {
          onSwipeLeft();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.actions}>
        <View style={[styles.action, { backgroundColor: theme.colors.secondary }]}>
          <Ionicons name={rightIcon} size={18} color={theme.colors.secondaryForeground} />
          <Text style={[styles.actionText, { color: theme.colors.secondaryForeground }]}>
            {rightLabel}
          </Text>
        </View>
        <View style={[styles.action, { backgroundColor: theme.colors.muted }]}>
          <Ionicons name={leftIcon} size={18} color={theme.colors.cardForeground} />
          <Text style={[styles.actionText, { color: theme.colors.cardForeground }]}>
            {leftLabel}
          </Text>
        </View>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

export function swipeLabelFor(action: SwipeAction): string {
  switch (action) {
    case 'pin':
      return 'Pin';
    case 'read':
      return 'Read';
    case 'archive':
      return 'Archive';
    case 'mute':
      return 'Mute';
    case 'delete':
      return 'Delete';
    default:
      return action;
  }
}

export function swipeIconFor(action: SwipeAction): keyof typeof Ionicons.glyphMap {
  switch (action) {
    case 'pin':
      return 'pin-outline';
    case 'read':
      return 'mail-open-outline';
    case 'archive':
      return 'archive-outline';
    case 'mute':
      return 'volume-mute-outline';
    case 'delete':
      return 'trash-outline';
    default:
      return 'ellipsis-horizontal';
  }
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  actions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
