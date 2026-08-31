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

import { GlobalSearchResults } from '../src/components/chat/GlobalSearchResults';
import type { PublicUserProfile } from '../src/api/client';
import { ThemeProvider } from '../src/theme';

function person(overrides: Partial<PublicUserProfile>): PublicUserProfile {
  return {
    id: 1,
    username: null,
    displayName: 'Nate Mandel',
    status: null,
    bio: null,
    avatarUrl: null,
    verificationStatus: 'none',
    profileMode: 'personal',
    website: null,
    chatUserId: 1,
    ...overrides,
  };
}

function labelsOf(tree: ReactTestRenderer.ReactTestRenderer): string[] {
  return tree.root.findAllByType(Text).map((node) => {
    const children = node.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

test('search people omit a subtitle when username is empty', () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <ThemeProvider initialMode="dark">
        <GlobalSearchResults
          query="nate mandel"
          conversations={[]}
          contacts={[]}
          localContacts={[]}
          messages={[]}
          people={[
            person({ id: 1, username: 'natemandel', chatUserId: 1 }),
            person({ id: 2, username: null, chatUserId: 2 }),
            person({ id: 3, username: '   ', chatUserId: 3 }),
          ]}
          loading={false}
          startingChatUserId={null}
          onOpenChat={() => undefined}
          onOpenContact={() => undefined}
          onOpenMessage={() => undefined}
          onStartChatWithPerson={() => undefined}
          onLongPressChat={() => undefined}
        />
      </ThemeProvider>,
    );
  });

  const labels = labelsOf(tree!);
  expect(labels).toContain('@natemandel');
  expect(labels).not.toContain('In your chats');
  expect(labels.filter((label) => label.startsWith('@'))).toEqual(['@natemandel']);
});
