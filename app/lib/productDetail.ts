import {
  getSelectedProductOptions,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

interface LoadProductDetailOptions {
  handle: string;
  request: Request;
  storefront: HydrogenRouterContextProvider['storefront'];
}

export async function loadProductDetail({
  handle,
  request,
  storefront,
}: LoadProductDetailOptions) {
  const {product} = await storefront.query(PRODUCT_DETAIL_QUERY, {
    variables: {
      handle,
      selectedOptions: getSelectedProductOptions(request),
    },
  });

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
const PRODUCT_VARIANT_FRAGMENT = `#graphql
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
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
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

  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_DETAIL_QUERY = `#graphql
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

  ${PRODUCT_FRAGMENT}
` as const;
