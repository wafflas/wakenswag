import {publicDataCache, storefrontClientContext} from '~/lib/context';
import {describe, expect, it, vi} from 'vitest';
import {cartHandlers} from '~/lib/cartHandlers.server';
import {createRouteContext} from '../fixtures/routeContext';
import {loader as searchLoader} from '~/routes/search';
import {loader as swagLoader} from '~/routes/swag';
import {loader as drumkitsLoader} from '~/routes/drumkits';
import {loadProductDetail} from '~/lib/productDetail';
import {loader as productLoader} from '~/routes/swag.$handle';
import {loader as drumkitProductLoader} from '~/routes/drumkits.$handle';
import {
  createCart,
  createProduct,
  createProductCard,
  createDrumkitCart,
} from '../fixtures/catalog';

function createArgs(path = '/', inputs?: unknown, redirectTo?: string) {
  const form = new FormData();
  if (inputs) form.set('cartFormInput', JSON.stringify(inputs));
  if (redirectTo) form.set('redirectTo', redirectTo);
  const query = vi
    .fn()
    .mockResolvedValue({products: {nodes: []}, collection: null});
  const {context: provider} = createRouteContext(query);
  const context = {storefront: {query}};
  const args = {
    request: new Request(
      `https://store.example${path}`,
      inputs ? {method: 'POST', body: form} : undefined,
    ),
    context: provider,
    params: {},
  };
  return {args, context};
}

describe('cart handlers', () => {
  async function mutate(
    body: unknown,
    cart = createCart(),
    options: {
      cookie?: string;
      native?: boolean;
      referer?: string;
      fail?: boolean;
    } = {},
  ) {
    const query = vi.fn(
      async (
        document: string,
        config: {variables: Record<string, unknown>},
      ) => {
        if (options.fail) throw new Error('private upstream detail');
        if (document.includes('mutation')) {
          const key = document.match(
            /\b(cartCreate|cartLinesAdd|cartLinesUpdate|cartLinesRemove|cartNoteUpdate|cartDiscountCodesUpdate|cartAttributesUpdate)\(/,
          )?.[1];
          if (!key) throw new Error('Unexpected fixture cart mutation');
          const corrected =
            key === 'cartLinesUpdate' &&
            (config.variables.lines as Array<{quantity: number}>)[0]
              ?.quantity === 1;
          return {
            [key]: {
              cart: corrected ? createDrumkitCart() : cart,
              userErrors: [],
              warnings: [],
            },
          };
        }
        return {cart: createDrumkitCart()};
      },
    );
    const {client} = createRouteContext(query);
    const headers = new Headers({
      'content-type': options.native
        ? 'application/x-www-form-urlencoded'
        : 'application/json',
    });
    if (options.cookie) headers.set('cookie', options.cookie);
    if (options.referer) headers.set('referer', options.referer);
    const request = new Request('https://store.example/api/cart', {
      method: 'POST',
      headers,
      body: options.native ? String(body) : JSON.stringify(body),
    });
    return {
      result: await cartHandlers.post({
        request,
        storefrontClient: client,
        requestContext: client.requestContext,
      }),
      query,
    };
  }
  it.each(['add', 'update', 'remove'] as const)(
    'dispatches %s through the new Shopify handlers',
    async (intent) => {
      const lines =
        intent === 'add'
          ? [{merchandiseId: 'gid://shopify/ProductVariant/101', quantity: 2}]
          : [{id: 'line-1', quantity: intent === 'remove' ? 0 : 2}];
      const {result, query} = await mutate({lines}, createCart(), {
        cookie: 'cart=fixture',
      });
      expect(result.type).toBe('json');
      expect(query.mock.calls[0][0]).toContain(
        intent === 'add'
          ? 'cartLinesAdd('
          : intent === 'update'
            ? 'cartLinesUpdate('
            : 'cartLinesRemove(',
      );
      expect(new Headers(result.headers).get('Cache-Control')).toMatch(
        /private|no-store/,
      );
    },
  );
  it('sets a cart cookie when the first item creates a cart', async () => {
    const {result} = await mutate({
      lines: [{merchandiseId: 'gid://shopify/ProductVariant/101', quantity: 1}],
    });
    expect(new Headers(result.headers).get('Set-Cookie')).toContain(
      'cart=fixture',
    );
  });
  it.each([false, true])(
    'enforces one-copy drumkits for native form = %s',
    async (native) => {
      const body = native
        ? 'intent=add&merchandiseId=gid%3A%2F%2Fshopify%2FProductVariant%2F201&quantity=4'
        : {
            lines: [
              {merchandiseId: 'gid://shopify/ProductVariant/201', quantity: 4},
            ],
          };
      const {result, query} = await mutate(body, createDrumkitCart(4), {
        native,
      });
      expect(
        query.mock.calls.some(
          ([document, config]) =>
            document.includes('cartLinesUpdate(') &&
            (config.variables.lines as Array<{quantity: number}>)[0]
              .quantity === 1,
        ),
      ).toBe(true);
      expect(result.type).toBe(native ? 'redirect' : 'json');
      if (result.type === 'json')
        expect(
          (result.data as {cart: ReturnType<typeof createCart>}).cart
            .totalQuantity,
        ).toBe(1);
    },
  );
  it.each(['https://evil.example/', 'https://store.example/swag?Size=Large'])(
    'constrains native redirects to the storefront origin: %s',
    async (referer) => {
      const {result} = await mutate(
        'intent=add&merchandiseId=gid%3A%2F%2Fshopify%2FProductVariant%2F101&quantity=1',
        createCart(),
        {native: true, referer},
      );
      expect(result).toMatchObject({
        type: 'redirect',
        location: referer.includes('evil') ? '/' : '/swag?Size=Large',
      });
    },
  );
  it.each([
    {body: {note: 'Gift order'}, operation: 'cartNoteUpdate'},
    {body: {note: ''}, operation: 'cartNoteUpdate'},
    {body: {discountCodes: ['SAVE']}, operation: 'cartDiscountCodesUpdate'},
    {body: {discountCodes: []}, operation: 'cartDiscountCodesUpdate'},
    {
      body: {attributes: [{key: 'gift', value: 'yes'}]},
      operation: 'cartAttributesUpdate',
    },
    {body: {attributes: []}, operation: 'cartAttributesUpdate'},
  ])(
    'accepts the SDK JSON contract for $operation: $body',
    async ({body, operation}) => {
      const {result, query} = await mutate(body, createCart(), {
        cookie: 'cart=fixture',
      });
      expect(result.type).toBe('json');
      expect(query.mock.calls[0][0]).toContain(`${operation}(`);
      expect(query.mock.calls[0][1].variables).toMatchObject(body);
      expect(new Headers(result.headers).get('Cache-Control')).toMatch(
        /private|no-store/,
      );
    },
  );
  it.each([
    {body: 'intent=note-update&note=Gift+order', operation: 'cartNoteUpdate'},
    {
      body: 'intent=discount-apply&discountCode=SAVE',
      operation: 'cartDiscountCodesUpdate',
    },
    {body: 'intent=attributes-update', operation: 'cartAttributesUpdate'},
  ])(
    'accepts native metadata forms for $operation',
    async ({body, operation}) => {
      const {result, query} = await mutate(body, createCart(), {
        native: true,
        cookie: 'cart=fixture',
        referer: 'https://store.example/swag',
      });
      expect(result).toMatchObject({type: 'redirect', location: '/swag'});
      expect(
        query.mock.calls.some(([document]) =>
          document.includes(`${operation}(`),
        ),
      ).toBe(true);
      expect(new Headers(result.headers).get('Cache-Control')).toMatch(
        /private|no-store/,
      );
    },
  );
  it.each([
    null,
    [],
    {},
    {intent: 'unknown'},
    {note: 123},
    {discountCodes: [123]},
    {attributes: [{key: '', value: 'yes'}]},
    {lines: []},
    {lines: 'invalid'},
    {note: 'Gift order', discountCodes: ['SAVE']},
  ])(
    'rejects malformed or mixed SDK requests without querying Shopify: %j',
    async (body) => {
      const {result, query} = await mutate(body);
      expect(result.type).toBe('error');
      if (result.type === 'error') expect(result.status ?? 400).toBe(400);
      expect(query).not.toHaveBeenCalled();
    },
  );
  it('returns a recoverable upstream failure without private details', async () => {
    const {result} = await mutate(
      {
        lines: [
          {merchandiseId: 'gid://shopify/ProductVariant/101', quantity: 1},
        ],
      },
      createCart(),
      {fail: true},
    );
    expect(result).toMatchObject({
      type: 'error',
      status: 502,
      error: {message: expect.stringMatching(/try again/i)},
    });
    expect(JSON.stringify(result)).not.toContain('private upstream detail');
  });
});

describe('predictive search loader', () => {
  it('does not query Shopify for whitespace', async () => {
    const {args, context} = createArgs('/search?q=%20%20');
    const result = await searchLoader(
      args as unknown as Parameters<typeof searchLoader>[0],
    );
    expect(result.data).toMatchObject({term: '', total: 0});
    expect(context.storefront.query).not.toHaveBeenCalled();
  });
  it.each(['-1', '0', '1.5', '9999', 'NaN'])(
    'bounds an invalid limit %s',
    async (limit) => {
      const {args, context} = createArgs(`/search?q=tee&limit=${limit}`);
      context.storefront.query.mockResolvedValue({
        predictiveSearch: {products: [], queries: []},
      });
      await searchLoader(args as unknown as Parameters<typeof searchLoader>[0]);
      const requested = context.storefront.query.mock.calls[0][1].variables
        .limit as number;
      expect(Number.isInteger(requested)).toBe(true);
      expect(requested).toBeGreaterThanOrEqual(1);
      expect(requested).toBeLessThanOrEqual(10);
    },
  );
  it('distinguishes an upstream failure from no matching products', async () => {
    const {args, context} = createArgs('/search?q=tee');
    context.storefront.query.mockRejectedValue(new Error('upstream failure'));
    const response = await searchLoader(
      args as unknown as Parameters<typeof searchLoader>[0],
    );
    expect(response).toHaveProperty(
      'data.error.message',
      expect.stringMatching(/try again/i),
    );
  });
});

describe('catalog pagination and product loading', () => {
  it.each(['swag', 'drumkits'] as const)(
    'returns real collection metadata for %s analytics',
    async (handle) => {
      const {args, context} = createArgs(`/${handle}`);
      const collection = {
        id: 'gid://shopify/Collection/42',
        handle,
        title: handle,
        description: '',
        products: {
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      };
      context.storefront.query.mockResolvedValue({collection});
      const result =
        handle === 'swag'
          ? await swagLoader(
              args as unknown as Parameters<typeof swagLoader>[0],
            )
          : await drumkitsLoader(
              args as unknown as Parameters<typeof drumkitsLoader>[0],
            );
      expect(result.collectionAnalytics).toEqual({id: collection.id, handle});
    },
  );

  it.each(['swag', 'drumkits'] as const)(
    'omits analytics for a missing %s collection',
    async (handle) => {
      const {args} = createArgs(`/${handle}`);
      const result =
        handle === 'swag'
          ? await swagLoader(
              args as unknown as Parameters<typeof swagLoader>[0],
            )
          : await drumkitsLoader(
              args as unknown as Parameters<typeof drumkitsLoader>[0],
            );
      expect(result.collectionAnalytics).toBeNull();
    },
  );

  it('passes the next cursor to the Swag query', async () => {
    const {args, context} = createArgs('/swag?cursor=cursor-12&direction=next');
    await swagLoader(args as unknown as Parameters<typeof swagLoader>[0]);
    expect(context.storefront.query).toHaveBeenCalledWith(expect.any(String), {
      cache: publicDataCache,
      variables: {handle: 'swag', first: 12, endCursor: 'cursor-12'},
    });
  });
  it('uses only the Swag collection even when unscoped products are also returned', async () => {
    const {args, context} = createArgs('/swag');
    const products = {
      nodes: [createProductCard()],
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
    context.storefront.query.mockResolvedValue({
      collection: {id: 'gid://shopify/Collection/42', handle: 'swag', products},
      products: {nodes: [...products.nodes, createProductCard(2)]},
    });
    const result = await swagLoader(
      args as unknown as Parameters<typeof swagLoader>[0],
    );
    expect(result.products).toEqual(products);
  });
  it('returns an empty listing when the Swag collection is missing or unavailable', async () => {
    const {args} = createArgs('/swag');
    const result = await swagLoader(
      args as unknown as Parameters<typeof swagLoader>[0],
    );
    expect(result.products).toEqual({
      nodes: [],
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: null,
        endCursor: null,
      },
    });
  });
  it.each([
    ['', 6],
    ['&pageSize=4', 4],
    ['&pageSize=1000', 6],
  ])(
    'passes the previous cursor with the supported drumkits page size %s',
    async (pageSize, count) => {
      const {args, context} = createArgs(
        `/drumkits?cursor=cursor-12&direction=previous${pageSize}`,
      );
      const result = await drumkitsLoader(
        args as unknown as Parameters<typeof drumkitsLoader>[0],
      );
      expect(context.storefront.query).toHaveBeenCalledWith(
        expect.any(String),
        {
          cache: publicDataCache,
          variables: {
            handle: 'drumkits',
            last: count,
            startCursor: 'cursor-12',
          },
        },
      );
      expect(result.collection.products.nodes).toEqual([]);
    },
  );
  it('loads selected options server-side', async () => {
    const {args, context} = createArgs('/swag/fixture-tee?Size=Large');
    context.storefront.query.mockResolvedValue({product: createProduct()});
    await loadProductDetail({
      handle: 'fixture-tee',
      request: args.request,
      storefront: args.context.get(storefrontClientContext),
    });
    expect(context.storefront.query).toHaveBeenCalledWith(expect.any(String), {
      cache: publicDataCache,
      variables: {
        handle: 'fixture-tee',
        selectedOptions: [{name: 'Size', value: 'Large'}],
      },
    });
  });
  it('returns 404 for a missing product', async () => {
    const {args, context} = createArgs('/swag/missing');
    context.storefront.query.mockResolvedValue({product: null});
    await expect(
      loadProductDetail({
        handle: 'missing',
        request: args.request,
        storefront: args.context.get(storefrontClientContext),
      }),
    ).rejects.toMatchObject({status: 404});
  });
});

describe('product section routing', () => {
  it('redirects a drumkit out of Swag and preserves search tracking', async () => {
    const {args, context} = createArgs(
      '/swag/drumkit-vol-002?q=drum&_pos=2&_psid=session',
    );
    Object.assign(args.params, {handle: 'drumkit-vol-002'});
    context.storefront.query.mockResolvedValue({
      product: createProduct({
        handle: 'drumkit-vol-002',
        productType: '',
        collections: {nodes: [{handle: 'drumkits'}]},
      }),
    });
    const response: unknown = await productLoader(
      args as unknown as Parameters<typeof productLoader>[0],
    ).catch((error: unknown) => error);
    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) throw new Error('Expected a redirect');
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/drumkits/drumkit-vol-002?q=drum&_pos=2&_psid=session',
    );
  });

  it('gives drumkits their own canonical URL', async () => {
    const {args, context} = createArgs('/drumkits/drumkit-vol-002');
    Object.assign(args.params, {handle: 'drumkit-vol-002'});
    context.storefront.query.mockResolvedValue({
      product: createProduct({
        handle: 'drumkit-vol-002',
        productType: '',
        collections: {nodes: [{handle: 'drumkits'}]},
      }),
    });
    const result = await drumkitProductLoader(
      args as unknown as Parameters<typeof drumkitProductLoader>[0],
    );
    expect(result.productUrl).toBe(
      'https://store.example/drumkits/drumkit-vol-002',
    );
  });
});
