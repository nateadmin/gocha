import type { CSSProperties } from 'react';
import styled from 'styled-components';

type Props = {
  open: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  strokeColor?: string;
  size?: number;
  style?: CSSProperties;
};

export function AnimatedHamburgerMenu({
  open,
  onPress,
  accessibilityLabel = 'Open menu',
  strokeColor = '#00b8ff',
  size = 48,
  style,
}: Props) {
  return (
    <HamburgerButton
      type="button"
      $open={open}
      $strokeColor={strokeColor}
      $size={size}
      style={style}
      onClick={onPress}
      aria-label={open ? 'Close menu' : accessibilityLabel}
      aria-expanded={open}>
      <svg viewBox="0 0 32 32" aria-hidden>
        <path className="line line-top" d="M27 10 5 10" />
        <path className="line line-middle" d="M27 16 5 16" />
        <path className="line line-bottom" d="M27 22 5 22" />
      </svg>
    </HamburgerButton>
  );
}

const HamburgerButton = styled.button<{ $open: boolean; $strokeColor: string; $size: number }>`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: ${(p) => p.$size}px;
  justify-content: center;
  padding: 0;
  position: relative;
  width: ${(p) => p.$size}px;

  svg {
    fill: none;
    height: ${(p) => p.$size * 0.75}px;
    transform: rotate(${(p) => (p.$open ? '-45deg' : '0deg')});
    transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
    width: ${(p) => p.$size * 0.75}px;
  }

  .line {
    stroke: ${(p) => p.$strokeColor};
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
  }

  .line-middle {
    opacity: ${(p) => (p.$open ? 0 : 1)};
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }
`;
