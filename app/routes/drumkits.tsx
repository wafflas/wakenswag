import {useLoaderData} from 'react-router';
import type {Route} from './+types/drumkits';
import {ProductGrid} from '~/components/product-listing/ProductGrid';
import {ProductListingShell} from '~/components/product-listing/ProductListingShell';
import {
  PRODUCTS_PER_PAGE,
  useProductListingSelection,
} from '~/components/product-listing/useProductListingSelection';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';

const DRUMKITS_HANDLE = 'drumkits';

export const meta: Route.MetaFunction = ({data}) => [
  {
    title: `${data?.collection?.title ?? 'Drumkits'} | Wake n Swag`,
  },
  {
    name: 'description',
    content: data?.collection?.description || 'Wake n Swag drumkits.',
  },
  {
    rel: 'canonical',
    href: '/drumkits',
  },
];

const EMPTY_PRODUCTS = {
  nodes: [] as never[],
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
    startCursor: null as string | null,
    endCursor: null as string | null,
  },
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
  };
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const {collection} = await context.storefront.query(DRUMKITS_QUERY, {
    variables: {
      handle: DRUMKITS_HANDLE,
      first: PRODUCTS_PER_PAGE,
    },
  });

  return {
    collection: collection ?? {
      id: 'gid://shopify/Collection/0',
      handle: DRUMKITS_HANDLE,
      title: 'Drumkits',
      description: '',
      products: EMPTY_PRODUCTS,
    },
  };
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

export default function Drumkits() {
  const {collection} = useLoaderData<typeof loader>();
  const products = collection.products;

  const {displayTitle, selectedProductId, loadingDurationMs, onSelect} =
    useProductListingSelection({
      initialProduct: products.nodes[0],
      fallbackTitle: collection.title,
      productCount: Math.min(products.nodes.length, PRODUCTS_PER_PAGE),
    });

  return (
    <ProductListingShell
      animationKey="/drumkits"
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
          Coming soon.
        </p>
      )}
    </ProductListingShell>
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
