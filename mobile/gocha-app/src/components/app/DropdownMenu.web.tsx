import { createPortal } from 'react-dom';
import styled from 'styled-components';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';
import type { DropdownMenuItem } from './DropdownMenu';

type Props = {
  visible: boolean;
  anchor?: 'right' | 'left';
  items: DropdownMenuItem[];
  onClose: () => void;
};

export function DropdownMenu({ visible, anchor = 'right', items, onClose }: Props) {
  const { theme } = useGochaTheme();

  if (!visible || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <Backdrop aria-hidden onClick={onClose} />
      <MenuPanel
        $anchor={anchor}
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
  );
}

const Backdrop = styled.div`
  background: rgba(0, 0, 0, 0.15);
  inset: 0;
  position: fixed;
  z-index: 1000;
`;

const MenuPanel = styled.div<{ $anchor: 'left' | 'right' }>`
  border: 1px solid;
  border-radius: 14px;
  min-width: 220px;
  overflow: hidden;
  position: fixed;
  top: 72px;
  z-index: 1000;
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
