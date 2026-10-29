import type {ReactNode} from 'react';
import {HomeShell} from '~/components/home/HomeShell';

interface ContentPageShellProps {
  children?: ReactNode;
  title: string;
}

/** Minimal PS2 content layout for static pages (socials, info, etc.). */
export function ContentPageShell({children, title}: ContentPageShellProps) {
  return (
    <HomeShell>
      <div
        className={[
          'flex min-h-dvh flex-col items-center justify-center',
          'gap-6 overflow-hidden px-6 pb-24',
        ].join(' ')}
      >
        <h1 className="text-ps2-outline text-center text-4xl text-ps2-yellow lg:text-6xl">
          {title}
        </h1>
        {children ? (
          <div className="ps2-soft-copy max-w-xl text-center text-xl text-ps2-muted lg:text-2xl">
            {children}
          </div>
        ) : null}
      </div>
    </HomeShell>
  );
}
