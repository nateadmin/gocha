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
