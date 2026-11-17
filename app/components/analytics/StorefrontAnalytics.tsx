import {useCartAnalytics} from '@shopify/hydrogen/react';
import {AnalyticsView} from './AnalyticsView';

export function StorefrontAnalytics() {
  useCartAnalytics();
  return <AnalyticsView event="page_viewed" data={{}} />;
}
