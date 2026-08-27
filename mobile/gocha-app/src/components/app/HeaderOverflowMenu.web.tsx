import { useLayoutEffect, useRef, useState } from 'react';
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

type TriggerRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** Web: portal overlay to body; float the animated trigger above it at measured coords. */
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
  const anchorRef = useRef<HTMLDivElement>(null);
  const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
  const menuZ = theme.overlayMenu.zIndex;
  const triggerZ = theme.overlayMenu.triggerZIndex;

  useLayoutEffect(() => {
    if (!open) {
      setTriggerRect(null);
      return;
    }

    function measure() {
      const node = anchorRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setTriggerRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }

    measure();
    const raf = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, size]);

  const hamburger = (
    <AnimatedHamburgerMenu
      open={open}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      strokeColor={strokeColor}
      size={size}
    />
  );

  const triggerPad = size * 0.4;
  const overlay =
    open && typeof document !== 'undefined'
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
            {triggerRect ? (
              <TriggerLayer
                $top={triggerRect.top - triggerPad}
                $left={triggerRect.left - triggerPad}
                $width={triggerRect.width + triggerPad * 2}
                $height={triggerRect.height + triggerPad * 2}
                $z={triggerZ}>
                {hamburger}
              </TriggerLayer>
            ) : null}
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {overlay}
      <AnchorSlot ref={anchorRef} $size={size}>
        {open ? null : hamburger}
      </AnchorSlot>
    </>
  );
}

export type { DropdownMenuItem };

const AnchorSlot = styled.div<{ $size: number }>`
  flex-shrink: 0;
  height: ${(p) => p.$size}px;
  position: relative;
  width: ${(p) => p.$size}px;
`;

const TriggerLayer = styled.div<{
  $top: number;
  $left: number;
  $width: number;
  $height: number;
  $z: number;
}>`
  align-items: center;
  display: flex;
  height: ${(p) => p.$height}px;
  justify-content: center;
  left: ${(p) => p.$left}px;
  overflow: visible;
  pointer-events: auto;
  position: fixed;
  top: ${(p) => p.$top}px;
  width: ${(p) => p.$width}px;
  z-index: ${(p) => p.$z};
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
