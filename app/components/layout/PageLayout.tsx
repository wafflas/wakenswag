import {useCallback} from 'react';
import type {BlockerFunction} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {RouteFadeTransition} from '~/components/animations/RouteFadeTransition';
import {CartModal} from '~/components/cart/CartModal';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';
import {SearchModal} from '~/components/search/SearchModal';
import {AsideProvider} from './Aside';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  children?: React.ReactNode;
}

/**
 * Intentionally minimal storefront shell.
 *
 * Owns the global dialogs, controller footer and menu/policy route transitions.
 */
export function PageLayout({children = null, cart}: PageLayoutProps) {
  const shouldFade = useCallback<BlockerFunction>(
    ({currentLocation, nextLocation}) => {
      const isLeavingMainMenu =
        currentLocation.pathname === '/' && nextLocation.pathname !== '/';
      const isReturningToMainMenu =
        currentLocation.pathname !== '/' && nextLocation.pathname === '/';
      const isInfoNavigation =
        currentLocation.pathname !== nextLocation.pathname &&
        [currentLocation.pathname, nextLocation.pathname].some(
          (pathname) => pathname === '/info' || pathname.startsWith('/info/'),
        );

      return isLeavingMainMenu || isReturningToMainMenu || isInfoNavigation;
    },
    [],
  );

  return (
    <AsideProvider>
      <RouteFadeTransition shouldTransition={shouldFade}>
        {children}
        <SearchModal />
        <CartModal cart={cart} />
        <AppControllerFooter cart={cart} />
      </RouteFadeTransition>
    </AsideProvider>
  );
}
