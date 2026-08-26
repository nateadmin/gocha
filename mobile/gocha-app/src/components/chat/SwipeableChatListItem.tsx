import { View, StyleSheet } from 'react-native';

import { ChatListItem } from './ChatListItem';
import { SwipeableRow, swipeIconFor, swipeLabelFor } from './SwipeableRow';
import { useChat } from '../../chat/ChatContext';
import type { ChatRecord } from '../../chat/types';

type Props = {
  chat: ChatRecord;
  selected?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

export function SwipeableChatListItem({ chat, selected, onPress, onLongPress }: Props) {
  const { preferences, applySwipeAction } = useChat();

  return (
    <SwipeableRow
      rightLabel={swipeLabelFor(preferences.swipeRight)}
      leftLabel={swipeLabelFor(preferences.swipeLeft)}
      rightIcon={swipeIconFor(preferences.swipeRight)}
      leftIcon={swipeIconFor(preferences.swipeLeft)}
      onSwipeRight={() => applySwipeAction(chat.id, preferences.swipeRight)}
      onSwipeLeft={() => applySwipeAction(chat.id, preferences.swipeLeft)}>
      <View style={styles.rowBg}>
        <ChatListItem
          chat={chat}
          selected={selected}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      </View>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  rowBg: {
    backgroundColor: 'transparent',
  },
});
