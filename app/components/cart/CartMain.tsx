import {useCart, useSuspenseCart} from '~/lib/cart';
import {Link, useLocation} from 'react-router';
import {CartLineItem} from '~/components/cart/CartLineItem';
import {CartSummary} from './CartSummary';
import {CartEmpty} from './CartEmpty';
import {CartEmptyButton} from './CartEmptyButton';
import {getLineItemChildrenMap} from './cartUtils';

export function CartMain({
  initialLoadFailed = false,
}: {
  initialLoadFailed?: boolean;
}) {
  const {pathname, search} = useLocation();
  const cart = useSuspenseCart((state) => state.data);
  const pending = useCart((state) => state.pending.cost || state.revalidating);

  const lines = cart?.lines?.nodes ?? [];
  const parentLines = lines.filter(
    (line) =>
      !('parentRelationship' in line && line.parentRelationship?.parent),
  );
  const linesCount = parentLines.length;
  const cartHasItems = (cart?.totalQuantity ?? 0) > 0;
  const hasLoadError = initialLoadFailed && !cart.id;
  const childrenMap = getLineItemChildrenMap(lines);

  return (
    <section
      aria-labelledby="cart-information-title"
      className={[
        'cart-main',
        'relative flex h-dvh w-full flex-col overflow-hidden px-3',
        'pb-16 sm:pb-18 md:pb-20',
      ].join(' ')}
    >
      <h2
        id="cart-information-title"
        className={[
          'cart-main-title ps2-soft-copy shrink-0 pt-20 text-center',
          'text-3xl leading-none tracking-wide text-ps2-yellow',
          'sm:pt-24 sm:text-4xl',
        ].join(' ')}
      >
        Cart Information
      </h2>

      <div
        className={[
          'cart-main-body flex min-h-0 flex-1 flex-col items-center',
          'gap-6 py-6 sm:gap-8 sm:py-8',
          linesCount === 0 ? 'justify-center' : 'justify-start',
        ].join(' ')}
      >
        {hasLoadError ? (
          <div className="ps2-soft-copy flex flex-col items-center gap-4 text-center text-lg text-ps2-muted">
            <p role="alert">Could not load your cart. Please try again.</p>
            <Link className="ps2-cta" reloadDocument to={pathname + search}>
              Reload page
            </Link>
          </div>
        ) : null}
        <CartEmpty hidden={linesCount > 0 || hasLoadError} />

        <div
          className="flex min-h-0 w-full max-w-2xl flex-1 flex-col items-center gap-3 sm:gap-6"
          hidden={linesCount === 0}
        >
          <div className="flex w-full shrink-0 justify-end">
            <CartEmptyButton
              lineIds={lines.map((line) => line.id)}
              disabled={Boolean(pending)}
            />
          </div>

          <p id="cart-lines" className="sr-only">
            Cart items
          </p>
          <ul
            aria-labelledby="cart-lines"
            className={[
              'cart-scroll cart-main-grid',
              'grid min-h-0 w-full flex-1 grid-cols-2 items-start',
              'gap-x-4 gap-y-4 overflow-y-auto overscroll-contain',
              'rounded-md border border-ps2-gray/20 p-3 sm:grid-cols-2',
            ].join(' ')}
          >
            {parentLines.map((line) => (
              <CartLineItem
                key={line.id}
                line={line}
                childrenMap={childrenMap}
              />
            ))}
          </ul>

          {cartHasItems ? (
            <div className="cart-main-summary shrink-0">
              <CartSummary cart={cart} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
