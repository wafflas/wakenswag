import type {MerchQuery, ProductItemFragment} from 'storefrontapi.generated';

export const PRODUCT_LISTING_STAGGER_MS = 400;
export const PRODUCTS_PER_PAGE = 12;
export const DRUMKITS_PER_PAGE = 6;
export const MOBILE_DRUMKITS_PER_PAGE = 4;

export interface ProductListingPageChangeEvent {
  firstNode: ProductItemFragment | undefined;
  nodeCount: number;
  shouldAnimate: boolean;
}

export type ProductListingConnection = NonNullable<
  MerchQuery['collection']
>['products'];

export const EMPTY_PRODUCT_CONNECTION: ProductListingConnection = {
  nodes: [],
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
    startCursor: null,
    endCursor: null,
  },
};

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
