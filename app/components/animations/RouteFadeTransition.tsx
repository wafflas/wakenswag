import {createContext, useCallback, useContext, type ReactNode} from 'react';
import {useLocation, type BlockerFunction} from 'react-router';
import {PRODUCT_DETAIL_EXIT_MS, ROUTE_FADE_DURATION_MS} from './animationUtils';
import {FadeTransition} from './FadeTransition';
import {useRouteExitTransition} from './useRouteExitTransition';

const ProductExitContext = createContext(false);

export function useProductExitTransition() {
  return useContext(ProductExitContext);
}

interface RouteFadeTransitionProps {
  children: ReactNode;
  shouldTransition: BlockerFunction;
  duration?: number;
}

/**
 * Fades route content out before selected navigations and back in after the
 * destination has rendered. The route predicate keeps the effect opt-in.
 */
export function RouteFadeTransition({
  children,
  shouldTransition,
  duration = ROUTE_FADE_DURATION_MS,
}: RouteFadeTransitionProps) {
  const {pathname} = useLocation();
  const isProductRoute = /^\/merch\/[^/]+\/?$/.test(pathname);
  const shouldBlock = useCallback<BlockerFunction>(
    (args) =>
      shouldTransition(args) ||
      (/^\/merch\/[^/]+\/?$/.test(args.currentLocation.pathname) &&
        args.currentLocation.pathname !== args.nextLocation.pathname),
    [shouldTransition],
  );
  // React Router supports one blocker. Both visual effects share this owner.
  const {isBusy, isExiting, nextPathname} = useRouteExitTransition(
    shouldBlock,
    (next) =>
      isProductRoute && next !== '/' ? PRODUCT_DETAIL_EXIT_MS : duration,
  );
  const isProductExiting = isExiting && isProductRoute && nextPathname !== '/';

  return (
    <ProductExitContext.Provider value={isProductExiting}>
      <FadeTransition
        aria-busy={isBusy}
        isExiting={isExiting && !isProductExiting}
        variant="route"
      >
        {children}
      </FadeTransition>
    </ProductExitContext.Provider>
  );
}
