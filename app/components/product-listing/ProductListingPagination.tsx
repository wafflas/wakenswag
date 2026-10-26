import {useRef, useState, type ReactNode} from 'react';
import type {ProductItemFragment} from 'storefrontapi.generated';

const paginationActionClassName = [
  'group inline-flex min-h-11 cursor-pointer items-center justify-center gap-1',
  'border-0 bg-transparent p-0',
].join(' ');

const paginationNextActionClassName = `${paginationActionClassName} ml-auto`;

const paginationActionLabelClassName = [
  'ps2-soft-copy text-xl leading-none text-ps2-cyan/80 lg:text-3xl',
  'transition-opacity group-hover:text-ps2-cyan group-hover:opacity-100',
].join(' ');

export interface ProductListingPageChangeEvent {
  firstNode: ProductItemFragment | undefined;
  nodeCount: number;
  shouldAnimate: boolean;
}

export type ProductListingConnection = {
  nodes: ProductItemFragment[];
};

interface ProductListingPaginationProps {
  connection: ProductListingConnection;
  pageSize: number;
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
 * Merch local pagination only — flips through `connection.nodes` in memory.
 * Does not write cursor params to the URL.
 */
export function ProductListingPagination({
  connection,
  pageSize,
  containerClassName,
  resourcesClassName,
  paginationClassName,
  onPageChange,
  children,
}: ProductListingPaginationProps) {
  const {nodes} = connection;
  const [pageIndex, setPageIndex] = useState(0);
  const visitedPageKeysRef = useRef(new Set<string>());

  const pageCount = Math.max(1, Math.ceil(nodes.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageStart = currentPage * pageSize;
  const visibleNodes = nodes.slice(pageStart, pageStart + pageSize);
  const hasPreviousPage = currentPage > 0;
  const hasNextPage = currentPage < pageCount - 1;
  const currentPageNumber = currentPage + 1;
  const pageStatusLabel = `Page ${currentPageNumber} of ${pageCount}`;
  const currentPageKey = getPageKey(nodes, currentPage, pageSize);
  const shouldAnimatePage = !visitedPageKeysRef.current.has(currentPageKey);

  const changePage = (nextPage: number) => {
    const nextPageNodes = nodes.slice(
      nextPage * pageSize,
      nextPage * pageSize + pageSize,
    );
    const nextPageKey = getPageKey(nodes, nextPage, pageSize);
    const shouldAnimate = !visitedPageKeysRef.current.has(nextPageKey);

    visitedPageKeysRef.current.add(currentPageKey);
    setPageIndex(nextPage);
    onPageChange?.({
      firstNode: nextPageNodes[0],
      nodeCount: nextPageNodes.length,
      shouldAnimate,
    });
  };

  return (
    <div className={containerClassName}>
      <div
        aria-label={`Products, ${pageStatusLabel}`}
        className={resourcesClassName}
        role="region"
      >
        {visibleNodes.map((node, index) =>
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
          {pageStatusLabel}
        </span>

        {hasPreviousPage ? (
          <button
            aria-label={`Go to previous product page, ${pageStatusLabel}`}
            className={paginationActionClassName}
            onClick={() => changePage(currentPage - 1)}
            type="button"
          >
            <span aria-hidden="true" className={paginationActionLabelClassName}>
              Previous
            </span>
          </button>
        ) : null}

        {hasNextPage ? (
          <button
            aria-label={`Go to next product page, ${pageStatusLabel}`}
            className={paginationNextActionClassName}
            onClick={() => changePage(currentPage + 1)}
            type="button"
          >
            <span aria-hidden="true" className={paginationActionLabelClassName}>
              Next
            </span>
          </button>
        ) : null}
      </nav>
    </div>
  );
}

function getNodeId(node: unknown) {
  if (
    node &&
    typeof node === 'object' &&
    'id' in node &&
    typeof node.id === 'string'
  ) {
    return node.id;
  }

  return undefined;
}

function getPageKey(
  nodes: ProductItemFragment[],
  pageIndex: number,
  pageSize: number,
) {
  const firstNodeId = getNodeId(nodes[pageIndex * pageSize]);

  return firstNodeId ? `node:${firstNodeId}` : `page:${pageIndex}`;
}
