import {useEffect, useMemo, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {GenieTransition} from '~/components/animations/GenieTransition';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {ps2CtaClassName} from '~/styles/tailwindClassNames';
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

  const descriptionBullets = useMemo(() => {
    const duplicateCounts = new Map<string, number>();
    const bullets = getProductDescriptionBullets({
      description: product.description,
      descriptionHtml: product.descriptionHtml,
    });

    return bullets.map((text) => {
      const occurrence = (duplicateCounts.get(text) ?? 0) + 1;
      duplicateCounts.set(text, occurrence);

      return {
        id: `${text}-${occurrence}`,
        text,
      };
    });
  }, [product.description, product.descriptionHtml]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  const isAvailable = Boolean(selectedVariant?.availableForSale);
  const stockLimit = selectedVariant?.quantityAvailable ?? null;
  const hasReachedStockLimit = stockLimit !== null && quantity >= stockLimit;

  useEffect(() => {
    if (stockLimit === null) return;

    setQuantity((currentQuantity) =>
      Math.max(1, Math.min(currentQuantity, stockLimit)),
    );
  }, [stockLimit]);

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
                {descriptionBullets.map((bullet) => (
                  <li key={bullet.id} className="flex gap-2">
                    <span aria-hidden="true">-</span>
                    <span>{bullet.text}</span>
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
                ps2CtaClassName,
                'cursor-pointer border-0 bg-transparent p-0',
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
                  'ps2-soft-copy text-2xl leading-none lg:text-3xl',
                ].join(' ')}
              >
                {isAvailable ? 'Add to cart' : 'Sold out'}
              </span>
            </AddToCartButton>

            {isAvailable && (
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
                  onClick={() =>
                    setQuantity((currentQuantity) =>
                      stockLimit === null
                        ? currentQuantity + 1
                        : Math.min(currentQuantity + 1, stockLimit),
                    )
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
