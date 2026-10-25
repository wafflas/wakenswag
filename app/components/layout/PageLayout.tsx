import {useCallback, useEffect} from 'react';
import {useBlocker, useNavigation, type BlockerFunction} from 'react-router';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

const FADE_OUT_DURATION_MS = 500;

/**
 * Intentionally minimal storefront shell.
 *
 * Commerce data remains available in the props above so a header, cart drawer,
 * search, and footer can be added without changing the root loader.
 */
export function PageLayout({children = null}: PageLayoutProps) {
  const shouldFade = useCallback<BlockerFunction>(
    ({currentLocation, nextLocation}) =>
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash,
    [],
  );
  const blocker = useBlocker(shouldFade);
  const navigation = useNavigation();
  const proceed = blocker.state === 'blocked' ? blocker.proceed : undefined;
  const isPageTransition =
    blocker.state !== 'unblocked' || navigation.state !== 'idle';

  useEffect(() => {
    if (!proceed) return undefined;

    const timeoutId = window.setTimeout(proceed, FADE_OUT_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [proceed]);

  return (
    <main
      aria-busy={isPageTransition}
      className={
        isPageTransition ? 'anim-fade-out pointer-events-none' : 'anim-fade-in'
      }
    >
      {children}
    </main>
  );
}
