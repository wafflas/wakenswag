import {gql, type StorefrontApi} from '@shopify/hydrogen';

const MoneyProductItemFragment = gql(`
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
`);

export const PRODUCT_ITEM_FRAGMENT = gql(
  `
  fragment ProductItem on Product {
    id
    handle
    title
    description
    descriptionHtml
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`,
  [MoneyProductItemFragment],
);

export const CART_QUERY_FRAGMENT = gql(`fragment CartFragment on Cart {
  lines(first: 250) {nodes {
    merchandise {... on ProductVariant {
      availableForSale quantityAvailable requiresShipping
      price {amount currencyCode}
      compareAtPrice {amount currencyCode}
      product {collections(first: 20) {nodes {handle}}}
    }}
    ... on ComponentizableCartLine {lineComponents {
      id quantity attributes {key value} sellingPlanAllocation {sellingPlan {id}}
      cost {totalAmount {amount currencyCode} subtotalAmount {amount currencyCode} amountPerQuantity {amount currencyCode} compareAtAmountPerQuantity {amount currencyCode}}
      merchandise {... on ProductVariant {id title sku selectedOptions {name value} image {id url altText width height} product {id title handle vendor productType collections(first: 20) {nodes {handle}}} availableForSale quantityAvailable requiresShipping price {amount currencyCode} compareAtPrice {amount currencyCode}}}
      parentRelationship {parent {id}}
    }}
  }}
  buyerIdentity {countryCode email phone customer {id email firstName lastName displayName}}
  appliedGiftCards {id lastCharacters amountUsed {amount currencyCode}}
}`);

// The SDK infers result types from operations, so this document anchors the fragment type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PRODUCT_ITEM_SHAPE = gql(
  `query ProductItemShape {products(first: 1) {nodes {...ProductItem}}}`,
  [PRODUCT_ITEM_FRAGMENT],
);
export type ProductItemFragment = StorefrontApi.ResultOf<
  typeof PRODUCT_ITEM_SHAPE
>['products']['nodes'][number];
