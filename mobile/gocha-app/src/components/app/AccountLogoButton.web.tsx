import { useRef } from 'react';
import styled from 'styled-components';

import { StatusRing } from '../status/StatusRing';
import type { StatusRingTone } from '../../status/statusLogic';
import { ACCOUNT_SWITCH_HOLD_MS } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';
import { UnreadDot } from './UnreadDot';

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
      <LogoFrame $size={logoSize}>
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
          </LogoWrap>
        </StatusRing>
        {showBadge ? (
          <BadgeSlot>
            <UnreadDot borderColor={theme.colors.background} />
          </BadgeSlot>
        ) : null}
      </LogoFrame>
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

const LogoFrame = styled.span<{ $size: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${(props) => props.$size + 6}px;
  overflow: visible;
  position: relative;
  width: ${(props) => props.$size + 6}px;
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

const BadgeSlot = styled.span`
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
`;
