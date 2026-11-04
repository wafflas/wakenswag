import {Outlet, useLoaderData} from 'react-router';
import type {Route} from './+types/merch';
import {ProductGrid} from '~/components/product-listing/ProductGrid';
import {ProductListingShell} from '~/components/product-listing/ProductListingShell';
import {useProductListingSelection} from '~/components/product-listing/useProductListingSelection';
import {PRODUCTS_PER_PAGE} from '~/components/product-listing/productListingUtils';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import {getPaginationVariables} from '@shopify/hydrogen';

export const meta: Route.MetaFunction = () => [
  {
    title: 'Merch | Wake n Swag',
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
  const {products} = await context.storefront.query(MERCH_QUERY, {
    variables: getPaginationVariables(request, {pageBy: PRODUCTS_PER_PAGE}),
  });

  return {products};
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
        <ProductGrid
          connection={products}
          onSelect={onSelect}
          selectedProductId={selectedProductId}
        />
      </ProductListingShell>

      <Outlet />
    </>
  );
}

const MERCH_QUERY = `#graphql
  query Merch(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
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

  ${PRODUCT_ITEM_FRAGMENT}
` as const;
