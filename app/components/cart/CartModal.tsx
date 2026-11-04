import {Suspense, useRef} from 'react';
import {Await} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/layout/Aside';
import {CartMain} from './CartMain';
import {useModalDialog} from '~/components/layout/useModalDialog';

interface CartModalProps {
  cart: Promise<CartApiQueryFragment | null>;
}

/**
 * Displays the existing Shopify cart inside a full-screen dialog.
 */
export function CartModal({cart}: CartModalProps) {
  const {close, type, openerRef} = useAside();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = type === 'cart';

  useModalDialog({dialogRef, isOpen, onClose: close, openerRef});

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      aria-label="Shopping cart"
      aria-modal="true"
      className={[
        'fixed inset-0 z-40',
        'h-dvh overflow-hidden bg-[rgba(6,6,6,0.95)]',
        'font-ps2 text-ps2-muted',
      ].join(' ')}
      role="dialog"
      tabIndex={-1}
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
          {(resolvedCart) => <CartMain cart={resolvedCart} layout="aside" />}
        </Await>
      </Suspense>
    </div>
  );
}
