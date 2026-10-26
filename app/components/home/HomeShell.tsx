import type {ReactNode} from 'react';

interface HomeShellProps {
  children: ReactNode;
  className?: string;
}

export function HomeShell({children, className = ''}: HomeShellProps) {
  return (
    <div
      className={[
        'relative isolate min-h-dvh overflow-hidden bg-ps2-black',
        'font-ps2 text-ps2-white',
        className,
      ].join(' ')}
    >
      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}
