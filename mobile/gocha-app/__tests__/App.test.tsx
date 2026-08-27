/**
 * @format
 */

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('../src/theme/fonts', () => ({
  useBrandFonts: () => ({ ready: true }),
  brandFontFamilies: {},
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    status: 401,
    json: async () => ({ code: 'UNAUTHENTICATED', message: 'Sign in required.' }),
  } as Response),
) as jest.Mock;

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
