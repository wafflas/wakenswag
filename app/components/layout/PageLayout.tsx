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
 * Owns the global dialogs, controller footer and main-menu route transitions.
 */
export function PageLayout({children = null, cart}: PageLayoutProps) {
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
