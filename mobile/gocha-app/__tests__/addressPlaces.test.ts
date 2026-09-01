import { isSelectedPlace } from '../src/places/addressPlaces';

describe('addressPlaces', () => {
  it('requires a selected Google place id, not free-typed text', () => {
    expect(isSelectedPlace('130 Avenue F', null)).toBe(false);
    expect(isSelectedPlace('130 Avenue F', '')).toBe(false);
    expect(isSelectedPlace('', 'ChIJ130avef')).toBe(false);
    expect(isSelectedPlace('130 Avenue F, New York, NY, USA', 'ChIJ130avef')).toBe(true);
  });
});
