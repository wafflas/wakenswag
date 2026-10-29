import type {Route} from './+types/search';
import {
  getEmptyPredictiveSearchResult,
  type PredictiveSearchReturn,
} from '~/lib/search';

/** Resource route used by the full-screen predictive-search modal. */
export async function loader({
  request,
  context,
}: Route.LoaderArgs): Promise<PredictiveSearchReturn> {
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') ?? '').trim();

  if (!term) {
    return {
      type: 'predictive',
      term,
      result: getEmptyPredictiveSearchResult(),
    };
  }

  try {
    return await predictiveSearch({request, context});
  } catch {
    return {
      type: 'predictive',
      term,
      result: getEmptyPredictiveSearchResult(),
    };
  }
}

export default function SearchResource() {
  return null;
}

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $term: String!
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit
      limitScope: EACH
      query: $term
      types: [PRODUCT, QUERY]
    ) {
      products {
        id
        title
        handle
        productType
        availableForSale
        trackingParameters
        featuredImage {
          url
          altText
          width
          height
        }
        selectedOrFirstAvailableVariant(
          selectedOptions: []
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          id
          availableForSale
          image {
            url
            altText
            width
            height
          }
          price {
            amount
            currencyCode
          }
        }
      }
      queries {
        text
      }
    }
  }
` as const;

async function predictiveSearch({
  request,
  context,
}: Pick<
  Route.LoaderArgs,
  'request' | 'context'
>): Promise<PredictiveSearchReturn> {
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') ?? '').trim();
  const requestedLimit = Number(url.searchParams.get('limit') ?? 8);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 8;
  const {storefront} = context;

  const {predictiveSearch: result, errors} = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {variables: {limit, term}},
  );

  if (errors?.length) {
    throw new Error(
      errors.map(({message}: {message: string}) => message).join(', '),
    );
  }

  if (!result) {
    throw new Error('No predictive search data returned');
  }

  const items = {
    products: result.products,
    queries: result.queries,
  };

  return {
    type: 'predictive',
    term,
    result: {
      items,
      total: items.products.length + items.queries.length,
    },
  };
}
