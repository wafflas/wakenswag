import {Suspense, useEffect, useRef} from 'react';
import {Await} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/layout/Aside';
import {CartMain} from './CartMain';

interface CartModalProps {
  cart: Promise<CartApiQueryFragment | null>;
}

/**
 * Displays the existing Shopify cart inside a full-screen dialog.
 */
export function CartModal({cart}: CartModalProps) {
  const {close, type} = useAside();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = type === 'cart';

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [close, isOpen]);

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
        <Await resolve={cart}>
          {(resolvedCart) => <CartMain cart={resolvedCart} layout="aside" />}
        </Await>
      </Suspense>
    </div>
  );
}
