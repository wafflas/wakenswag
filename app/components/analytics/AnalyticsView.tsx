import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router';
import type {AnalyticsEventMap} from '@shopify/hydrogen';

type ViewEvent =
  | 'page_viewed'
  | 'product_viewed'
  | 'collection_viewed'
  | 'search_viewed'
  | 'cart_viewed';

/** Publish a settled view once, including query-only navigation such as pagination. */
export function AnalyticsView<E extends ViewEvent>({
  event,
  data,
}: {
  event: E;
  data: AnalyticsEventMap[E];
}) {
  const {pathname, search} = useLocation();
  const currentData = useRef(data);
  currentData.current = data;
  const key = JSON.stringify(data);
  useEffect(() => {
    // Allow responsive URL normalization to finish before recording the view.
    // Cleanup also cancels React StrictMode's first development effect.
    const frame = requestAnimationFrame(() => {
      window.Shopify?.analytics?.publish(event, currentData.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [event, key, pathname, search]);
  return null;
}
