import {useLocation} from 'react-router';
import {getProductListingPath} from '~/lib/variants';
import {ProductItem} from '~/components/product-listing/ProductItem';
import {ProductListingPagination} from '~/components/product-listing/ProductListingPagination';
import {useProductListingLoading} from '~/components/product-listing/ProductListingShell';
import {
  PRODUCTS_PER_PAGE,
  PRODUCT_LISTING_STAGGER_MS,
  type ProductListingConnection,
} from './productListingUtils';

interface ProductGridProps {
  connection: ProductListingConnection;
  selectedProductId?: string;
  onSelect: (productId: string, title: string) => void;
}

export function ProductGrid({
  connection,
  selectedProductId,
  onSelect,
}: ProductGridProps) {
  const {pathname} = useLocation();
  const isDrumkits = getProductListingPath(pathname) === '/drumkits';
  const productGridHorizontalPaddingClassName = isDrumkits
    ? 'px-4 sm:px-8 lg:px-20 2xl:px-40'
    : 'px-4 sm:px-10 lg:px-30 2xl:px-60';
  const restartLoading = useProductListingLoading();

  return (
    <ProductListingPagination
      connection={connection}
      containerClassName={[
        'grid h-full min-h-0',
        isDrumkits
          ? 'ps2-drumkit-pagination grid-rows-[minmax(0,1fr)_3rem] lg:grid-rows-[minmax(0,1fr)_3.5rem]'
          : 'grid-rows-[minmax(0,1fr)_3.5rem] lg:grid-rows-[minmax(0,1fr)_4.5rem]',
        'pb-16 sm:pb-18 md:pb-20',
      ].join(' ')}
      onPageChange={({firstNode, nodeCount, shouldAnimate}) => {
        if (firstNode) onSelect(firstNode.id, firstNode.title);
        if (shouldAnimate) restartLoading(nodeCount);
      }}
      paginationClassName={`flex w-full items-center justify-between gap-6 ${productGridHorizontalPaddingClassName}`}
      resourcesClassName={[
        'grid h-full min-h-0 items-center',
        isDrumkits
          ? 'ps2-drumkit-grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-2 overflow-hidden py-2 max-lg:[&>:nth-child(n+5)]:hidden lg:grid-cols-6 lg:grid-rows-1 lg:py-3'
          : [
              'grid-cols-3 gap-x-4 lg:grid-cols-4 lg:gap-x-0',
              'grid-rows-4 content-center gap-y-[clamp(0.75rem,3dvh,3.5rem)] overflow-visible py-4',
              'sm:gap-y-[clamp(1rem,3.5dvh,4rem)] sm:py-6',
              'lg:grid-rows-3 lg:overflow-hidden lg:gap-y-[clamp(0.75rem,2dvh,2rem)] lg:py-2',
            ].join(' '),
        productGridHorizontalPaddingClassName,
      ].join(' ')}
    >
      {({node: product, index, shouldAnimate}) => (
        <ProductItem
          key={product.id}
          animationDelayMs={index * PRODUCT_LISTING_STAGGER_MS}
          isSelected={selectedProductId === product.id}
          loading={index < PRODUCTS_PER_PAGE ? 'eager' : undefined}
          onSelect={onSelect}
          product={product}
          shouldAnimate={shouldAnimate}
        />
      )}
    </ProductListingPagination>
  );
}
