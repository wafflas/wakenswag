import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {CartLineItem} from '~/components/cart/CartLineItem';
import {CartSummary} from './CartSummary';
import {CartEmpty} from './CartEmpty';
import {CartEmptyButton} from './CartEmptyButton';
import {getLineItemChildrenMap, type CartLayout} from './cartUtils';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

/**
 * The main cart component that displays the cart items and summary.
 * It is rendered inside the cart modal and uses optimistic Shopify updates.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const lines = cart?.lines?.nodes ?? [];
  const parentLines = lines.filter(
    (line) =>
      !('parentRelationship' in line && line.parentRelationship?.parent),
  );
  const linesCount = parentLines.length;
  const cartHasItems = (cart?.totalQuantity ?? 0) > 0;
  const childrenMap = getLineItemChildrenMap(lines);

  return (
    <section
      aria-labelledby="cart-information-title"
      className={[
        'relative flex h-dvh w-full flex-col overflow-hidden px-3',
        'pb-16 sm:pb-18 md:pb-20',
      ].join(' ')}
    >
      <h2
        id="cart-information-title"
        className="ps2-soft-copy shrink-0 pt-20 text-center text-3xl leading-none tracking-wide text-ps2-yellow sm:pt-24 sm:text-4xl"
      >
        Cart Information
      </h2>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-6 sm:gap-8 sm:py-8">
        <CartEmpty hidden={linesCount > 0} layout={layout} />

        <div
          className="flex min-h-0 w-full max-w-2xl flex-1 flex-col items-center gap-4 sm:gap-6"
          hidden={linesCount === 0}
        >
          <div className="flex w-full shrink-0 justify-end">
            <CartEmptyButton
              lineIds={lines.map((line) => line.id)}
              disabled={!!cart?.isOptimistic}
            />
          </div>

          <p id="cart-lines" className="sr-only">
            Cart items
          </p>
          <ul
            aria-labelledby="cart-lines"
            className={[
              'cart-scroll',
              'grid min-h-0 w-full flex-1 grid-cols-2 items-start',
              'gap-x-4 gap-y-4 overflow-y-auto overscroll-contain',
              'rounded-md border border-ps2-gray/20 p-3',
              'sm:grid-cols-2',
            ].join(' ')}
          >
            {parentLines.map((line) => (
              <CartLineItem
                key={line.id}
                line={line}
                layout={layout}
                childrenMap={childrenMap}
              />
            ))}
          </ul>

          {cartHasItems ? <CartSummary cart={cart} layout={layout} /> : null}
        </div>
      </div>
    </section>
  );
}
