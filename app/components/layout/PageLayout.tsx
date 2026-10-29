import {useCallback} from 'react';
import type {BlockerFunction} from 'react-router';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {RouteFadeTransition} from '~/components/animations/RouteFadeTransition';
import {CartModal} from '~/components/cart/CartModal';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';
import {SearchModal} from '~/components/search/SearchModal';
import {Aside} from './Aside';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

/**
 * Intentionally minimal storefront shell.
 *
 * Commerce data remains available in the props above so a header, cart drawer,
 * search, and footer can be added without changing the root loader.
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
    <Aside.Provider>
      <RouteFadeTransition shouldTransition={shouldFade}>
        {children}
        <SearchModal />
        <CartModal cart={cart} />
        <AppControllerFooter />
      </RouteFadeTransition>
    </Aside.Provider>
  );
}
