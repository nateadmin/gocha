import type { CSSProperties } from 'react';
import styled from 'styled-components';

import { UniversalLoader } from '../app/UniversalLoader';
import { useGochaTheme } from '../../theme';
import { brandFontFamilies } from '../../theme/fonts';

type Props = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
};

export function CtaButton({
  label,
  loading = false,
  disabled = false,
  fullWidth = true,
  onPress,
}: Props) {
  const { theme } = useGochaTheme();
  const isDisabled = disabled || loading;

  return (
    <StyledWrapper
      $fontFamily={brandFontFamilies.cta}
      $fontSize={theme.typography.body}
      style={
        fullWidth
          ? ({ width: '100%' } as CSSProperties)
          : undefined
      }>
      <button
        type="button"
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onPress}
        aria-busy={loading}>
        <span className="text">
          {loading ? <UniversalLoader size={0.28} /> : label}
        </span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $fontFamily: string; $fontSize: number }>`
  button {
    align-items: center;
    background-image: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
    border: 0;
    border-radius: 8px;
    box-shadow: rgba(151, 65, 252, 0.2) 0 15px 30px -5px;
    box-sizing: border-box;
    color: #ffffff;
    display: flex;
    font-family: ${(p) => p.$fontFamily};
    font-size: ${(p) => p.$fontSize}px;
    font-weight: 600;
    justify-content: center;
    line-height: 1.25;
    max-width: 100%;
    min-width: 140px;
    padding: 3px;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s;
    width: 100%;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  button:active:not(:disabled),
  button:hover:not(:disabled) {
    outline: 0;
  }

  button span.text {
    background-color: rgb(5, 6, 45);
    padding: 16px 24px;
    border-radius: 6px;
    width: 100%;
    height: 100%;
    transition: 300ms;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    box-sizing: border-box;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
  }

  button:hover:not(:disabled) span.text {
    background: none;
  }

  button:active:not(:disabled) {
    transform: scale(0.9);
  }
`;
