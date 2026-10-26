import {useCallback} from 'react';
import type {BlockerFunction} from 'react-router';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {RouteFadeTransition} from '~/components/animations/RouteFadeTransition';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

/**
 * Intentionally minimal storefront shell.
 *
 * Commerce data remains available in the props above so a header, cart drawer,
 * search, and footer can be added without changing the root loader.
 */
export function PageLayout({children = null}: PageLayoutProps) {
  const shouldFade = useCallback<BlockerFunction>(
    ({currentLocation, nextLocation}) => {
      const isLeavingMainMenu =
        currentLocation.pathname === '/' && nextLocation.pathname !== '/';
      const isReturningToMainMenu =
        currentLocation.pathname !== '/' && nextLocation.pathname === '/';

      return isLeavingMainMenu || isReturningToMainMenu;
    },
    [],
  );

  return (
    <>
      <RouteFadeTransition shouldTransition={shouldFade}>
        {children}
        <AppControllerFooter />
      </RouteFadeTransition>
    </>
  );
}
