import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {gql, type CacheInstance} from '@shopify/hydrogen';
import {
  createHydrogenRouterContext,
  envContext,
  storefrontClientContext,
} from '~/lib/context';

const query = gql(`query ContextShop {shop {id}}`);
const cache: CacheInstance = {get: () => undefined, set: () => undefined};
const executionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: (): never => {
    throw new Error('Not used by the context fixture');
  },
  props: {},
} satisfies ExecutionContext;
beforeEach(() => vi.stubGlobal('document', undefined));
afterEach(() => vi.unstubAllEnvs());

async function createContext(
  env: Env,
  headers: HeadersInit = {},
  mode = 'production',
) {
  vi.stubEnv('NODE_ENV', mode);
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValue(
      Response.json({data: {shop: {id: 'gid://shopify/Shop/1'}}}),
    );
  const context = await createHydrogenRouterContext(
    new Request('https://store.example/', {headers}),
    env,
    executionContext,
    {cache, fetch},
  );
  return {client: context.get(storefrontClientContext), context, fetch};
}

describe('production Storefront request context', () => {
  it('requires an explicit store domain in production', async () => {
    await expect(createContext({PUBLIC_STORE_DOMAIN: ''})).rejects.toThrow(
      'PUBLIC_STORE_DOMAIN is not set',
    );
  });
  it('supports a public client without a buyer-IP header', async () => {
    const {client, fetch} = await createContext({
      PUBLIC_STORE_DOMAIN: 'fixture.myshopify.com',
      PUBLIC_STOREFRONT_API_TOKEN: 'fixture-public-token',
    });
    expect((await client.graphql(query)).data?.shop.id).toBe(
      'gid://shopify/Shop/1',
    );
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('supports tokenless mock.shop reads without a buyer-IP header', async () => {
    const {client} = await createContext({
      PUBLIC_STORE_DOMAIN: 'pets.mock.shop',
    });
    expect((await client.graphql(query)).data?.shop.id).toBe(
      'gid://shopify/Shop/1',
    );
  });
  it('does not accept an arbitrary forwarded address for a private client', async () => {
    await expect(
      createContext(
        {
          PUBLIC_STORE_DOMAIN: 'fixture.myshopify.com',
          PRIVATE_STOREFRONT_API_TOKEN: 'fixture-private-token',
        },
        {'x-forwarded-for': '203.0.113.5'},
      ),
    ).rejects.toThrow(/trusted buyer IP/);
  });
  it('forwards Oxygen’s trusted buyer IP to Shopify for a private client', async () => {
    const {client, fetch} = await createContext(
      {
        PUBLIC_STORE_DOMAIN: 'fixture.myshopify.com',
        PRIVATE_STOREFRONT_API_TOKEN: 'fixture-private-token',
      },
      {'oxygen-buyer-ip': '203.0.113.7'},
    );
    await client.graphql(query);
    const request = new Request(...fetch.mock.calls[0]);
    expect(request.headers.get('Shopify-Storefront-Buyer-IP')).toBe(
      '203.0.113.7',
    );
  });
});

describe('development Storefront configuration', () => {
  it('uses tokenless mock.shop for a completely unconfigured local store', async () => {
    const {client, context, fetch} = await createContext(
      {PUBLIC_STORE_DOMAIN: ''},
      {},
      'development',
    );
    await client.graphql(query);
    expect(new Request(...fetch.mock.calls[0]).url).toContain(
      'https://mock.shop/',
    );
    expect(context.get(envContext).PUBLIC_STORE_DOMAIN).toBe('mock.shop');
  });
  it.each([
    'PRIVATE_STOREFRONT_API_TOKEN',
    'PUBLIC_STOREFRONT_API_TOKEN',
    'PUBLIC_STOREFRONT_ID',
    'PUBLIC_CHECKOUT_DOMAIN',
  ] as const)(
    'requires a domain when %s is already configured',
    async (key) => {
      await expect(
        createContext(
          {PUBLIC_STORE_DOMAIN: '', [key]: 'configured'},
          {},
          'development',
        ),
      ).rejects.toThrow('PUBLIC_STORE_DOMAIN is not set');
    },
  );
});
