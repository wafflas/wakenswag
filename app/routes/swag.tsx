import {Outlet, useLoaderData, useLocation} from 'react-router';
import type {Route} from './+types/swag';
import {ProductGrid} from '~/components/product-listing/ProductGrid';
import {ProductListingShell} from '~/components/product-listing/ProductListingShell';
import {useProductListingSelection} from '~/components/product-listing/useProductListingSelection';
import {
  EMPTY_PRODUCT_CONNECTION,
  PRODUCTS_PER_PAGE,
  getPaginationVariables,
} from '~/components/product-listing/productListingUtils';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import {gql} from '@shopify/hydrogen';
import {storefrontClientContext, publicDataCache} from '~/lib/context';
import {AnalyticsView} from '~/components/analytics/AnalyticsView';
import {isProductDetailPath} from '~/lib/variants';

const SWAG_HANDLE = 'swag';

export const meta: Route.MetaFunction = () => [
  {
    title: 'Wake N Swag | Swag',
  },
  {
    name: 'description',
    content: 'Shop official Wake N Swag clothing.',
  },
  {
    tagName: 'link',
    rel: 'canonical',
    href: '/swag',
  },
];

export async function loader({context, request}: Route.LoaderArgs) {
  const {data, errors} = await context
    .get(storefrontClientContext)
    .graphql(SWAG_QUERY, {
      cache: publicDataCache,
      variables: {
        handle: SWAG_HANDLE,
        ...getPaginationVariables(request, {pageBy: PRODUCTS_PER_PAGE}),
      },
    });

  if (errors?.length)
    throw new Response('Collection is unavailable', {status: 502});
  const collection = data?.collection;
  return {
    products: collection?.products ?? EMPTY_PRODUCT_CONNECTION,
    collectionAnalytics: collection
      ? {id: collection.id, handle: collection.handle}
      : null,
  };
}

export default function Swag() {
  const {products, collectionAnalytics} = useLoaderData<typeof loader>();
  const {pathname} = useLocation();

  const {displayTitle, selectedProductId, loadingDurationMs, onSelect} =
    useProductListingSelection({
      initialProduct: products.nodes[0],
      fallbackTitle: 'Swag',
      productCount: Math.min(products.nodes.length, PRODUCTS_PER_PAGE),
    });

  return (
    <>
      <ProductListingShell
        animationKey="/swag"
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
            No swag available yet.
          </p>
        )}
      </ProductListingShell>

      <Outlet />
      {collectionAnalytics && !isProductDetailPath(pathname) ? (
        <AnalyticsView
          event="collection_viewed"
          data={{collection: collectionAnalytics}}
        />
      ) : null}
    </>
  );
}

const SWAG_QUERY = gql(
  `#graphql
  query Swag(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
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

`,
  [PRODUCT_ITEM_FRAGMENT],
);
