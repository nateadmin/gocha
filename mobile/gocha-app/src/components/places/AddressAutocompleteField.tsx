import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';

import { fetchPlaceDetails, fetchPlacePredictions } from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import {
  isSelectedPlace,
  newPlacesSessionToken,
  type PlacePrediction,
  type SelectedPlace,
} from '../../places/addressPlaces';
import { useGochaTheme } from '../../theme';

type Props = {
  value: string;
  placeId: string | null;
  onChangeText: (value: string) => void;
  onSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  types?: 'address' | 'geocode';
  editable?: boolean;
};

export function AddressAutocompleteField({
  value,
  placeId,
  onChangeText,
  onSelect,
  placeholder = 'Street address',
  types = 'address',
  editable = true,
}: Props) {
  const { theme } = useGochaTheme();
  const sessionToken = useRef(newPlacesSessionToken());
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = isSelectedPlace(value, placeId);

  useEffect(() => {
    const needle = value.trim();
    if (!editable || selected || needle.length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      void fetchPlacePredictions(needle, sessionToken.current, types)
        .then((rows) => {
          if (!cancelled) {
            setPredictions(rows);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setPredictions([]);
            setError(formatApiError(err, 'Could not load address suggestions.'));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editable, selected, types, value]);

  async function choose(prediction: PlacePrediction) {
    setLoading(true);
    setError(null);
    try {
      const place = await fetchPlaceDetails(prediction.placeId, sessionToken.current);
      sessionToken.current = newPlacesSessionToken();
      setPredictions([]);
      onSelect(place);
    } catch (err) {
      setError(formatApiError(err, 'Could not use that address.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={(next) => {
          onChangeText(next);
        }}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        autoCorrect={false}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            color: theme.colors.cardForeground,
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.input ?? 'transparent',
          },
        ]}
      />
      {value.trim() !== '' && !selected ? (
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
          Select a suggested address.
        </Text>
      ) : null}
      {loading && predictions.length === 0 ? (
        <View style={styles.searching}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={{ color: theme.colors.mutedForeground }}>Searching addresses…</Text>
        </View>
      ) : null}
      {predictions.map((prediction) => (
        <Pressable
          key={prediction.placeId}
          onPress={() => void choose(prediction)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${prediction.description}`}
          style={[styles.result, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.cardForeground, fontWeight: '600' }}>{prediction.mainText}</Text>
          {prediction.secondaryText ? (
            <Text style={{ color: theme.colors.mutedForeground, marginTop: 2 }}>{prediction.secondaryText}</Text>
          ) : null}
        </Pressable>
      ))}
      {value.trim().length >= 2 && !selected && !loading && predictions.length === 0 && !error ? (
        <Text style={{ color: theme.colors.mutedForeground, marginBottom: 8 }}>No matching addresses.</Text>
      ) : null}
      {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 8 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  searching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  result: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
});
