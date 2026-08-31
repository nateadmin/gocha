/**
 * @format
 */

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('../src/theme/fonts', () => ({
  useBrandFonts: () => ({ ready: true }),
  brandFontFamilies: {},
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';

import { CallsScreen } from '../src/screens/calls/CallsScreen';
import { ThemeProvider } from '../src/theme';

test('Calls tab shows coming soon instead of a call list', () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <ThemeProvider initialMode="dark">
        <CallsScreen />
      </ThemeProvider>,
    );
  });

  const labels = tree!
    .root
    .findAllByType(Text)
    .map((node) => String(node.props.children));

  expect(labels).toContain('Calls');
  expect(labels).toContain('Coming soon');
  expect(labels).toContain('Voice and video need a call provider.');
  expect(labels.some((label) => /missed|incoming|outgoing/i.test(label))).toBe(false);
});
