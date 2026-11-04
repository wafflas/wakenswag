import {Suspense} from 'react';
import {Await} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {ControllerFooter} from './ControllerFooter';

interface AppControllerFooterProps {
  cart: Promise<CartApiQueryFragment | null>;
}

/**
 * Resolves streamed cart data while keeping the controls available.
 * The outer footer stays mounted so dialog focus handling can track it.
 */
export function AppControllerFooter({cart}: AppControllerFooterProps) {
  const fallback = <ControllerFooter cart={null} />;

  return (
    <footer
      data-modal-controls
      className={[
        'fixed inset-x-0 bottom-0 z-50',
        'px-2 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-5',
      ].join(' ')}
    >
      <Suspense fallback={fallback}>
        <Await resolve={cart} errorElement={fallback}>
          {(resolvedCart) => <ControllerFooter cart={resolvedCart} />}
        </Await>
      </Suspense>
    </footer>
  );
}
