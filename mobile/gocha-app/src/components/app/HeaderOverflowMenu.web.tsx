import { createPortal } from 'react-dom';
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

/** Web: portal menu to body; keep trigger above overlay for the hamburger-to-X animation. */
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
  const menuZ = theme.overlayMenu.zIndex;
  const triggerZ = theme.overlayMenu.headerZIndex + 2;

  return (
    <MenuAnchor>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <>
              <Backdrop
                aria-hidden
                onClick={onClose}
                style={{ backgroundColor: theme.overlayMenu.backdropColor }}
                $z={menuZ - 1}
              />
              <MenuPanel
                $anchor={anchor}
                $menuTop={menuTop}
                $maxHeight={theme.overlayMenu.panelMaxHeight}
                $minWidth={theme.overlayMenu.panelMinWidth}
                $z={menuZ}
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
            </>,
            document.body,
          )
        : null}
      <AnimatedHamburgerMenu
        open={open}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        strokeColor={strokeColor}
        size={size}
        style={{ position: 'relative', zIndex: open ? triggerZ : undefined }}
      />
    </MenuAnchor>
  );
}

export type { DropdownMenuItem };

const MenuAnchor = styled.div`
  position: relative;
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
