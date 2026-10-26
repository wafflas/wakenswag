import {useCallback, useEffect, useRef} from 'react';
import {
  Analytics,
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {useNavigate, type BlockerFunction} from 'react-router';
import type {ProductFragment} from 'storefrontapi.generated';
import {PRODUCT_DETAIL_EXIT_MS} from '~/components/animations/constants';
import {FadeTransition} from '~/components/animations/FadeTransition';
import {useRouteExitTransition} from '~/components/animations/useRouteExitTransition';
import {isDefaultTitleOption} from '~/lib/variants';
import {ProductDetail} from './ProductDetail';

interface ProductDetailRouteViewProps {
  product: ProductFragment;
  productUrl: string;
}

export function ProductDetailRouteView({
  product,
  productUrl,
}: ProductDetailRouteViewProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  const shouldFadeOut = useCallback<BlockerFunction>(
    ({currentLocation, nextLocation}) => {
      if (currentLocation.pathname === nextLocation.pathname) {
        return false;
      }

      if (nextLocation.pathname === '/') {
        return false;
      }

      return true;
    },
    [],
  );

  const {isExiting} = useRouteExitTransition(
    shouldFadeOut,
    PRODUCT_DETAIL_EXIT_MS,
  );

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const urlSelectedOptions = selectedVariant.selectedOptions.filter(
    (option) => !isDefaultTitleOption(option),
  );

  useSelectedOptionInUrlParam(urlSelectedOptions);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      void navigate('/merch');
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: selectedVariant?.image?.url
      ? [selectedVariant.image.url]
      : undefined,
    sku: selectedVariant?.sku ?? undefined,
    brand: product.vendor
      ? {
          '@type': 'Brand',
          name: product.vendor,
        }
      : undefined,
    offers: selectedVariant
      ? {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: selectedVariant.price.currencyCode,
          price: selectedVariant.price.amount,
          availability: selectedVariant.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        }
      : undefined,
  };

  const safeStructuredData = JSON.stringify(structuredData).replace(
    /</g,
    '\\u003c',
  );

  return (
    <FadeTransition
      aria-label={product.title}
      aria-modal="true"
      className="fixed inset-0 z-40 overflow-auto"
      isExiting={isExiting}
      key={product.handle}
      ref={modalRef}
      role="dialog"
      tabIndex={-1}
      variant="overlay"
    >
      <ProductDetail
        isClosing={isExiting}
        product={product}
        selectedVariant={selectedVariant}
      />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount ?? '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id ?? '',
              variantTitle: selectedVariant?.title ?? '',
              quantity: 1,
            },
          ],
        }}
      />

      <script
        dangerouslySetInnerHTML={{
          __html: safeStructuredData,
        }}
        type="application/ld+json"
      />
    </FadeTransition>
  );
}
