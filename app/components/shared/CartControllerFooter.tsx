import {Suspense} from 'react';
import {Await, useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {
  ControllerFooter,
  type ControllerFooterAction,
} from '~/components/shared/ControllerFooter';

interface CartControllerFooterProps {
  actions: (cartCount: number) => ControllerFooterAction[];
}

export function CartControllerFooter({actions}: CartControllerFooterProps) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const fallback = <ControllerFooter actions={actions(0)} />;

  if (!rootData) {
    return fallback;
  }

  return (
    <Suspense fallback={fallback}>
      <Await resolve={rootData.cart}>
        {(cart) => (
          <ControllerFooter actions={actions(cart?.totalQuantity ?? 0)} />
        )}
      </Await>
    </Suspense>
  );
}
