import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';

import { useGochaTheme } from '../../theme';

export type DurationPreset = {
  id: string;
  label: string;
  seconds: number;
};

const DEFAULT_PRESETS: DurationPreset[] = [
  { id: '30s', label: '30 seconds', seconds: 30 },
  { id: '1m', label: '1 minute', seconds: 60 },
  { id: '5m', label: '5 minutes', seconds: 300 },
  { id: '1h', label: '1 hour', seconds: 3600 },
  { id: '8h', label: '8 hours', seconds: 28800 },
  { id: '1d', label: '1 day', seconds: 86400 },
  { id: '1w', label: '1 week', seconds: 604800 },
];

type CustomUnit = 'seconds' | 'minutes' | 'hours' | 'days';

type Props = {
  visible: boolean;
  title: string;
  presets?: DurationPreset[];
  showOff?: boolean;
  offLabel?: string;
  onSelect: (seconds: number | null) => void;
  onClose: () => void;
};

export function DurationPickerSheet({
  visible,
  title,
  presets = DEFAULT_PRESETS,
  showOff = false,
  offLabel = 'Off',
  onSelect,
  onClose,
}: Props) {
  const { theme } = useGochaTheme();
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<CustomUnit>('minutes');

  function applyCustom() {
    const amount = Number(customValue.trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const multiplier =
      customUnit === 'seconds'
        ? 1
        : customUnit === 'minutes'
          ? 60
          : customUnit === 'hours'
            ? 3600
            : 86400;

    onSelect(Math.round(amount * multiplier));
    setCustomValue('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}
          onPress={(event) => event.stopPropagation()}>
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 17,
              fontWeight: '600',
              marginBottom: 12,
              textAlign: 'center',
            }}>
            {title}
          </Text>

          <ScrollView style={styles.presetList}>
            {showOff ? (
              <Pressable
                onPress={() => {
                  onSelect(null);
                  onClose();
                }}
                style={[styles.row, { borderBottomColor: theme.colors.border }]}>
                <Text
                  style={{
                    color: theme.colors.destructive,
                    fontFamily: theme.typography.sans,
                    fontSize: 16,
                  }}>
                  {offLabel}
                </Text>
              </Pressable>
            ) : null}
            {presets.map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => {
                  onSelect(preset.seconds);
                  onClose();
                }}
                style={[styles.row, { borderBottomColor: theme.colors.border }]}>
                <Text
                  style={{
                    color: theme.colors.cardForeground,
                    fontFamily: theme.typography.sans,
                    fontSize: 16,
                  }}>
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.customBlock, { borderTopColor: theme.colors.border }]}>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 13,
                marginBottom: 8,
              }}>
              Custom duration
            </Text>
            <View style={styles.customRow}>
              <TextInput
                value={customValue}
                onChangeText={setCustomValue}
                keyboardType="numeric"
                placeholder="Amount"
                placeholderTextColor={theme.colors.mutedForeground}
                style={[
                  styles.customInput,
                  {
                    backgroundColor: theme.colors.muted,
                    color: theme.colors.cardForeground,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.card,
                  },
                ]}
              />
              <View style={styles.unitRow}>
                {(['seconds', 'minutes', 'hours', 'days'] as CustomUnit[]).map((unit) => {
                  const active = customUnit === unit;
                  return (
                    <Pressable
                      key={unit}
                      onPress={() => setCustomUnit(unit)}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor: active ? theme.colors.primary : theme.colors.muted,
                          borderRadius: theme.radii.pill,
                        },
                      ]}>
                      <Text
                        style={{
                          color: active
                            ? theme.colors.primaryForeground
                            : theme.colors.mutedForeground,
                          fontFamily: theme.typography.sans,
                          fontSize: 11,
                        }}>
                        {unit.slice(0, 3)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Pressable
              onPress={applyCustom}
              style={[
                styles.applyButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radii.pill,
                },
              ]}>
              <Text
                style={{
                  color: theme.colors.primaryForeground,
                  fontFamily: theme.typography.sans,
                  fontWeight: '600',
                }}>
                Apply custom
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderWidth: 1,
    paddingVertical: 12,
    maxHeight: '80%',
  },
  presetList: {
    maxHeight: 280,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  customBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  customRow: {
    gap: 8,
    marginBottom: 10,
  },
  customInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  applyButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
});
