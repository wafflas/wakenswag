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

describe('root consent configuration', () => {
  it.each([
    {
      checkoutDomain: 'checkout.example.test',
      expected: 'checkout.example.test',
    },
    {checkoutDomain: undefined, expected: 'fixture.myshopify.com'},
    {checkoutDomain: '', expected: 'fixture.myshopify.com'},
  ])(
    'uses $expected when checkoutDomain is "$checkoutDomain"',
    async ({checkoutDomain, expected}) => {
      const result = loader({
        request: new Request('http://localhost:3000/info'),
        context: {
          env: {
            PUBLIC_CHECKOUT_DOMAIN: checkoutDomain,
            PUBLIC_STORE_DOMAIN: 'fixture.myshopify.com',
            PUBLIC_STOREFRONT_API_TOKEN: 'fixture-public-token',
            PUBLIC_STOREFRONT_ID: '0',
          },
          cart: {get: vi.fn().mockResolvedValue(null)},
          storefront: {
            i18n: {country: 'US', language: 'EN'},
            CacheLong: vi.fn(),
            query: vi.fn().mockResolvedValue({
              shop: {id: 'gid://shopify/Shop/1'},
              localization: {
                language: {isoCode: 'EN'},
                country: {currency: {isoCode: 'USD'}},
              },
            }),
          },
        },
      } as unknown as Parameters<typeof loader>[0]);

      expect(result.consent.checkoutDomain).toBe(expected);
      expect(result.consent.withPrivacyBanner).toBe(false);
      await result.shop;
    },
  );
});
