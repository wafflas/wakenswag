import {
  getSelectedProductOptions,
  gql,
  type StorefrontApi,
} from '@shopify/hydrogen';
import {publicDataCache, type RequestStorefrontClient} from '~/lib/context';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

interface LoadProductDetailOptions {
  handle: string;
  request: Request;
  storefront: RequestStorefrontClient;
}

export async function loadProductDetail({
  handle,
  request,
  storefront,
}: LoadProductDetailOptions) {
  const {data, errors} = await storefront.graphql(PRODUCT_DETAIL_QUERY, {
    cache: publicDataCache,
    variables: {
      handle,
      selectedOptions: getSelectedProductOptions({
        searchParams: new URL(request.url).searchParams,
      }),
    },
  });

  if (errors?.length)
    throw new Response('Product is unavailable', {status: 502});
  const product = data?.product;
  if (!product?.id) {
    throw new Response(null, {
      status: 404,
    });
  }

  redirectIfHandleIsLocalized(request, {
    handle,
    data: product,
  });

  return product;
}
const PRODUCT_VARIANT_FRAGMENT = gql(`#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    quantityAvailable
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      id
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`);

const PRODUCT_FRAGMENT = gql(
  `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    productType
    collections(first: 20) {
      nodes {
        handle
      }
    }
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: $selectedOptions
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants(
      selectedOptions: $selectedOptions
    ) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }

`,
  [PRODUCT_VARIANT_FRAGMENT],
);

const PRODUCT_DETAIL_QUERY = gql(
  `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(
    country: $country
    language: $language
  ) {
    product(handle: $handle) {
      ...Product
    }
  }

`,
  [PRODUCT_FRAGMENT],
);

export type ProductFragment = NonNullable<
  StorefrontApi.ResultOf<typeof PRODUCT_DETAIL_QUERY>['product']
>;
export type ProductVariantFragment = NonNullable<
  ProductFragment['selectedOrFirstAvailableVariant']
>;
