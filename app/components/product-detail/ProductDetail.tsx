import {useMemo} from 'react';
import {Image, getProductOptions} from '@shopify/hydrogen';
import {Link, useLocation} from 'react-router';
import type {ProductFragment} from 'storefrontapi.generated';
import {GenieTransition} from '~/components/animations/GenieTransition';
import {ProductPurchaseControls} from './ProductPurchaseControls';
import {
  getProductDescriptionBullets,
  getProductDetailTheme,
} from './productDetailUtils';
import {formatMoney} from '~/lib/money';
import {
  getProductListingPath,
  getProductPath,
  isDefaultTitleOption,
} from '~/lib/variants';

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
  const {pathname} = useLocation();
  const isDrumkit = getProductListingPath(pathname) === '/drumkits';
  const allowQuantitySelection = !isDrumkit;
  const theme = getProductDetailTheme(
    product,
    selectedVariant,
    isDrumkit ? 'black' : undefined,
  );
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  }).filter((option) =>
    option.optionValues.some(
      (value) => !isDefaultTitleOption({name: option.name, value: value.name}),
    ),
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
                <span>{formatMoney(selectedVariant.price)}</span>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
          </div>

          {productOptions.map((option) => (
            <fieldset
              key={option.name}
              className="ps2-soft-copy mt-4 text-lg text-ps2-muted"
            >
              <legend className="text-center">{option.name}</legend>
              <div className="flex flex-wrap justify-center gap-4">
                {option.optionValues.map((value) =>
                  value.exists ? (
                    <Link
                      key={value.name}
                      to={`${getProductPath(value.handle, pathname)}?${value.variantUriQuery}`}
                      aria-current={value.selected ? 'true' : undefined}
                      className={
                        value.selected
                          ? 'text-ps2-white underline underline-offset-4'
                          : 'ps2-cta'
                      }
                      preventScrollReset
                      replace
                    >
                      {value.name}
                      {value.available ? '' : ' (Sold out)'}
                    </Link>
                  ) : (
                    <span
                      key={value.name}
                      aria-disabled="true"
                      className="opacity-30"
                    >
                      {value.name} (Unavailable)
                    </span>
                  ),
                )}
              </div>
            </fieldset>
          ))}

          <ProductPurchaseControls
            allowQuantitySelection={allowQuantitySelection}
            key={selectedVariant?.id ?? product.id}
            selectedVariant={selectedVariant}
          />
        </div>
      </section>
    </div>
  );
}
