import { useRef } from 'react';
import styled from 'styled-components';

import { StatusRing } from '../status/StatusRing';
import type { StatusRingTone } from '../../status/statusLogic';
import { ACCOUNT_SWITCH_HOLD_MS } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';

type Props = {
  onPress: () => void;
  onHold?: () => void;
  accessibilityLabel?: string;
  logoSize?: number;
  showBadge?: boolean;
  statusTone?: StatusRingTone;
};

export function AccountLogoButton({
  onPress,
  onHold,
  accessibilityLabel = 'View statuses',
  logoSize = 40,
  showBadge = false,
  statusTone = null,
}: Props) {
  const { theme } = useGochaTheme();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function handlePointerDown() {
    held.current = false;
    clearHold();
    if (!onHold) {
      return;
    }
    holdTimer.current = setTimeout(() => {
      held.current = true;
      onHold();
    }, ACCOUNT_SWITCH_HOLD_MS);
  }

  function handleClick() {
    if (held.current) {
      return;
    }
    onPress();
  }

  return (
    <LogoButton
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onPointerLeave={clearHold}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={accessibilityLabel}>
      <span style={{ width: logoSize + 6, height: logoSize + 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <StatusRing tone={statusTone} size={logoSize}>
        <LogoWrap $size={logoSize}>
          <img
            src="/Logo.jpeg"
            alt=""
            aria-hidden
            draggable={false}
            width={logoSize}
            height={logoSize}
          />
          {showBadge ? (
            <Badge $fill={theme.colors.accent} $border={theme.colors.background} />
          ) : null}
        </LogoWrap>
      </StatusRing>
      </span>
    </LogoButton>
  );
}

const LogoButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  overflow: visible;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
`;

const LogoWrap = styled.span<{ $size: number }>`
  display: block;
  height: ${(props) => props.$size}px;
  overflow: hidden;
  position: relative;
  width: ${(props) => props.$size}px;
  border-radius: 50%;

  img {
    border-radius: 50%;
    display: block;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
    width: 100%;
  }
`;

const Badge = styled.span<{ $fill: string; $border: string }>`
  background: ${(props) => props.$fill};
  border: 2px solid ${(props) => props.$border};
  border-radius: 5px;
  height: 10px;
  position: absolute;
  right: -1px;
  top: -1px;
  width: 10px;
`;
