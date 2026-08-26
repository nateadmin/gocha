import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { AroundMeScreen } from './AroundMeScreen';
import { BusinessesScreen } from '../businesses/BusinessesScreen';
import { useGochaTheme } from '../../theme';

type DiscoverSection = 'around' | 'businesses';

export function DiscoverHubScreen() {
  const { theme } = useGochaTheme();
  const [section, setSection] = useState<DiscoverSection>('around');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.switcher}>
        <SectionPill
          label="Around Me"
          active={section === 'around'}
          onPress={() => setSection('around')}
        />
        <SectionPill
          label="Businesses"
          active={section === 'businesses'}
          onPress={() => setSection('businesses')}
        />
      </View>
      {section === 'around' ? <AroundMeScreen /> : <BusinessesScreen embedded />}
    </View>
  );
}

function SectionPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useGochaTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.pill,
        },
      ]}>
      <Text
        style={{
          color: active ? theme.colors.primaryForeground : theme.colors.cardForeground,
          fontFamily: theme.typography.sans,
          fontSize: 14,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
});
