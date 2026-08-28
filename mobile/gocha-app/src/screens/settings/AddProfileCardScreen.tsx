import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CtaButton } from '../../components/brand';
import { SectionLabel } from '../../components/app';
import { PROFILE_CARD_TYPES } from '../../profileCards/profileCardMeta';
import type { ProfileCardType } from '../../api/client';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function AddProfileCardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const [selected, setSelected] = useState<ProfileCardType>('professional');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 16 }}>
          Settings
        </Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 8,
        }}>
        Add a new profile
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: 20,
        }}>
        Choose what this profile is for. It stays private until you approve access.
      </Text>

      <SectionLabel>PROFILE TYPE</SectionLabel>
      <View
        style={[
          styles.list,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        {PROFILE_CARD_TYPES.map((item, index) => (
          <View key={item.type}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.border }]} /> : null}
            <Pressable
              onPress={() => {
                setSelected(item.type);
                navigation.navigate('EditProfileCard', { type: item.type });
              }}
              style={styles.row}>
              <Ionicons name={item.icon} size={22} color={theme.colors.cardForeground} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.cardForeground,
                    fontFamily: theme.typography.sans,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                  {item.label}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>{item.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={selected === item.type ? theme.colors.primary : theme.colors.mutedForeground}
              />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <CtaButton
          label="Continue"
          onPress={() => navigation.navigate('EditProfileCard', { type: selected })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  list: { borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  divider: { height: StyleSheet.hairlineWidth },
});
