import type {Route} from './+types/search';
import {data} from 'react-router';
import {predictiveSearchHandlers} from '~/lib/predictiveSearch.server';
import {storefrontClientContext} from '~/lib/context';
export async function loader({request, context}: Route.LoaderArgs) {
  try {
    const storefrontClient = context.get(storefrontClientContext);
    const result = await predictiveSearchHandlers.get({
      request,
      storefrontClient,
      requestContext: storefrontClient.requestContext,
    });
    if (result.type === 'json') return data(result.data);
    return data(
      {
        error:
          result.type === 'error'
            ? result.error
            : {message: 'Search is unavailable. Please try again.'},
      },
      {status: result.type === 'error' ? (result.status ?? 400) : 502},
    );
  } catch {
    return data(
      {error: 'Search is unavailable. Please try again.'},
      {status: 502},
    );
  }
}
export default function SearchResource() {
  return null;
}
