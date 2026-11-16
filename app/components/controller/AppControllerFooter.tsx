import {useEffect, useState} from 'react';
import {useLocation, useRouteError, useRouteLoaderData} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {RootLoader} from '~/root';
import {useAside} from '~/components/layout/Aside';
import {isProductDetailPath} from '~/lib/variants';
import {ControllerFooter} from './ControllerFooter';

interface AppControllerFooterProps {
  cart?: Promise<CartApiQueryFragment | null>;
  inDialog?: boolean;
}

const EMPTY_CART = Promise.resolve(null);

/** Lets a remounted dialog footer reuse a cart the page footer already resolved. */
const resolvedCarts = new WeakMap<
  Promise<CartApiQueryFragment | null>,
  {cart: CartApiQueryFragment | null}
>();

function readCachedCart(promise: Promise<CartApiQueryFragment | null>) {
  const cached = resolvedCarts.get(promise);
  return cached ? {promise, cart: cached.cart} : undefined;
}

/**
 * Shows controls inside the active dialog, or on an ordinary page.
 * Resolves streamed cart data without replacing the focused controls or
 * introducing a hydrating Suspense boundary inside Radix's focus scope.
 */
export function AppControllerFooter({
  cart,
  inDialog = false,
}: AppControllerFooterProps) {
  const root = useRouteLoaderData<RootLoader>('root');
  const {pathname} = useLocation();
  const routeError = useRouteError();
  const {type, inputMode} = useAside();
  const isProductPage = isProductDetailPath(pathname) && !routeError;
  const isPageSlot = !inDialog && !isProductPage;
  const isSuppressed = isPageSlot && type !== 'closed';
  const cartPromise = cart ?? root?.cart ?? EMPTY_CART;
  const [cartSnapshot, setCartSnapshot] = useState(() =>
    readCachedCart(cartPromise),
  );

  useEffect(() => {
    const cached = readCachedCart(cartPromise);
    if (cached) {
      setCartSnapshot(cached);
      return;
    }

    let active = true;
    void cartPromise
      .then((cart) => {
        resolvedCarts.set(cartPromise, {cart});
        if (active) setCartSnapshot({promise: cartPromise, cart});
      })
      .catch(() => {
        resolvedCarts.set(cartPromise, {cart: null});
        if (active) setCartSnapshot({promise: cartPromise, cart: null});
      });
    return () => {
      active = false;
    };
  }, [cartPromise]);

  if (!inDialog && isProductPage) return null;

  return (
    <footer
      aria-hidden={isSuppressed ? true : undefined}
      data-modal-controls
      data-input-mode={inputMode}
      {...(isSuppressed ? {inert: ''} : {})}
      className={[
        'fixed inset-x-0 bottom-0 z-50',
        'px-2 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-5',
        isSuppressed ? 'invisible pointer-events-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ControllerFooter
        cart={cartSnapshot?.cart}
        isCartReady={cartSnapshot?.promise === cartPromise}
      />
    </footer>
  );
}
