import type {ReactNode} from 'react';
import {CRTOverlay} from '~/components/ps2/CRTOverlay';

interface PS2ShellProps {
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}

export function PS2Shell({
  children,
  footer = null,
  className = '',
}: PS2ShellProps) {
  return (
    <div
      className={[
        'relative isolate min-h-dvh overflow-hidden bg-ps2-black',
        'font-ps2 text-ps2-white',
        className,
      ].join(' ')}
    >
      <div className="relative z-10 min-h-dvh">{children}</div>

      {footer}

      <CRTOverlay />
    </div>
  );
}
