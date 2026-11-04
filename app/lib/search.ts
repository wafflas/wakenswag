import type {PredictiveSearchQuery} from 'storefrontapi.generated';

export type SearchProductNode = NonNullable<
  PredictiveSearchQuery['predictiveSearch']
>['products'][number];

type PredictiveSearchItems = {
  products: SearchProductNode[];
  queries: Array<{
    text: string;
  }>;
};

export type PredictiveSearchReturn = {
  type: 'predictive';
  term: string;
  result: {total: number; items: PredictiveSearchItems};
  error?: string;
};

/**
 * Returns the empty state of a predictive search result to reset the search state.
 */
export function getEmptyPredictiveSearchResult(): PredictiveSearchReturn['result'] {
  return {
    total: 0,
    items: {
      products: [],
      queries: [],
    },
  };
}

interface UrlWithTrackingParams {
  baseUrl: string;
  trackingParams?: string | null;
  term: string;
}

/**
 * Appends Shopify search tracking parameters to a URL.
 */
export function urlWithTrackingParams({
  baseUrl,
  trackingParams,
  term,
}: UrlWithTrackingParams) {
  let search = new URLSearchParams({q: term}).toString();

  if (trackingParams) {
    search = `${search}&${trackingParams}`;
  }

  return `${baseUrl}?${search}`;
}
