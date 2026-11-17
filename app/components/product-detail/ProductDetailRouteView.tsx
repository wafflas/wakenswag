import {useCallback} from 'react';
import {ProductProvider} from '~/lib/product';
import {useLocation, useNavigate} from 'react-router';
import {CartModal} from '~/components/cart/CartModal';
import {SearchModal} from '~/components/search/SearchModal';
import {useAside} from '~/components/layout/Aside';
import type {ProductFragment} from '~/lib/productDetail';
import {useProductExitTransition} from '~/components/animations/RouteFadeTransition';
import {getProductListingPath, getVariantUrl} from '~/lib/variants';
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
  const {type} = useAside();
  const {pathname, search} = useLocation();
  const listingPath = getProductListingPath(pathname);
  const closeProduct = useCallback(() => {
    void navigate(listingPath);
  }, [listingPath, navigate]);

  const isExiting = useProductExitTransition();

  const selectedVariant = product.selectedOrFirstAvailableVariant;

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
    <ProductProvider
      product={product}
      onSelect={(result) => {
        void navigate(
          getVariantUrl({
            handle: result.selectedVariant?.product.handle ?? product.handle,
            pathname,
            searchParams: new URLSearchParams(search),
            selectedOptions: result.selectedOptions,
          }),
          {replace: true, preventScrollReset: true},
        );
      }}
    >
      <StorefrontDialog
        title={product.title}
        onClose={closeProduct}
        isActive={type === 'closed'}
        className="fixed inset-0 z-40 overflow-auto"
        isExiting={isExiting}
        key={product.handle}
      >
        <ProductDetail isClosing={isExiting} product={product} />

        <script
          dangerouslySetInnerHTML={{
            __html: safeStructuredData,
          }}
          type="application/ld+json"
        />
        <SearchModal />
        <CartModal />
      </StorefrontDialog>
    </ProductProvider>
  );
}
