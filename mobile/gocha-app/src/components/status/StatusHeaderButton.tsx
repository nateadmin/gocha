import { Pressable, Text, StyleSheet } from 'react-native';

import type { StatusAuthorRecord } from '../../api/client';
import { ProfileAvatar } from '../app/ProfileAvatar';
import { useLanguage } from '../../i18n/LanguageContext';
import { statusRingTone } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';
import { StatusRing } from './StatusRing';

type Props = {
  mine: StatusAuthorRecord | null;
  onOpenMine: () => void;
  onAdd: () => void;
};

const SIZE = 36;

export function StatusHeaderButton({ mine, onOpenMine, onAdd }: Props) {
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const hasMine = (mine?.itemCount ?? 0) > 0;

  return (
    <Pressable
      onPress={hasMine ? onOpenMine : onAdd}
      accessibilityRole="button"
      accessibilityLabel={hasMine ? t('status.myStatus') : t('status.add')}
      style={styles.wrap}>
      <StatusRing tone={statusRingTone(hasMine, hasMine)} size={SIZE}>
        <ProfileAvatar
          avatarUrl={mine?.avatarUrl}
          displayName={mine?.displayName}
          userId={mine?.userId}
          size={SIZE}
        />
      </StatusRing>
      <Pressable
        onPress={onAdd}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={t('status.add')}
        style={[styles.add, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.primaryForeground, fontSize: 13, lineHeight: 14 }}>+</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
  },
  add: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
