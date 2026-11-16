import {useCallback} from 'react';
import {
  Analytics,
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {useLocation, useNavigate, useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {CartModal} from '~/components/cart/CartModal';
import {SearchModal} from '~/components/search/SearchModal';
import {useAside} from '~/components/layout/Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import {useProductExitTransition} from '~/components/animations/RouteFadeTransition';
import {getProductListingPath, isDefaultTitleOption} from '~/lib/variants';
import {ProductDetail} from './ProductDetail';
import {StorefrontDialog} from '~/components/layout/StorefrontDialog';

interface ProductDetailRouteViewProps {
  product: ProductFragment;
  productUrl: string;
}

export function ProductDetailRouteView({
  product,
  productUrl,
}: ProductDetailRouteViewProps) {
  const navigate = useNavigate();
  const root = useRouteLoaderData<RootLoader>('root');
  const {type} = useAside();
  const {pathname} = useLocation();
  const listingPath = getProductListingPath(pathname);
  const closeProduct = useCallback(() => {
    void navigate(listingPath);
  }, [listingPath, navigate]);

  const isExiting = useProductExitTransition();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const urlSelectedOptions = (selectedVariant?.selectedOptions ?? []).filter(
    (option) => !isDefaultTitleOption(option),
  );

  useSelectedOptionInUrlParam(urlSelectedOptions);

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
    <StorefrontDialog
      title={product.title}
      onClose={closeProduct}
      isActive={type === 'closed'}
      className="fixed inset-0 z-40 overflow-auto"
      isExiting={isExiting}
      key={product.handle}
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
      <SearchModal />
      {root ? <CartModal cart={root.cart} /> : null}
    </StorefrontDialog>
  );
}
