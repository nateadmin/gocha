import { useId } from 'react';
import type { CSSProperties } from 'react';
import styled from 'styled-components';

type Props = {
  size?: number;
};

const BASE_PX = 100;

export function UniversalLoader({ size = 1 }: Props) {
  const maskId = `gocha-loader-mask-${useId().replace(/:/g, '')}`;
  const visualSize = BASE_PX * size;
  const compact = size < 0.5;

  if (compact) {
    return (
      <CompactLoader
        style={{ width: visualSize, height: visualSize }}
        role="status"
        aria-label="Loading">
        <svg viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id={`${maskId}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="30%" stopColor="#ffbf48" />
              <stop offset="70%" stopColor="#be4a1d" />
            </linearGradient>
          </defs>
          <polygon points="12,4 20,20 4,20" fill={`url(#${maskId}-fill)`} />
        </svg>
      </CompactLoader>
    );
  }

  return (
    <StyledWrapper
      style={
        {
          '--loader-scale': String(size),
          width: visualSize,
          height: visualSize,
        } as CSSProperties
      }
      role="status"
      aria-label="Loading">
      <div className="loader">
        <svg width={BASE_PX} height={BASE_PX} viewBox="0 0 100 100" aria-hidden>
          <defs>
            <mask id={maskId}>
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />
              <polygon points="25,25 75,25 50,75" fill="white" />
              <polygon points="50,25 75,75 25,75" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
            </mask>
          </defs>
        </svg>
        <div
          className="box"
          style={{
            mask: `url(#${maskId})`,
            WebkitMask: `url(#${maskId})`,
          }}
        />
      </div>
    </StyledWrapper>
  );
}

const CompactLoader = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  outline: 0;
  box-shadow: none;
  background: transparent;
  flex-shrink: 0;

  svg {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    outline: 0;
    animation: compact-spin 0.9s linear infinite;
    transform-origin: center center;
  }

  @keyframes compact-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StyledWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 0;
  outline: 0;
  box-shadow: none;
  background: transparent;
  flex-shrink: 0;

  .loader {
    --loader-scale: 1;
    --color-one: #ffbf48;
    --color-two: #be4a1d;
    --time-animation: 2s;
    position: relative;
    width: ${BASE_PX}px;
    height: ${BASE_PX}px;
    transform: scale(var(--loader-scale));
    transform-origin: center center;
    border: 0;
    outline: 0;
    box-shadow: none;
    background: transparent;
    animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
  }

  .loader .box {
    width: ${BASE_PX}px;
    height: ${BASE_PX}px;
    border: 0;
    outline: 0;
    box-shadow: none;
    background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
  }

  .loader svg {
    position: absolute;
    inset: 0;
    border: 0;
    outline: 0;
    pointer-events: none;
  }

  .loader svg mask {
    filter: contrast(15);
    animation: roundness calc(var(--time-animation) / 2) linear infinite;
  }

  .loader svg mask polygon {
    filter: blur(7px);
  }

  .loader svg mask polygon:nth-child(1) {
    transform-origin: 75% 25%;
    transform: rotate(90deg);
  }

  .loader svg mask polygon:nth-child(2) {
    transform-origin: 50% 50%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg mask polygon:nth-child(3) {
    transform-origin: 50% 60%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -3);
  }

  .loader svg mask polygon:nth-child(4) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg mask polygon:nth-child(5) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
    animation-delay: calc(var(--time-animation) / -2);
  }

  .loader svg mask polygon:nth-child(6) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
  }

  .loader svg mask polygon:nth-child(7) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -1.5);
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes roundness {
    0% {
      filter: contrast(15);
    }
    20% {
      filter: contrast(3);
    }
    40% {
      filter: contrast(3);
    }
    60% {
      filter: contrast(15);
    }
    100% {
      filter: contrast(15);
    }
  }

  @keyframes colorize {
    0% {
      filter: hue-rotate(0deg);
    }
    20% {
      filter: hue-rotate(-30deg);
    }
    40% {
      filter: hue-rotate(-60deg);
    }
    60% {
      filter: hue-rotate(-90deg);
    }
    80% {
      filter: hue-rotate(-45deg);
    }
    100% {
      filter: hue-rotate(0deg);
    }
  }
`;
