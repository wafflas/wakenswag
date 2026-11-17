import {RouterContextProvider} from 'react-router';
import {
  createShopifyRequestContext,
  createStorefrontClient,
} from '@shopify/hydrogen';
import {vi} from 'vitest';
import {
  envContext,
  storefrontClientContext,
  storefrontI18n,
} from '~/lib/context';

/** Real typed loader context, with only GraphQL replaced at the API boundary. */
export function createRouteContext(
  query = vi.fn(),
  env: Env = {PUBLIC_STORE_DOMAIN: 'fixture.myshopify.com'},
) {
  const requestContext = createShopifyRequestContext({
    request: new Request('https://store.example/'),
    i18n: storefrontI18n,
  });
  const client = createStorefrontClient({
    type: 'public',
    requestContext,
    config: {storeDomain: env.PUBLIC_STORE_DOMAIN},
  });
  vi.spyOn(client, 'graphql').mockImplementation(async (...args) => ({
    data: await query(...args),
    headers: new Headers(),
  }));
  const context = new RouterContextProvider();
  context.set(storefrontClientContext, client);
  context.set(envContext, env);
  return {context, client, query};
}
