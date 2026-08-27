import styled from 'styled-components';

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
    </LogoButton>
  );
}

const LogoButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  padding: 0;

  img {
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }
`;
