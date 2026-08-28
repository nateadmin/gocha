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
  compact?: boolean;
  onPress?: () => void;
};

export function CtaButton({
  label,
  loading = false,
  disabled = false,
  fullWidth = true,
  compact = false,
  onPress,
}: Props) {
  const { theme } = useGochaTheme();
  const isDisabled = disabled || loading;

  return (
    <StyledWrapper
      $fontFamily={brandFontFamilies.cta}
      $fontSize={compact ? theme.typography.caption : theme.typography.body}
      $compact={compact}
      $fullWidth={fullWidth}
      style={
        fullWidth
          ? ({ width: '100%' } as CSSProperties)
          : undefined
      }>
      <button
        type="button"
        disabled={disabled}
        onClick={isDisabled ? undefined : onPress}
        aria-busy={loading}
        aria-disabled={isDisabled}>
        <span className="text">
          {loading ? <UniversalLoader size={compact ? 0.22 : 0.28} /> : label}
        </span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{
  $fontFamily: string;
  $fontSize: number;
  $compact: boolean;
  $fullWidth: boolean;
}>`
  button {
    align-items: center;
    background-image: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
    border: 0;
    border-radius: ${(p) => (p.$compact ? '6px' : '8px')};
    box-shadow: ${(p) =>
      p.$compact
        ? 'rgba(151, 65, 252, 0.15) 0 6px 16px -4px'
        : 'rgba(151, 65, 252, 0.2) 0 15px 30px -5px'};
    box-sizing: border-box;
    color: #ffffff;
    display: flex;
    font-family: ${(p) => p.$fontFamily};
    font-size: ${(p) => p.$fontSize}px;
    font-weight: 600;
    justify-content: center;
    line-height: 1.25;
    max-width: 100%;
    min-width: ${(p) => (p.$compact ? '0' : '140px')};
    padding: 3px;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s;
    width: ${(p) => (p.$fullWidth ? '100%' : 'auto')};
  }

  button[aria-busy='true'] {
    cursor: wait;
    pointer-events: none;
  }

  button:disabled,
  button[aria-disabled='true']:not([aria-busy='true']) {
    cursor: not-allowed;
    opacity: 0.55;
  }

  button:active:not(:disabled),
  button:hover:not(:disabled) {
    outline: 0;
  }

  button span.text {
    background-color: rgb(5, 6, 45);
    padding: ${(p) => (p.$compact ? '7px 12px' : '16px 24px')};
    border-radius: ${(p) => (p.$compact ? '4px' : '6px')};
    width: 100%;
    height: 100%;
    transition: 300ms;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: ${(p) => (p.$compact ? '32px' : '48px')};
    box-sizing: border-box;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    border: 0;
    outline: 0;
    box-shadow: none;
    overflow: hidden;
  }

  button span.text > * {
    border: 0;
    outline: 0;
    box-shadow: none;
  }

  button:hover:not(:disabled) span.text {
    background: none;
  }

  button:active:not(:disabled) {
    transform: scale(0.9);
  }
`;
