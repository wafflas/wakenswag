import {createContext, RouterContextProvider} from 'react-router';
import {
  Cache,
  createShopifyRequestContext,
  createStorefrontClient,
  defineShopifyI18n,
  defineShopifyRouteTemplates,
  type CacheInstance,
  type CachingStrategy,
  type PublicStorefrontClient,
  type RequestScopedPrivateStorefrontClient,
} from '@shopify/hydrogen';

export type RequestStorefrontClient =
  | PublicStorefrontClient<{cache?: CachingStrategy}>
  | RequestScopedPrivateStorefrontClient<{cache?: CachingStrategy}>;
export const envContext = createContext<Env>();
export const storefrontClientContext = createContext<RequestStorefrontClient>();
export const routeTemplates = defineShopifyRouteTemplates({
  product: '/swag/:productHandle',
  productInCollection: '/:collectionHandle/:productHandle',
  policy: '/info/:policyHandle',
});
export const storefrontI18n = defineShopifyI18n({
  defaultLocale: {country: 'US', language: 'EN'},
});
// Preserve the classic client's implicit policy explicitly in the new client.
export const publicDataCache = Cache({maxAge: 1, staleWhileRevalidate: 86399});

export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
  options: {fetch?: typeof globalThis.fetch; cache?: CacheInstance} = {},
) {
  const hasStoreConfiguration = Boolean(
    env.PRIVATE_STOREFRONT_API_TOKEN ||
    env.PUBLIC_STOREFRONT_API_TOKEN ||
    env.PUBLIC_STOREFRONT_ID ||
    env.PUBLIC_CHECKOUT_DOMAIN,
  );
  const storeDomain =
    env.PUBLIC_STORE_DOMAIN ||
    (process.env.NODE_ENV === 'development' && !hasStoreConfiguration
      ? 'mock.shop'
      : undefined);
  if (!storeDomain) throw new Error('PUBLIC_STORE_DOMAIN is not set');
  const cache = options.cache ?? (await caches.open('hydrogen-2026-10'));
  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const buyerIp =
    request.headers.get('oxygen-buyer-ip') ||
    (process.env.NODE_ENV !== 'production' ? '127.0.0.1' : undefined);
  const buyerContext = buyerIp
    ? createShopifyRequestContext({request, i18n: storefrontI18n, buyerIp})
    : undefined;
  const requestContext =
    buyerContext ??
    createShopifyRequestContext({request, i18n: storefrontI18n});
  const config = {
    storeDomain,
    storefrontId: env.PUBLIC_STOREFRONT_ID,
    cache: cache as unknown as CacheInstance,
    waitUntil,
    fetch: options.fetch,
  };
  let storefrontClient: RequestStorefrontClient;
  if (env.PRIVATE_STOREFRONT_API_TOKEN) {
    if (!buyerContext)
      throw new Error(
        'A trusted buyer IP is required for the private Storefront API client',
      );
    storefrontClient = createStorefrontClient({
      type: 'private',
      requestContext: buyerContext,
      config: {
        ...config,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
      },
    });
  } else {
    storefrontClient = createStorefrontClient({
      type: 'public',
      requestContext,
      config: {
        ...config,
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN || undefined,
      },
    });
  }
  const context = new RouterContextProvider();
  context.set(envContext, {...env, PUBLIC_STORE_DOMAIN: storeDomain});
  context.set(storefrontClientContext, storefrontClient);
  return context;
}
