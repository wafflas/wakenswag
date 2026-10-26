import {redirect} from 'react-router';
import type {Route} from './+types/products.$handle';

/**
 * Legacy Shopify product URLs → merch PDP.
 * Preserves query params (variant options, etc.).
 */
export async function loader({params, request}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('Product not found', {status: 404});
  }

  const url = new URL(request.url);
  throw redirect(`/merch/${params.handle}${url.search}`);
}
