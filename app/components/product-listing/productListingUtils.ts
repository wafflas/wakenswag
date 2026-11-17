import type {ProductItemFragment} from '~/lib/fragments';

export const PRODUCT_LISTING_STAGGER_MS = 400;
export const PRODUCTS_PER_PAGE = 12;
export const DRUMKITS_PER_PAGE = 6;
export const MOBILE_DRUMKITS_PER_PAGE = 4;

export interface ProductListingPageChangeEvent {
  firstNode: ProductItemFragment | undefined;
  nodeCount: number;
  shouldAnimate: boolean;
}

export type ProductListingConnection = {
  nodes: ProductItemFragment[];
  pageInfo: {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

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

/** Preserve page-sized cursor navigation and the existing URLs. */
export function getPaginationVariables(
  request: Request,
  {pageBy}: {pageBy: number},
) {
  const params = new URL(request.url).searchParams;
  const cursor = params.get('cursor');
  return params.get('direction') === 'previous'
    ? {last: pageBy, ...(cursor ? {startCursor: cursor} : {})}
    : {first: pageBy, ...(cursor ? {endCursor: cursor} : {})};
}
