import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { BootstrapErrorBoundary } from '../src/components/app/BootstrapErrorBoundary';

function Broken(): React.ReactElement {
  throw new Error('boom');
}

test('error fallback does not require ThemeProvider', () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <BootstrapErrorBoundary>
        <Broken />
      </BootstrapErrorBoundary>,
    );
  });

  const labels = tree!.root.findAllByType(Text).map((node) => node.props.children);
  expect(labels.join(' ')).toContain('Something went wrong');
  errorSpy.mockRestore();
});

test('Reload recovers on native, where window exists but window.location does not', () => {
  let shouldThrow = true;
  function Flaky(): React.ReactElement {
    if (shouldThrow) {
      throw new Error('boom');
    }
    return <Text>recovered</Text>;
  }
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <BootstrapErrorBoundary>
        <Flaky />
      </BootstrapErrorBoundary>,
    );
  });
  shouldThrow = false;
  const reload = tree!.root.findAll((node) => typeof node.props.onPress === 'function')[0];

  expect(() => ReactTestRenderer.act(() => reload.props.onPress())).not.toThrow();
  const labels = tree!.root.findAllByType(Text).map((node) => node.props.children);
  expect(labels).toContain('recovered');
  errorSpy.mockRestore();
});
