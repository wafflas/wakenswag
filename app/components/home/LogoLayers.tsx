import type {ReactNode} from 'react';

interface LogoLayersProps {
  children: ReactNode;
  height: number;
  variant: 'mobile' | 'desktop';
  viewBox: string;
  width: number;
}

export function LogoLayers({
  children,
  height,
  variant,
  viewBox,
  width,
}: LogoLayersProps) {
  const svgProps = {
    'aria-hidden': true,
    focusable: false,
    fill: 'none',
    height,
    viewBox,
    width,
    xmlns: 'http://www.w3.org/2000/svg',
  } as const;

  return (
    <span
      aria-label="Wake n Swag"
      className={`ps2-logo-stack ps2-logo-stack--${variant}`}
      role="img"
    >
      <svg
        {...svgProps}
        className={`ps2-logo ps2-logo--${variant} ps2-logo--base`}
      >
        {children}
      </svg>
      <svg
        {...svgProps}
        className={`ps2-logo ps2-logo--${variant} ps2-logo--glow`}
      >
        {children}
      </svg>
    </span>
  );
}
