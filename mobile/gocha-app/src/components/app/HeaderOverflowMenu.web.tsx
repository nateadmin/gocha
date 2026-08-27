import styled from 'styled-components';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';
import { AnimatedHamburgerMenu } from './AnimatedHamburgerMenu';
import type { DropdownMenuItem } from './DropdownMenu';

type Props = {
  open: boolean;
  menuTop: number;
  items: DropdownMenuItem[];
  onPress: () => void;
  onClose: () => void;
  anchor?: 'right' | 'left';
  accessibilityLabel?: string;
  size?: number;
  strokeColor?: string;
};

/** Web: keep trigger above fixed overlay so the menu-to-X animation stays visible. */
export function HeaderOverflowMenu({
  open,
  menuTop,
  items,
  onPress,
  onClose,
  anchor = 'right',
  accessibilityLabel = 'Open menu',
  size = 40,
  strokeColor,
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <MenuAnchor $open={open} $headerZ={theme.overlayMenu.headerZIndex}>
      {open ? (
        <>
          <Backdrop
            aria-hidden
            onClick={onClose}
            style={{ backgroundColor: theme.overlayMenu.backdropColor }}
            $z={theme.overlayMenu.zIndex}
          />
          <MenuPanel
            $anchor={anchor}
            $menuTop={menuTop}
            $maxHeight={theme.overlayMenu.panelMaxHeight}
            $minWidth={theme.overlayMenu.panelMinWidth}
            $z={theme.overlayMenu.zIndex + 1}
            role="menu"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              boxShadow: `0 8px 16px ${theme.colors.primary}2e`,
            }}>
            {items.map((item) => (
              <MenuButton
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose();
                  item.onPress();
                }}>
                {item.icon ? (
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={item.destructive ? theme.colors.destructive : theme.colors.primary}
                  />
                ) : null}
                <span
                  style={{
                    color: item.destructive ? theme.colors.destructive : theme.colors.cardForeground,
                    fontFamily: theme.typography.sans,
                    fontSize: 15,
                  }}>
                  {item.label}
                </span>
              </MenuButton>
            ))}
          </MenuPanel>
        </>
      ) : null}
      <AnimatedHamburgerMenu
        open={open}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        strokeColor={strokeColor}
        size={size}
        style={{ position: 'relative', zIndex: theme.overlayMenu.headerZIndex + 2 }}
      />
    </MenuAnchor>
  );
}

export type { DropdownMenuItem };

const MenuAnchor = styled.div<{ $open: boolean; $headerZ: number }>`
  position: relative;
  z-index: ${(p) => (p.$open ? p.$headerZ : 'auto')};
`;

const Backdrop = styled.div<{ $z: number }>`
  inset: 0;
  position: fixed;
  z-index: ${(p) => p.$z};
`;

const MenuPanel = styled.div<{
  $anchor: 'left' | 'right';
  $menuTop: number;
  $minWidth: number;
  $maxHeight: number;
  $z: number;
}>`
  border: 1px solid;
  border-radius: 14px;
  max-height: ${(p) => p.$maxHeight}px;
  min-width: ${(p) => p.$minWidth}px;
  overflow-y: auto;
  position: fixed;
  top: ${(p) => p.$menuTop}px;
  z-index: ${(p) => p.$z};
  ${(p) => (p.$anchor === 'right' ? 'right: 16px;' : 'left: 16px;')}
`;

const MenuButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  text-align: left;
  width: 100%;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;
