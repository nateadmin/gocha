import { normalizeIdentifier } from '../src/auth/accountChannel';

describe('normalizeIdentifier', () => {
  test('lowercases email', () => {
    expect(normalizeIdentifier('email', ' Nate@Example.COM ')).toBe('nate@example.com');
  });

  test('adds plus and keeps country code digits for phone', () => {
    expect(normalizeIdentifier('phone', '(555) 123-4567')).toBe('+5551234567');
    expect(normalizeIdentifier('phone', '+1 555 123 4567')).toBe('+15551234567');
  });
});
