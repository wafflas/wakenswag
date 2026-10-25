import type {ComponentProps} from 'react';
import {PaginatedResourceSection} from '~/components/shared/PaginatedResourceSection';
import {ProductItem} from '~/components/product-listing/ProductItem';
import {PRODUCT_LISTING_STAGGER_MS} from '~/components/product-listing/useProductListingSelection';
import type {ProductItemFragment} from 'storefrontapi.generated';

type ProductConnection = ComponentProps<
  typeof PaginatedResourceSection<ProductItemFragment>
>['connection'];

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
  return (
    <PaginatedResourceSection<ProductItemFragment>
      connection={connection}
      resourcesClassName={[
        'grid h-auto grid-cols-3 gap-x-4 gap-y-20 overflow-visible px-4 pb-24',
        'sm:px-10 lg:grid-cols-4 lg:gap-x-0 lg:px-30 2xl:px-60',
      ].join(' ')}
    >
      {({node: product, index}) => (
        <ProductItem
          key={product.id}
          animationDelayMs={index * PRODUCT_LISTING_STAGGER_MS}
          isSelected={selectedProductId === product.id}
          loading={index < 8 ? 'eager' : undefined}
          onSelect={onSelect}
          product={product}
        />
      )}
    </PaginatedResourceSection>
  );
}
