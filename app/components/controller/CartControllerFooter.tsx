import {Suspense} from 'react';
import {useOptimisticCart} from '@shopify/hydrogen';
import {Await, useRouteLoaderData} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {RootLoader} from '~/root';
import {
  ControllerFooter,
  type ControllerFooterAction,
} from './ControllerFooter';

interface CartControllerFooterProps {
  actions: (cartCount: number) => ControllerFooterAction[];
}

/** Wraps ControllerFooter with live cart quantity from the root loader. */
export function CartControllerFooter({actions}: CartControllerFooterProps) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const fallback = <ControllerFooter actions={actions(0)} />;

  if (!rootData) {
    return fallback;
  }

  return (
    <Suspense fallback={fallback}>
      <Await resolve={rootData.cart}>
        {(cart) => <OptimisticControllerFooter actions={actions} cart={cart} />}
      </Await>
    </Suspense>
  );
}

function OptimisticControllerFooter({
  actions,
  cart: originalCart,
}: CartControllerFooterProps & {cart: CartApiQueryFragment | null}) {
  const cart = useOptimisticCart(originalCart);

  return <ControllerFooter actions={actions(cart?.totalQuantity ?? 0)} />;
}
