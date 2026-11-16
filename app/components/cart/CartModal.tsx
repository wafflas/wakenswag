import {Suspense} from 'react';
import {Await} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/layout/Aside';
import {CartMain} from './CartMain';
import {StorefrontDialog} from '~/components/layout/StorefrontDialog';

interface CartModalProps {
  cart: Promise<CartApiQueryFragment | null>;
}

/**
 * Displays the existing Shopify cart inside a full-screen dialog.
 */
export function CartModal({cart}: CartModalProps) {
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
          resolve={cart}
          errorElement={
            <p
              role="alert"
              className="grid h-dvh place-items-center text-xl text-ps2-gray"
            >
              Could not load your cart. Close it and try again.
            </p>
          }
        >
          {(resolvedCart) => <CartMain cart={resolvedCart} />}
        </Await>
      </Suspense>
    </StorefrontDialog>
  );
}
