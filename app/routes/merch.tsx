import {Outlet, useLoaderData} from 'react-router';
import type {Route} from './+types/merch';
import {ProductGrid} from '~/components/product-listing/ProductGrid';
import {ProductListingShell} from '~/components/product-listing/ProductListingShell';
import {useProductListingSelection} from '~/components/product-listing/useProductListingSelection';
import {
  EMPTY_PRODUCT_CONNECTION,
  PRODUCTS_PER_PAGE,
} from '~/components/product-listing/productListingUtils';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import {getPaginationVariables} from '@shopify/hydrogen';

const MERCH_HANDLE = 'merch';

export const meta: Route.MetaFunction = () => [
  {
    title: 'Wake n Swag | Merch',
  },
  {
    name: 'description',
    content: 'Wake n Swag merchandise.',
  },
  {
    tagName: 'link',
    rel: 'canonical',
    href: '/merch',
  },
];

export async function loader({context, request}: Route.LoaderArgs) {
  const {collection} = await context.storefront.query(MERCH_QUERY, {
    variables: {
      handle: MERCH_HANDLE,
      ...getPaginationVariables(request, {pageBy: PRODUCTS_PER_PAGE}),
    },
  });

  return {products: collection?.products ?? EMPTY_PRODUCT_CONNECTION};
}

export default function Merch() {
  const {products} = useLoaderData<typeof loader>();

  const {displayTitle, selectedProductId, loadingDurationMs, onSelect} =
    useProductListingSelection({
      initialProduct: products.nodes[0],
      fallbackTitle: 'Merch',
      productCount: Math.min(products.nodes.length, PRODUCTS_PER_PAGE),
    });

  return (
    <>
      <ProductListingShell
        animationKey="/merch"
        displayTitle={displayTitle}
        loadingDurationMs={loadingDurationMs}
      >
        {products.nodes.length > 0 ? (
          <ProductGrid
            connection={products}
            onSelect={onSelect}
            selectedProductId={selectedProductId}
          />
        ) : (
          <p className="ps2-soft-copy px-6 text-center text-xl text-ps2-muted lg:text-2xl">
            No merch available yet.
          </p>
        )}
      </ProductListingShell>

      <Outlet />
    </>
  );
}

const MERCH_QUERY = `#graphql
  query Merch(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }

  ${PRODUCT_ITEM_FRAGMENT}
` as const;
