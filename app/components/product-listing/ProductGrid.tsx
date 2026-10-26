import type {ComponentProps} from 'react';
import {ProductItem} from '~/components/product-listing/ProductItem';
import {ProductListingPagination} from '~/components/product-listing/ProductListingPagination';
import {useProductListingLoading} from '~/components/product-listing/ProductListingShell';
import {
  PRODUCTS_PER_PAGE,
  PRODUCT_LISTING_STAGGER_MS,
} from '~/components/product-listing/useProductListingSelection';

type ProductConnection = ComponentProps<
  typeof ProductListingPagination
>['connection'];

const productGridHorizontalPaddingClassName =
  'px-4 sm:px-10 lg:px-30 2xl:px-60';

interface ProductGridProps {
  connection: ProductConnection;
  selectedProductId?: string;
  onSelect: (productId: string, title: string) => void;
}

export function ProductGrid({
  connection,
  selectedProductId,
  onSelect,
}: ProductGridProps) {
  const restartLoading = useProductListingLoading();

  return (
    <ProductListingPagination
      connection={connection}
      containerClassName={[
        'grid h-full min-h-0 grid-rows-[minmax(0,1fr)_3.5rem] lg:grid-rows-[minmax(0,1fr)_4.5rem]',
        'pb-16 sm:pb-18 md:pb-20',
      ].join(' ')}
      onPageChange={({firstNode, nodeCount, shouldAnimate}) => {
        if (firstNode) onSelect(firstNode.id, firstNode.title);
        if (shouldAnimate) restartLoading(nodeCount);
      }}
      pageSize={PRODUCTS_PER_PAGE}
      paginationClassName={`flex w-full items-center justify-between gap-6 ${productGridHorizontalPaddingClassName}`}
      resourcesClassName={[
        'grid h-full min-h-0 grid-cols-3 grid-rows-4 content-center items-center',
        'gap-x-4 gap-y-[clamp(0.75rem,3dvh,3.5rem)] overflow-visible py-4',
        'sm:gap-y-[clamp(1rem,3.5dvh,4rem)] sm:py-6',
        'lg:grid-cols-4 lg:grid-rows-3 lg:gap-x-0 lg:overflow-hidden',
        'lg:gap-y-[clamp(0.75rem,2dvh,2rem)] lg:py-2',
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
