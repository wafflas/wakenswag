import type {ReactNode} from 'react';

interface HomeShellProps {
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}

export function HomeShell({
  children,
  footer = null,
  className = '',
}: HomeShellProps) {
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
    </div>
  );
}
