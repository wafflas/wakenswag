import {useCallback} from 'react';
import {useLocation, useNavigate, type NavigateFunction} from 'react-router';
import {CartControllerFooter} from './CartControllerFooter';
import type {ControllerFooterAction} from './ControllerFooter';
import {useAside} from '~/components/layout/Aside';

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

  if (
    pathname === '/merch' ||
    pathname === '/merch/' ||
    pathname === '/drumkits' ||
    pathname === '/drumkits/' ||
    pathname === '/socials' ||
    pathname === '/socials/' ||
    pathname === '/info' ||
    pathname === '/info/'
  ) {
    return {back: 'home'};
  }

  // A fixed parent route also works when a product URL is opened directly.
  if (/^\/merch\/[^/]+\/?$/.test(pathname)) {
    return {back: '/merch'};
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
  const {close, open, type} = useAside();
  const config = getControllerFooterConfig(location.pathname);

  const getActions = useCallback(
    (cartCount: number): ControllerFooterAction[] => {
      if (type === 'cart' || type === 'search') {
        return [
          {
            label: 'Back',
            onActivate: close,
            position: 'start',
            symbol: 'circle',
          },
        ];
      }

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
          onActivate: () => open('search'),
          position: 'end',
          symbol: 'triangle',
        });
      }

      if (config.showCart !== false) {
        actions.push({
          count: cartCount,
          label: 'Cart',
          onActivate: () => open('cart'),
          position: 'end',
          symbol: 'square',
        });
      }

      return actions;
    },
    [
      close,
      config.back,
      config.showCart,
      config.showSearch,
      navigate,
      open,
      type,
    ],
  );

  return <CartControllerFooter actions={getActions} />;
}
