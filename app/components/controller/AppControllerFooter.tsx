import {useCallback} from 'react';
import {
  useLocation,
  useNavigate,
  type NavigateFunction,
} from 'react-router';
import {CartControllerFooter} from './CartControllerFooter';
import type {ControllerFooterAction} from './ControllerFooter';

/** `'home'` → `/`; `'history'` → `-1`; any other string → that path. */
export type ControllerBackTarget = 'home' | 'history' | (string & {});

export interface ControllerFooterConfig {
  /** Omit to hide the Back action (e.g. homepage). */
  back?: ControllerBackTarget;
  showSearch?: boolean;
  showCart?: boolean;
}

/**
 * Route-driven controller HUD config.
 * Defaults: search + cart on; back only when `back` is set.
 */
export function getControllerFooterConfig(
  pathname: string,
): ControllerFooterConfig {
  if (pathname === '/') {
    return {
      showSearch: true,
      showCart: true,
    };
  }

  if (pathname === '/merch' || pathname === '/merch/') {
    return {back: 'home'};
  }

  if (/^\/merch\/[^/]+\/?$/.test(pathname)) {
    return {back: '/merch'};
  }

  if (pathname === '/search' || pathname.startsWith('/search/')) {
    return {back: 'history', showSearch: false};
  }

  if (pathname === '/cart' || pathname.startsWith('/cart/')) {
    return {back: 'history', showCart: false};
  }

  if (pathname.startsWith('/collections')) {
    return {back: 'home'};
  }

  // 404 and other screens — Back returns to the main menu.
  return {back: 'home'};
}

export function resolveControllerBack(
  back: ControllerBackTarget,
  navigate: NavigateFunction,
) {
  if (back === 'home') {
    void navigate('/');
    return;
  }

  if (back === 'history') {
    void navigate(-1);
    return;
  }

  void navigate(back);
}

/**
 * Persistent controller HUD — mounted once in PageLayout (and NotFound).
 * Actions come from route config so Back can mean home, a parent path, or -1.
 */
export function AppControllerFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = getControllerFooterConfig(location.pathname);

  const getActions = useCallback(
    (cartCount: number): ControllerFooterAction[] => {
      const actions: ControllerFooterAction[] = [];

      if (config.back) {
        const backTarget = config.back;
        actions.push({
          label: 'Back',
          onActivate: () => resolveControllerBack(backTarget, navigate),
          position: 'start',
          symbol: 'circle',
        });
      }

      if (config.showSearch !== false) {
        actions.push({
          label: 'Search',
          onActivate: () => void navigate('/search'),
          position: 'end',
          symbol: 'triangle',
        });
      }

      if (config.showCart !== false) {
        actions.push({
          count: cartCount,
          label: 'Cart',
          onActivate: () => void navigate('/cart'),
          position: 'end',
          symbol: 'square',
        });
      }

      return actions;
    },
    [config.back, config.showCart, config.showSearch, navigate],
  );

  return <CartControllerFooter actions={getActions} />;
}
