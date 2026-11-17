import {Suspense} from 'react';
import {Await, useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {useAside} from '~/components/layout/Aside';
import {CartMain} from './CartMain';
import {StorefrontDialog} from '~/components/layout/StorefrontDialog';

export function CartModal() {
  const root = useRouteLoaderData<RootLoader>('root');
  const {close, isExiting, type, openerRef} = useAside();
  const isOpen = type === 'cart';

  if (!isOpen) return null;

  return (
    <StorefrontDialog
      title="Shopping cart"
      onClose={close}
      openerRef={openerRef}
      className={[
        'fixed inset-0 z-40',
        'h-dvh overflow-hidden bg-[rgba(6,6,6,0.95)]',
        'font-ps2 text-ps2-muted',
      ].join(' ')}
      isExiting={isExiting}
    >
      <Suspense
        fallback={
          <div className="grid h-dvh place-items-center text-xl text-ps2-gray">
            Loading cart…
          </div>
        }
      >
        <Await
          resolve={root?.cart}
          errorElement={<CartMain initialLoadFailed />}
        >
          {(result) => (
            <CartMain initialLoadFailed={Boolean(result?.errors?.length)} />
          )}
        </Await>
      </Suspense>
    </StorefrontDialog>
  );
}
