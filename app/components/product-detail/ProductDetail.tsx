import {useEffect, useMemo, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {GenieTransition} from '~/components/animations/GenieTransition';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {getProductDescriptionBullets} from '~/components/product-detail/productDescription';
import {getProductDetailTheme} from './productTheme';

const euroAmountFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface ProductDetailProps {
  isClosing?: boolean;
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}

export function ProductDetail({
  isClosing = false,
  product,
  selectedVariant,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);

  const theme = useMemo(
    () => getProductDetailTheme(product, selectedVariant),
    [product, selectedVariant],
  );

  const descriptionBullets = useMemo(
    () =>
      getProductDescriptionBullets({
        description: product.description,
        descriptionHtml: product.descriptionHtml,
      }),
    [product.description, product.descriptionHtml],
  );

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  const isAvailable = Boolean(selectedVariant?.availableForSale);

  return (
    <div
      className={[
        'relative isolate min-h-dvh overflow-hidden',
        'font-ps2 text-ps2-white',
      ].join(' ')}
      data-product-theme={theme.key}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-90"
        style={{
          backgroundImage: theme.gradient,
        }}
      />

      <section
        className={[
          'relative z-10 mx-auto grid min-h-dvh w-full max-w-7xl',
          'grid-cols-1 content-center items-center justify-items-center',
          'gap-8 px-6 pb-24 pt-12',
          'lg:grid-cols-2 lg:gap-0 lg:px-20 lg:pb-28 lg:pt-20',
        ].join(' ')}
      >
        <GenieTransition
          className="flex w-full items-center justify-center"
          isExiting={isClosing}
        >
          {selectedVariant?.image ? (
            <Image
              alt={
                selectedVariant.image.altText ??
                `${product.title} product image`
              }
              className="size-52 max-w-none object-contain lg:size-72"
              data={selectedVariant.image}
              key={selectedVariant.image.id}
              loading="eager"
              sizes="(min-width: 1024px) 288px, 208px"
            />
          ) : (
            <div aria-hidden="true" className="size-52 lg:size-72" />
          )}
        </GenieTransition>

        <div
          className={[
            'flex w-full max-w-xl flex-col items-center text-center',
            'lg:min-h-72 lg:justify-center',
          ].join(' ')}
        >
          <div className="ps2-soft-copy">
            <h1
              className={[
                'text-3xl leading-tight tracking-wide',
                'text-ps2-yellow text-ps2-outline lg:text-4xl',
              ].join(' ')}
            >
              {product.title}
            </h1>

            {descriptionBullets.length > 0 ? (
              <ul className="mt-1 flex flex-col items-center text-xl leading-snug text-ps2-muted lg:text-2xl">
                {descriptionBullets.map((line, index) => (
                  <li key={`${index}-${line}`} className="flex gap-2">
                    <span aria-hidden="true">-</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 text-xl leading-8 text-ps2-muted">
              {selectedVariant?.price ? (
                <span>
                  {euroAmountFormatter.format(
                    Number(selectedVariant.price.amount),
                  )}{' '}
                  EURO
                </span>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <AddToCartButton
              className={[
                'cursor-pointer border-0 bg-transparent p-0',
                'disabled:cursor-not-allowed',
              ].join(' ')}
              disabled={!selectedVariant || !isAvailable}
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
                className={[
                  'ps2-soft-copy text-2xl leading-none text-ps2-cyan/80',
                  'transition-opacity hover:text-ps2-cyan hover:opacity-100',
                  'lg:text-3xl',
                ].join(' ')}
              >
                {isAvailable ? 'Add to cart' : 'Sold out'}
              </span>
            </AddToCartButton>

            {isAvailable && (
              <div
                aria-label="Quantity"
                className={[
                  'ps2-soft-copy flex items-center gap-4',
                  'text-2xl leading-none text-ps2-gray/80 lg:text-3xl',
                ].join(' ')}
                role="group"
              >
                <button
                  aria-label="Decrease quantity"
                  className={[
                    'cursor-pointer border-0 bg-transparent p-0',
                    'disabled:cursor-not-allowed disabled:opacity-30',
                  ].join(' ')}
                  disabled={quantity === 1}
                  onClick={() =>
                    setQuantity((currentQuantity) =>
                      Math.max(1, currentQuantity - 1),
                    )
                  }
                  type="button"
                >
                  −
                </button>

                <output aria-live="polite" className="min-w-[1ch]">
                  {quantity}
                </output>

                <button
                  aria-label="Increase quantity"
                  className="cursor-pointer border-0 bg-transparent p-0"
                  onClick={() =>
                    setQuantity((currentQuantity) => currentQuantity + 1)
                  }
                  type="button"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
