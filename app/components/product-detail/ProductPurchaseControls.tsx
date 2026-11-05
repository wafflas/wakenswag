import {useEffect, useState} from 'react';
import {useRouteLoaderData} from 'react-router';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {RootLoader} from '~/root';
import type {
  CartApiQueryFragment,
  ProductFragment,
} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/cart/AddToCartButton';

export function ProductPurchaseControls({
  selectedVariant,
  allowQuantitySelection = true,
}: {
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  allowQuantitySelection?: boolean;
}) {
  const [requestedQuantity, setQuantity] = useState(1);
  const root = useRouteLoaderData<RootLoader>('root');
  const cartPromise = root?.cart;
  const [resolvedCart, setResolvedCart] = useState<CartApiQueryFragment | null>(
    null,
  );
  const cart = useOptimisticCart(resolvedCart);
  useEffect(() => {
    if (!cartPromise) return;
    let active = true;
    void cartPromise
      .then((cart) => {
        if (active) setResolvedCart(cart);
      })
      .catch(() => {
        if (active) setResolvedCart(null);
      });
    return () => {
      active = false;
    };
  }, [cartPromise]);
  const isInCart =
    !allowQuantitySelection &&
    cart?.lines?.nodes.some(
      (line) => line.merchandise.product.id === selectedVariant?.product.id,
    );
  const stockLimit = selectedVariant?.quantityAvailable ?? null;

  const selectedQuantity = allowQuantitySelection ? requestedQuantity : 1;

  const quantity =
    stockLimit === null
      ? selectedQuantity
      : Math.max(1, Math.min(selectedQuantity, stockLimit));

  const isAvailable = Boolean(selectedVariant?.availableForSale);
  const hasReachedStockLimit = stockLimit !== null && quantity >= stockLimit;
  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <AddToCartButton
        className={[
          'ps2-cta',
          'cursor-pointer border-0 bg-transparent p-0',
        ].join(' ')}
        disabled={!selectedVariant || !isAvailable || isInCart}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity,
                  selectedVariant,
                },
              ]
            : []
        }
      >
        <span
          className={['ps2-soft-copy text-2xl leading-none lg:text-3xl'].join(
            ' ',
          )}
        >
          {isInCart ? 'In cart' : isAvailable ? 'Add to cart' : 'Sold out'}
        </span>
      </AddToCartButton>

      {allowQuantitySelection && isAvailable && (
        <div
          aria-label="Quantity"
          className={[
            'ps2-soft-copy flex items-center gap-2',
            'text-2xl leading-none text-ps2-muted lg:text-3xl',
          ].join(' ')}
          role="group"
        >
          <button
            aria-label="Decrease quantity"
            className={[
              'inline-flex size-11 items-center justify-center opacity-80',
              'cursor-pointer border-0 bg-transparent p-0 text-4xl leading-none text-ps2-muted',
              'transition-[color,opacity,text-shadow] duration-[180ms] ease-ps2',
              'enabled:hover:text-ps2-white enabled:hover:opacity-100 enabled:hover:[text-shadow:0_0_7px_rgba(245,245,245,0.28)]',
              'focus-visible:text-ps2-white focus-visible:opacity-100 focus-visible:[text-shadow:0_0_7px_rgba(245,245,245,0.28)]',
              'lg:size-12 lg:text-5xl',
              'disabled:cursor-not-allowed disabled:opacity-10 disabled:[text-shadow:none]',
            ].join(' ')}
            disabled={quantity === 1}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            type="button"
          >
            −
          </button>

          <output aria-live="polite" className="min-w-[1ch]">
            {quantity}
          </output>

          <button
            aria-label={
              stockLimit === null
                ? 'Increase quantity'
                : `Increase quantity (maximum ${stockLimit})`
            }
            className={[
              'inline-flex size-11 items-center justify-center opacity-80',
              'cursor-pointer border-0 bg-transparent p-0 text-4xl leading-none text-ps2-muted',
              'transition-[color,opacity,text-shadow] duration-[180ms] ease-ps2',
              'enabled:hover:text-ps2-white enabled:hover:opacity-100 enabled:hover:[text-shadow:0_0_7px_rgba(245,245,245,0.28)]',
              'focus-visible:text-ps2-white focus-visible:opacity-100 focus-visible:[text-shadow:0_0_7px_rgba(245,245,245,0.28)]',
              'lg:size-12 lg:text-5xl',
              'disabled:cursor-not-allowed disabled:opacity-10 disabled:[text-shadow:none]',
            ].join(' ')}
            disabled={hasReachedStockLimit}
            onClick={() => setQuantity(quantity + 1)}
            type="button"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
