import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BUSINESS_INDUSTRY_IDS, BUSINESS_INDUSTRY_LABELS, industryLabel } from '../../data/businessIndustries';
import { useGochaTheme } from '../../theme';

type IndustryOption = { id: string; label: string };

type Props = {
  value: string;
  onChange: (id: string) => void;
  options?: IndustryOption[];
};

export function IndustryPicker({ value, onChange, options }: Props) {
  const { theme } = useGochaTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    if (options?.length) {
      return options;
    }
    return BUSINESS_INDUSTRY_IDS.map((id) => ({ id, label: BUSINESS_INDUSTRY_LABELS[id] }));
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
        ]}>
        <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
          {industryLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
            onPress={(event) => event.stopPropagation()}>
            <Text
              style={{
                color: theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 17,
                fontWeight: '600',
                marginBottom: 10,
              }}>
              Industry
            </Text>
            <View
              style={[
                styles.search,
                { backgroundColor: theme.colors.muted, borderRadius: theme.radii.pill },
              ]}>
              <Ionicons name="search" size={18} color={theme.colors.mutedForeground} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search industries"
                placeholderTextColor={theme.colors.mutedForeground}
                style={{
                  flex: 1,
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                }}
              />
            </View>
            <ScrollView style={styles.list}>
              {filtered.map((item) => {
                const active = item.id === value;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      onChange(item.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={[
                      styles.option,
                      active && { backgroundColor: theme.colors.muted },
                    ]}>
                    <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
                      {item.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    marginBottom: 8,
  },
  list: { maxHeight: 320 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
});
