import styled from 'styled-components';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  logoSize?: number;
};

export function AccountLogoButton({
  onPress,
  accessibilityLabel = 'Switch account',
  logoSize = 40,
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <LogoButton type="button" onClick={onPress} aria-label={accessibilityLabel}>
      <img
        src="/Logo.jpeg"
        alt=""
        aria-hidden
        draggable={false}
        width={logoSize}
        height={logoSize}
      />
      <Ionicons name="chevron-down" size={14} color={theme.colors.primary} />
    </LogoButton>
  );
}

const LogoButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 0;

  img {
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }
`;
