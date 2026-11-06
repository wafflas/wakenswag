import type {ReactNode} from 'react';
import {HomeShell} from './HomeShell';
import Logo from '~/components/shared/Logo';

/** Shared logo sizing and placement for the home and information menus. */
export function MainMenuLayout({children}: {children: ReactNode}) {
  return (
    <HomeShell>
      <div
        className={[
          'flex min-h-dvh flex-col items-center justify-center',
          'gap-10 overflow-hidden pb-24',
          'lg:flex-row lg:gap-[clamp(3rem,8vw,10rem)]',
        ].join(' ')}
      >
        <div className="flex shrink-0 items-center justify-center">
          <Logo />
        </div>
        <div className="flex shrink-0 items-center justify-center">
          {children}
        </div>
      </div>
    </HomeShell>
  );
}
