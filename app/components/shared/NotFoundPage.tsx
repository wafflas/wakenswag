import {useCallback} from 'react';
import type {BlockerFunction} from 'react-router';
import {RouteFadeTransition} from '~/components/animations/RouteFadeTransition';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';
import {Aside} from '~/components/layout/Aside';
import {Link} from 'react-router';

export function NotFoundPage() {
  const shouldFade = useCallback<BlockerFunction>(
    ({currentLocation, nextLocation}) =>
      currentLocation.pathname !== nextLocation.pathname,
    [],
  );

  return (
    <Aside.Provider>
      <RouteFadeTransition shouldTransition={shouldFade}>
        <div
          className={[
            'relative isolate flex min-h-dvh flex-col items-center justify-center',
            'overflow-hidden px-6 font-ps2 text-ps2-white',
            '[background:linear-gradient(140deg,#c4c4c4_0%,#757575_40%,#303030_80%,#151515_100%)]',
          ].join(' ')}
        >
          <p className="text-ps2-outline text-6xl text-ps2-yellow lg:text-8xl">
            404
          </p>

          <p className="ps2-soft-copy  text-center text-xl text-ps2-muted lg:text-2xl">
            Page not found
          </p>

          <button
            aria-label="Return to the main menu"
            className="ps2-cta text-center text-xl lg:text-2xl"
          >
            <Link to="/">Return to the main menu</Link>
          </button>
        </div>

        <AppControllerFooter />
      </RouteFadeTransition>
    </Aside.Provider>
  );
}
