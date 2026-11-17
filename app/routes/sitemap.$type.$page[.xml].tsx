import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {storefrontClientContext} from '~/lib/context';
import {getProductSitemap} from '~/lib/sitemap';
export async function loader({request, context, params}: Route.LoaderArgs) {
  return getProductSitemap(
    context.get(storefrontClientContext),
    request,
    params,
  );
}
