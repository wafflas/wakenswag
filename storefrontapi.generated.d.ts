/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontAPI from '@shopify/hydrogen/storefront-api-types';

export type MoneyProductItemFragment = Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;

export type ProductItemFragment = (
  Pick<StorefrontAPI.Product, 'id' | 'handle' | 'title' | 'description'>
  & { featuredImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'altText' | 'url' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'> } }
);

export type MoneyFragment = Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;

export type CartLineFragment = (
  Pick<StorefrontAPI.CartLine, 'id' | 'quantity'>
  & { attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>, cost: { totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, compareAtAmountPerQuantity?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>> }, merchandise: (
    Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale' | 'quantityAvailable' | 'requiresShipping' | 'title'>
    & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>>, price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>>, product: (
      Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor' | 'productType'>
      & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> } }
    ), selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>> }
  ), parentRelationship?: StorefrontAPI.Maybe<{ parent: Pick<StorefrontAPI.CartLine, 'id'> }> }
);

export type CartLineComponentFragment = (
  Pick<StorefrontAPI.ComponentizableCartLine, 'id' | 'quantity'>
  & { attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>, cost: { totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, compareAtAmountPerQuantity?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>> }, merchandise: (
    Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale' | 'quantityAvailable' | 'requiresShipping' | 'title'>
    & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>>, price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>>, product: (
      Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor' | 'productType'>
      & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> } }
    ), selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>> }
  ), lineComponents: Array<(
    Pick<StorefrontAPI.CartLine, 'id' | 'quantity'>
    & { attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>, cost: { totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, compareAtAmountPerQuantity?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>> }, merchandise: (
      Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale' | 'quantityAvailable' | 'requiresShipping' | 'title'>
      & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>>, price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>>, product: (
        Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor' | 'productType'>
        & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> } }
      ), selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>> }
    ), parentRelationship?: StorefrontAPI.Maybe<{ parent: Pick<StorefrontAPI.CartLine, 'id'> }> }
  )> }
);

export type CartApiQueryFragment = (
  Pick<StorefrontAPI.Cart, 'updatedAt' | 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
  & { appliedGiftCards: Array<(
    Pick<StorefrontAPI.AppliedGiftCard, 'id' | 'lastCharacters'>
    & { amountUsed: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'> }
  )>, buyerIdentity: (
    Pick<StorefrontAPI.CartBuyerIdentity, 'countryCode' | 'email' | 'phone'>
    & { customer?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Customer, 'id' | 'email' | 'firstName' | 'lastName' | 'displayName'>> }
  ), lines: { nodes: Array<(
      Pick<StorefrontAPI.CartLine, 'id' | 'quantity'>
      & { attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>, cost: { totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, compareAtAmountPerQuantity?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>> }, merchandise: (
        Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale' | 'quantityAvailable' | 'requiresShipping' | 'title'>
        & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>>, price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>>, product: (
          Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor' | 'productType'>
          & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> } }
        ), selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>> }
      ), parentRelationship?: StorefrontAPI.Maybe<{ parent: Pick<StorefrontAPI.CartLine, 'id'> }> }
    ) | (
      Pick<StorefrontAPI.ComponentizableCartLine, 'id' | 'quantity'>
      & { attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>, cost: { totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, compareAtAmountPerQuantity?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>> }, merchandise: (
        Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale' | 'quantityAvailable' | 'requiresShipping' | 'title'>
        & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>>, price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>>, product: (
          Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor' | 'productType'>
          & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> } }
        ), selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>> }
      ), lineComponents: Array<(
        Pick<StorefrontAPI.CartLine, 'id' | 'quantity'>
        & { attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>, cost: { totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, compareAtAmountPerQuantity?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>> }, merchandise: (
          Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale' | 'quantityAvailable' | 'requiresShipping' | 'title'>
          & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>>, price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>>, product: (
            Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor' | 'productType'>
            & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> } }
          ), selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>> }
        ), parentRelationship?: StorefrontAPI.Maybe<{ parent: Pick<StorefrontAPI.CartLine, 'id'> }> }
      )> }
    )> }, cost: { subtotalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>, totalDutyAmount?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>>, totalTaxAmount?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>> }, attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>, discountCodes: Array<Pick<StorefrontAPI.CartDiscountCode, 'code' | 'applicable'>> }
);

export type ProductVariantFragment = (
  Pick<StorefrontAPI.ProductVariant, 'availableForSale' | 'quantityAvailable' | 'id' | 'sku' | 'title'>
  & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>>, image?: StorefrontAPI.Maybe<(
    { __typename: 'Image' }
    & Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
  )>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, product: Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'>, selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>, unitPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>> }
);

export type ProductFragment = (
  Pick<StorefrontAPI.Product, 'id' | 'title' | 'vendor' | 'handle' | 'descriptionHtml' | 'description' | 'productType' | 'encodedVariantExistence' | 'encodedVariantAvailability'>
  & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> }, options: Array<(
    Pick<StorefrontAPI.ProductOption, 'name'>
    & { optionValues: Array<(
      Pick<StorefrontAPI.ProductOptionValue, 'name'>
      & { firstSelectableVariant?: StorefrontAPI.Maybe<(
        Pick<StorefrontAPI.ProductVariant, 'availableForSale' | 'quantityAvailable' | 'id' | 'sku' | 'title'>
        & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>>, image?: StorefrontAPI.Maybe<(
          { __typename: 'Image' }
          & Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
        )>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, product: Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'>, selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>, unitPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>> }
      )>, swatch?: StorefrontAPI.Maybe<(
        Pick<StorefrontAPI.ProductOptionValueSwatch, 'color'>
        & { image?: StorefrontAPI.Maybe<{ previewImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>> }> }
      )> }
    )> }
  )>, selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<(
    Pick<StorefrontAPI.ProductVariant, 'availableForSale' | 'quantityAvailable' | 'id' | 'sku' | 'title'>
    & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>>, image?: StorefrontAPI.Maybe<(
      { __typename: 'Image' }
      & Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
    )>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, product: Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'>, selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>, unitPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>> }
  )>, adjacentVariants: Array<(
    Pick<StorefrontAPI.ProductVariant, 'availableForSale' | 'quantityAvailable' | 'id' | 'sku' | 'title'>
    & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>>, image?: StorefrontAPI.Maybe<(
      { __typename: 'Image' }
      & Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
    )>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, product: Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'>, selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>, unitPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>> }
  )>, seo: Pick<StorefrontAPI.Seo, 'description' | 'title'> }
);

export type ProductQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  handle: StorefrontAPI.Scalars['String']['input'];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  selectedOptions: Array<StorefrontAPI.SelectedOptionInput> | StorefrontAPI.SelectedOptionInput;
}>;


export type ProductQuery = { product?: StorefrontAPI.Maybe<(
    Pick<StorefrontAPI.Product, 'id' | 'title' | 'vendor' | 'handle' | 'descriptionHtml' | 'description' | 'productType' | 'encodedVariantExistence' | 'encodedVariantAvailability'>
    & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> }, options: Array<(
      Pick<StorefrontAPI.ProductOption, 'name'>
      & { optionValues: Array<(
        Pick<StorefrontAPI.ProductOptionValue, 'name'>
        & { firstSelectableVariant?: StorefrontAPI.Maybe<(
          Pick<StorefrontAPI.ProductVariant, 'availableForSale' | 'quantityAvailable' | 'id' | 'sku' | 'title'>
          & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>>, image?: StorefrontAPI.Maybe<(
            { __typename: 'Image' }
            & Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
          )>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, product: Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'>, selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>, unitPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>> }
        )>, swatch?: StorefrontAPI.Maybe<(
          Pick<StorefrontAPI.ProductOptionValueSwatch, 'color'>
          & { image?: StorefrontAPI.Maybe<{ previewImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>> }> }
        )> }
      )> }
    )>, selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<(
      Pick<StorefrontAPI.ProductVariant, 'availableForSale' | 'quantityAvailable' | 'id' | 'sku' | 'title'>
      & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>>, image?: StorefrontAPI.Maybe<(
        { __typename: 'Image' }
        & Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
      )>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, product: Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'>, selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>, unitPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>> }
    )>, adjacentVariants: Array<(
      Pick<StorefrontAPI.ProductVariant, 'availableForSale' | 'quantityAvailable' | 'id' | 'sku' | 'title'>
      & { compareAtPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>>, image?: StorefrontAPI.Maybe<(
        { __typename: 'Image' }
        & Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
      )>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, product: Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'>, selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>, unitPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>> }
    )>, seo: Pick<StorefrontAPI.Seo, 'description' | 'title'> }
  )> };

export type DrumkitsQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
  endCursor?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;


export type DrumkitsQuery = { collection?: StorefrontAPI.Maybe<(
    Pick<StorefrontAPI.Collection, 'id' | 'handle' | 'title' | 'description'>
    & { products: { nodes: Array<(
        Pick<StorefrontAPI.Product, 'id' | 'handle' | 'title' | 'description'>
        & { featuredImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'altText' | 'url' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'> } }
      )>, pageInfo: Pick<StorefrontAPI.PageInfo, 'hasPreviousPage' | 'hasNextPage' | 'endCursor' | 'startCursor'> } }
  )> };

export type MerchQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
  endCursor?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;


export type MerchQuery = { collection?: StorefrontAPI.Maybe<{ products: { nodes: Array<(
        Pick<StorefrontAPI.Product, 'id' | 'handle' | 'title' | 'description'>
        & { featuredImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'id' | 'altText' | 'url' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'> } }
      )>, pageInfo: Pick<StorefrontAPI.PageInfo, 'hasPreviousPage' | 'hasNextPage' | 'startCursor' | 'endCursor'> } }> };

export type PredictiveSearchQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  limit: StorefrontAPI.Scalars['Int']['input'];
  term: StorefrontAPI.Scalars['String']['input'];
}>;


export type PredictiveSearchQuery = { predictiveSearch?: StorefrontAPI.Maybe<{ products: Array<(
      Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle' | 'productType' | 'availableForSale' | 'trackingParameters'>
      & { collections: { nodes: Array<Pick<StorefrontAPI.Collection, 'handle'>> }, featuredImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>>, selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<(
        Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale'>
        & { image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'> }
      )> }
    )>, queries: Array<Pick<StorefrontAPI.SearchQuerySuggestion, 'text'>> }> };

interface GeneratedQueryTypes {
  "#graphql\n  query Product(\n    $country: CountryCode\n    $handle: String!\n    $language: LanguageCode\n    $selectedOptions: [SelectedOptionInput!]!\n  ) @inContext(\n    country: $country\n    language: $language\n  ) {\n    product(handle: $handle) {\n      ...Product\n    }\n  }\n\n  #graphql\n  fragment Product on Product {\n    id\n    title\n    vendor\n    handle\n    descriptionHtml\n    description\n    productType\n    collections(first: 20) {\n      nodes {\n        handle\n      }\n    }\n    encodedVariantExistence\n    encodedVariantAvailability\n    options {\n      name\n      optionValues {\n        name\n        firstSelectableVariant {\n          ...ProductVariant\n        }\n        swatch {\n          color\n          image {\n            previewImage {\n              url\n            }\n          }\n        }\n      }\n    }\n    selectedOrFirstAvailableVariant(\n      selectedOptions: $selectedOptions\n      ignoreUnknownOptions: true\n      caseInsensitiveMatch: true\n    ) {\n      ...ProductVariant\n    }\n    adjacentVariants(\n      selectedOptions: $selectedOptions\n    ) {\n      ...ProductVariant\n    }\n    seo {\n      description\n      title\n    }\n  }\n\n  #graphql\n  fragment ProductVariant on ProductVariant {\n    availableForSale\n    quantityAvailable\n    compareAtPrice {\n      amount\n      currencyCode\n    }\n    id\n    image {\n      __typename\n      id\n      url\n      altText\n      width\n      height\n    }\n    price {\n      amount\n      currencyCode\n    }\n    product {\n      id\n      title\n      handle\n    }\n    selectedOptions {\n      name\n      value\n    }\n    sku\n    title\n    unitPrice {\n      amount\n      currencyCode\n    }\n  }\n\n\n": {return: ProductQuery, variables: ProductQueryVariables},
  "#graphql\n  #graphql\n  fragment MoneyProductItem on MoneyV2 {\n    amount\n    currencyCode\n  }\n  fragment ProductItem on Product {\n    id\n    handle\n    title\n    description\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyProductItem\n      }\n      maxVariantPrice {\n        ...MoneyProductItem\n      }\n    }\n  }\n\n  query Drumkits(\n    $handle: String!\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      products(\n        first: $first\n        last: $last\n        before: $startCursor\n        after: $endCursor\n      ) {\n        nodes {\n          ...ProductItem\n        }\n        pageInfo {\n          hasPreviousPage\n          hasNextPage\n          endCursor\n          startCursor\n        }\n      }\n    }\n  }\n": {return: DrumkitsQuery, variables: DrumkitsQueryVariables},
  "#graphql\n  query Merch(\n    $handle: String!\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      products(\n        first: $first\n        last: $last\n        before: $startCursor\n        after: $endCursor\n      ) {\n        nodes {\n          ...ProductItem\n        }\n        pageInfo {\n          hasPreviousPage\n          hasNextPage\n          startCursor\n          endCursor\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment MoneyProductItem on MoneyV2 {\n    amount\n    currencyCode\n  }\n  fragment ProductItem on Product {\n    id\n    handle\n    title\n    description\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyProductItem\n      }\n      maxVariantPrice {\n        ...MoneyProductItem\n      }\n    }\n  }\n\n": {return: MerchQuery, variables: MerchQueryVariables},
  "#graphql\n  query PredictiveSearch(\n    $country: CountryCode\n    $language: LanguageCode\n    $limit: Int!\n    $term: String!\n  ) @inContext(country: $country, language: $language) {\n    predictiveSearch(\n      limit: $limit\n      limitScope: EACH\n      query: $term\n      types: [PRODUCT, QUERY]\n    ) {\n      products {\n        id\n        title\n        handle\n        productType\n        collections(first: 20) {\n          nodes {\n            handle\n          }\n        }\n        availableForSale\n        trackingParameters\n        featuredImage {\n          url\n          altText\n          width\n          height\n        }\n        selectedOrFirstAvailableVariant(\n          selectedOptions: []\n          ignoreUnknownOptions: true\n          caseInsensitiveMatch: true\n        ) {\n          id\n          availableForSale\n          image {\n            url\n            altText\n            width\n            height\n          }\n          price {\n            amount\n            currencyCode\n          }\n        }\n      }\n      queries {\n        text\n      }\n    }\n  }\n": {return: PredictiveSearchQuery, variables: PredictiveSearchQueryVariables},
}

interface GeneratedMutationTypes {
}

declare module '@shopify/hydrogen' {
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
