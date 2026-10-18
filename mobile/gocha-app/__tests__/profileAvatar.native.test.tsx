import React from 'react';
import { Image, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/theme/fonts', () => ({
  useBrandFonts: () => ({ ready: true }),
  brandFontFamilies: {},
}));

jest.mock('../src/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    rtl: false,
    options: [],
    t: (key: string) => key,
    setLanguage: () => undefined,
  }),
}));

import { ProfileAvatar } from '../src/components/app/ProfileAvatar';
import { StatusHeaderButton } from '../src/components/status/StatusHeaderButton';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { buildCharacterAvatarDataUri } from '../src/branding/characterAvatarCore';

function wrap(node: React.ReactElement) {
  return <ThemeProvider>{node}</ThemeProvider>;
}

function imageUris(tree: ReactTestRenderer.ReactTestRenderer): string[] {
  return tree.root.findAllByType(Image).map((node) => {
    const source = node.props.source as { uri?: string } | number | undefined;
    if (source && typeof source === 'object' && 'uri' in source) {
      return source.uri ?? '';
    }
    return '';
  });
}

describe('native ProfileAvatar', () => {
  it('does not pass generated SVG data URIs to Image (Android crash after login)', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(wrap(<ProfileAvatar displayName="Karim" userId={1} />));
    });

    expect(imageUris(tree!)).toEqual([]);
    expect(
      tree!.root
        .findAllByType(Text)
        .map((node) => node.props.children)
        .join(''),
    ).toContain('KA');
  });

  it('does not load remote SVG photos through Image', () => {
    const svg = buildCharacterAvatarDataUri('karim');
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        wrap(<ProfileAvatar avatarUrl={svg} displayName="Karim Apps" userId={1} />),
      );
    });

    expect(imageUris(tree!).some((uri) => /svg/i.test(uri))).toBe(false);
  });

  it('still loads raster photos', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        wrap(
          <ProfileAvatar
            avatarUrl="https://app.gocha.ai/storage/avatars/1.png"
            displayName="Karim"
            userId={1}
          />,
        ),
      );
    });

    expect(imageUris(tree!)).toEqual(['https://app.gocha.ai/storage/avatars/1.png']);
  });
});

describe('Chats header after login', () => {
  it('renders the status button without SVG Image sources', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        wrap(<StatusHeaderButton mine={null} onOpenMine={() => undefined} onAdd={() => undefined} />),
      );
    });

    expect(imageUris(tree!).some((uri) => /svg/i.test(uri))).toBe(false);
  });
});
