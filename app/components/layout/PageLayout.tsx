import {useCallback} from 'react';
import type {CustomerPrivacyApiProps} from '@shopify/hydrogen';
import {useLocation, useRouteError, type BlockerFunction} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {RouteFadeTransition} from '~/components/animations/RouteFadeTransition';
import {CartModal} from '~/components/cart/CartModal';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';
import {SearchModal} from '~/components/search/SearchModal';
import {CookieConsentBanner} from '~/components/privacy/CookieConsentBanner';
import {AsideProvider} from './Aside';
import {isProductDetailPath} from '~/lib/variants';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  consent?: CustomerPrivacyApiProps;
  children?: React.ReactNode;
}

/**
 * Intentionally minimal storefront shell.
 *
 * Owns the global dialogs, controller footer and menu/policy route transitions.
 */
export function PageLayout({children = null, cart, consent}: PageLayoutProps) {
  const {pathname} = useLocation();
  const routeError = useRouteError();
  const isProductRoute = isProductDetailPath(pathname) && !routeError;
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
        <main>{children}</main>
        {!isProductRoute ? (
          <>
            <SearchModal />
            <CartModal cart={cart} />
          </>
        ) : null}
        <AppControllerFooter cart={cart} />
        {consent ? <CookieConsentBanner consent={consent} /> : null}
      </RouteFadeTransition>
    </AsideProvider>
  );
}
