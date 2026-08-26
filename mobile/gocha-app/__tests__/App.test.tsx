/**
 * @format
 */

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('../src/theme/fonts', () => ({
  useBrandFonts: () => ({ ready: true }),
  brandFontFamilies: {},
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
