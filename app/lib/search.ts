import type {PredictiveSearchData} from './predictiveSearch.server';

export type SearchProductNode =
  PredictiveSearchData['items']['products'][number];

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
