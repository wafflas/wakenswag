import type {MerchQuery, ProductItemFragment} from 'storefrontapi.generated';

export const PRODUCT_LISTING_STAGGER_MS = 400;
export const PRODUCTS_PER_PAGE = 12;

export interface ProductListingPageChangeEvent {
  firstNode: ProductItemFragment | undefined;
  nodeCount: number;
  shouldAnimate: boolean;
}

export type ProductListingConnection = MerchQuery['products'];

export function getProductListingPageUrl({
  pathname,
  search,
  direction,
  cursor,
}: {
  pathname: string;
  search: string;
  direction: 'previous' | 'next';
  cursor: string;
}) {
  const params = new URLSearchParams(search);
  params.set('direction', direction);
  params.set('cursor', cursor);
  return `${pathname}?${params}`;
}
