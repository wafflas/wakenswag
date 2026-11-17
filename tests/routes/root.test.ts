import {createRouteContext} from '../fixtures/routeContext';
import {describe, expect, it, vi} from 'vitest';
import {loader, meta} from '~/root';

describe('root error metadata', () => {
  it('leaves normal page metadata to the matched route', () => {
    expect(meta({error: null} as Parameters<typeof meta>[0])).toEqual([]);
  });

  it.each([
    {
      error: {status: 404, statusText: 'Not Found', internal: false, data: ''},
      title: 'Wake N Swag | 404',
    },
    {
      error: {
        status: 500,
        statusText: 'Server Error',
        internal: false,
        data: '',
      },
      title: 'Wake N Swag | Error',
    },
    {error: new Error('Private server details'), title: 'Wake N Swag | Error'},
  ])('sets "$title" and noindex for a handled error', ({error, title}) => {
    const descriptors = meta({error} as Parameters<typeof meta>[0]);
    expect(descriptors).toContainEqual({title});
    expect(descriptors).toContainEqual({name: 'robots', content: 'noindex'});
  });
});

describe('root storefront configuration', () => {
  it.each(['0', '123', undefined])(
    'passes storefront ID %s and the request locale to ShopifyScripts',
    async (storefrontId) => {
      const query = vi.fn().mockResolvedValue({
        shop: {id: 'gid://shopify/Shop/1'},
        localization: {country: {currency: {isoCode: 'EUR'}}},
      });
      const {context} = createRouteContext(query, {
        PUBLIC_STORE_DOMAIN: 'fixture.myshopify.com',
        PUBLIC_STOREFRONT_ID: storefrontId,
      });
      const result = await loader({
        request: new Request('https://store.example/info'),
        context,
      } as unknown as Parameters<typeof loader>[0]);
      expect(result.shop).toEqual({
        shopId: 'gid://shopify/Shop/1',
        storefrontId: storefrontId ?? '',
        myshopifyDomain: 'fixture.myshopify.com',
      });
      expect(result.i18n).toMatchObject({
        language: 'EN',
        country: 'US',
        currency: 'EUR',
      });
      expect(await result.cart).toEqual({cart: null});
    },
  );
});
