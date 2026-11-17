import type {Route} from './+types/[sitemap.xml]';
import {storefrontClientContext} from '~/lib/context';
import {getProductSitemapIndex} from '~/lib/sitemap';
export async function loader({request, context}: Route.LoaderArgs) {
  return getProductSitemapIndex(context.get(storefrontClientContext), request);
}
