export type PlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type SelectedPlace = {
  formattedAddress: string;
  placeId: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function newPlacesSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `places-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isSelectedPlace(address: string, placeId: string | null | undefined): boolean {
  return address.trim() !== '' && Boolean(placeId && placeId.trim());
}
