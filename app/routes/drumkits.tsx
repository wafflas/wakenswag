import {useLoaderData, Outlet, useLocation} from 'react-router';
import type {Route} from './+types/drumkits';
import {ProductGrid} from '~/components/product-listing/ProductGrid';
import {ProductListingShell} from '~/components/product-listing/ProductListingShell';
import {useProductListingSelection} from '~/components/product-listing/useProductListingSelection';
import {useDrumkitPageSize} from '~/components/product-listing/useDrumkitPageSize';
import {
  EMPTY_PRODUCT_CONNECTION,
  DRUMKITS_PER_PAGE,
  MOBILE_DRUMKITS_PER_PAGE,
} from '~/components/product-listing/productListingUtils';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import {isProductDetailPath} from '~/lib/variants';

const DRUMKITS_HANDLE = 'drumkits';

export const meta: Route.MetaFunction = ({data}) => [
  {
    title: `Wake n Swag | ${data?.collection?.title ?? 'Drumkits'}`,
  },
  {
    name: 'description',
    content: data?.collection?.description || 'Wake n Swag drumkits.',
  },
  {
    tagName: 'link',
    rel: 'canonical',
    href: '/drumkits',
  },
];

export async function loader({context, request}: Route.LoaderArgs) {
  const pageBy =
    new URL(request.url).searchParams.get('pageSize') ===
    String(MOBILE_DRUMKITS_PER_PAGE)
      ? MOBILE_DRUMKITS_PER_PAGE
      : DRUMKITS_PER_PAGE;
  const {collection} = await context.storefront.query(DRUMKITS_QUERY, {
    variables: {
      handle: DRUMKITS_HANDLE,
      ...getPaginationVariables(request, {pageBy}),
    },
  });

  return {
    collectionAnalytics: collection
      ? {id: collection.id, handle: collection.handle}
      : null,
    collection: collection ?? {
      id: 'gid://shopify/Collection/0',
      handle: DRUMKITS_HANDLE,
      title: 'Drumkits',
      description: '',
      products: EMPTY_PRODUCT_CONNECTION,
    },
  };
}

export default function Drumkits() {
  useDrumkitPageSize();
  const {collection, collectionAnalytics} = useLoaderData<typeof loader>();
  const {pathname} = useLocation();
  const products = collection.products;

  const {selectedProductId, loadingDurationMs, onSelect} =
    useProductListingSelection({
      initialProduct: products.nodes[0],
      fallbackTitle: collection.title,
      productCount: Math.min(products.nodes.length, DRUMKITS_PER_PAGE),
    });

  return (
    <>
      <ProductListingShell
        className="ps2-drumkit-listing"
        animationKey="/drumkits"
        displayTitle="Buy the fucking drumkits"
        loadingDurationMs={loadingDurationMs}
        backgroundClassName="bg-ps2-black"
      >
        {products.nodes.length > 0 ? (
          <ProductGrid
            connection={products}
            onSelect={onSelect}
            selectedProductId={selectedProductId}
          />
        ) : (
          <p className="ps2-soft-copy px-6 text-center text-xl text-ps2-muted lg:text-2xl">
            Coming soon.
          </p>
        )}
      </ProductListingShell>

      <Outlet />
      {collectionAnalytics && !isProductDetailPath(pathname) ? (
        <Analytics.CollectionView data={{collection: collectionAnalytics}} />
      ) : null}
    </>
  );
}

const DRUMKITS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Drumkits(
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
      title
      description
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
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
