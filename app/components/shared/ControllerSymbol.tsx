import type {ReactNode} from 'react';

export type ControllerSymbolName = 'circle' | 'triangle' | 'square' | 'cross';

interface ControllerSymbolProps {
  symbol: ControllerSymbolName;
}

const symbolColors: Record<ControllerSymbolName, string> = {
  circle: 'text-[#E95529]',
  triangle: 'text-[#3ee3a1]',
  square: 'text-[#D694BE]',
  cross: 'text-[#A3ABD5]',
};

const symbolSVGs: Record<ControllerSymbolName, ReactNode> = {
  circle: (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  triangle: (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 2.4 14 13H2L8 2.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ),
  square: (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <rect
        x="2.75"
        y="2.75"
        width="10.5"
        height="10.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  cross: (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="m3.5 3.5 9 9m0-9-9 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  ),
};

export function ControllerSymbol({symbol}: ControllerSymbolProps) {
  return (
    <span
      aria-hidden="true"
      className={`ps2-controller-symbol !size-5 !basis-5 sm:!size-6 sm:!basis-6 ${symbolColors[symbol]}`}
    >
      {symbolSVGs[symbol]}
    </span>
  );
}
