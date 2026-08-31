import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';

import type { StatusAuthorRecord } from '../../api/client';
import { ProfileAvatar } from '../app/ProfileAvatar';
import { useLanguage } from '../../i18n/LanguageContext';
import { statusRingTone } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';
import { StatusRing } from './StatusRing';

type Props = {
  mine: StatusAuthorRecord | null;
  recent: StatusAuthorRecord[];
  onOpenMine: () => void;
  onAdd: () => void;
  onOpenUser: (userId: number) => void;
};

export function StatusTray({ mine, recent, onOpenMine, onAdd, onOpenUser }: Props) {
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const hasMine = (mine?.itemCount ?? 0) > 0;
  const mineTone = statusRingTone(hasMine, hasMine);

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          onPress={mine && mine.itemCount > 0 ? onOpenMine : onAdd}
          accessibilityRole="button"
          style={styles.item}>
          <View>
            <StatusRing tone={mineTone} size={56}>
              <ProfileAvatar
                avatarUrl={mine?.avatarUrl}
                displayName={mine?.displayName}
                userId={mine?.userId}
                size={56}
              />
            </StatusRing>
            <Pressable onPress={onAdd} style={[styles.add, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: theme.colors.primaryForeground, fontSize: 16, lineHeight: 18 }}>+</Text>
            </Pressable>
          </View>
          <Text
            numberOfLines={1}
            style={{ color: theme.colors.cardForeground, fontSize: 12, marginTop: 6, maxWidth: 68 }}>
            {t('status.myStatus')}
          </Text>
        </Pressable>

        {recent.map((author) => (
          <Pressable
            key={author.userId}
            onPress={() => onOpenUser(author.userId)}
            accessibilityRole="button"
            style={styles.item}>
            <StatusRing tone={statusRingTone(author.itemCount > 0, author.unseenCount > 0)} size={56}>
              <ProfileAvatar
                avatarUrl={author.avatarUrl}
                displayName={author.displayName}
                userId={author.userId}
                size={56}
              />
            </StatusRing>
            <Text
              numberOfLines={1}
              style={{ color: theme.colors.cardForeground, fontSize: 12, marginTop: 6, maxWidth: 68 }}>
              {author.displayName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  row: {
    paddingHorizontal: 12,
    gap: 12,
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  add: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
