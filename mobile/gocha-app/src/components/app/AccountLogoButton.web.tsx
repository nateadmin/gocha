import styled from 'styled-components';

import { useGochaTheme } from '../../theme';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  logoSize?: number;
  showBadge?: boolean;
};

export function AccountLogoButton({
  onPress,
  accessibilityLabel = 'Switch account',
  logoSize = 40,
  showBadge = false,
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <LogoButton type="button" onClick={onPress} aria-label={accessibilityLabel}>
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
`;

const LogoWrap = styled.span<{ $size: number }>`
  display: block;
  height: ${(props) => props.$size}px;
  position: relative;
  width: ${(props) => props.$size}px;

  img {
    display: block;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
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
