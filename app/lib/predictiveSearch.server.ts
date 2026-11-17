import {
  createPredictiveSearchServerHandlers,
  createShopifyRouteHandler,
  gql,
  type ShopifyRouteHandlerContext,
  type PredictiveSearchDataFromHandlers,
} from '@shopify/hydrogen';
const baseSearchHandlers = createPredictiveSearchServerHandlers({
  limit: 8,
  types: ['PRODUCT', 'QUERY'],
  fragments: {
    product: gql(
      `fragment PredictiveSearchProductFragment on Product {productType collections(first: 20) {nodes {handle}} availableForSale selectedOrFirstAvailableVariant(selectedOptions: [], ignoreUnknownOptions: true, caseInsensitiveMatch: true) {id availableForSale image {url altText width height} price {amount currencyCode}}}`,
    ),
  },
});
export type PredictiveSearchData = PredictiveSearchDataFromHandlers<
  typeof baseSearchHandlers
>;

const baseGet = baseSearchHandlers.get;
const get = createShopifyRouteHandler(
  '/api/predictive-search',
  'GET',
  async (context: Omit<ShopifyRouteHandlerContext, 'sessionManager'>) => {
    const result = await baseGet(context);
    return result.type === 'error'
      ? {
          ...result,
          status: 502,
          error: {
            ...result.error,
            message: 'Search is unavailable. Please try again.',
          },
        }
      : result;
  },
);
export const predictiveSearchHandlers = {...baseSearchHandlers, get};
