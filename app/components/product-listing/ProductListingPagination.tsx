import {useEffect, useRef, type ReactNode} from 'react';
import {Link, useLocation, useNavigation} from 'react-router';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {
  getProductListingPageUrl,
  type ProductListingConnection,
  type ProductListingPageChangeEvent,
} from './productListingUtils';

const paginationActionClassName = [
  'ps2-cta',
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-1',
  'border-0 bg-transparent p-0',
].join(' ');

const paginationNextActionClassName = `${paginationActionClassName} ml-auto`;

const paginationActionLabelClassName = [
  'ps2-soft-copy text-xl leading-none lg:text-3xl',
].join(' ');

interface ProductListingPaginationProps {
  connection: ProductListingConnection;
  containerClassName?: string;
  resourcesClassName?: string;
  paginationClassName?: string;
  onPageChange?: (event: ProductListingPageChangeEvent) => void;
  children: (props: {
    node: ProductItemFragment;
    index: number;
    shouldAnimate: boolean;
  }) => ReactNode;
}

/**
 * Page-sized Shopify results with URL cursors. Native links support refresh,
 * browser history and opening a page in another tab without loading the catalog.
 */
export function ProductListingPagination({
  connection,
  containerClassName,
  resourcesClassName,
  paginationClassName,
  onPageChange,
  children,
}: ProductListingPaginationProps) {
  const {nodes, pageInfo} = connection;
  const location = useLocation();
  const navigation = useNavigation();
  const visitedPageKeysRef = useRef(new Set<string>());
  const currentPageKey = nodes[0]?.id ?? 'empty';
  const previousPageKeyRef = useRef(currentPageKey);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const shouldAnimatePage = !visitedPageKeysRef.current.has(currentPageKey);

  useEffect(() => {
    if (previousPageKeyRef.current === currentPageKey) return;
    visitedPageKeysRef.current.add(previousPageKeyRef.current);
    previousPageKeyRef.current = currentPageKey;
    onPageChangeRef.current?.({
      firstNode: nodes[0],
      nodeCount: nodes.length,
      shouldAnimate: !visitedPageKeysRef.current.has(currentPageKey),
    });
  }, [currentPageKey, nodes]);

  return (
    <div className={containerClassName}>
      <div
        aria-label="Products"
        aria-busy={navigation.state !== 'idle'}
        className={resourcesClassName}
        role="region"
      >
        {nodes.map((node, index) =>
          children({
            node,
            index,
            shouldAnimate: shouldAnimatePage,
          }),
        )}
      </div>

      <nav
        aria-label="Product pagination"
        className={
          paginationClassName ??
          'flex w-full items-center justify-between gap-6'
        }
      >
        <span className="sr-only" aria-atomic="true" aria-live="polite">
          Showing {nodes.length} products
        </span>

        {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
          <Link
            aria-label="Go to previous product page"
            className={paginationActionClassName}
            to={getProductListingPageUrl({
              pathname: location.pathname,
              search: location.search,
              direction: 'previous',
              cursor: pageInfo.startCursor,
            })}
            preventScrollReset
          >
            <span aria-hidden="true" className={paginationActionLabelClassName}>
              Previous
            </span>
          </Link>
        ) : null}

        {pageInfo.hasNextPage && pageInfo.endCursor ? (
          <Link
            aria-label="Go to next product page"
            className={paginationNextActionClassName}
            to={getProductListingPageUrl({
              pathname: location.pathname,
              search: location.search,
              direction: 'next',
              cursor: pageInfo.endCursor,
            })}
            preventScrollReset
          >
            <span aria-hidden="true" className={paginationActionLabelClassName}>
              Next
            </span>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
