import {describe, expect, it, vi} from 'vitest';
import {CartForm} from '@shopify/hydrogen';
import {action as cartAction} from '~/routes/cart';
import {loader as searchLoader} from '~/routes/search';
import {loader as merchLoader} from '~/routes/merch';
import {loader as drumkitsLoader} from '~/routes/drumkits';
import {loader as discountLoader} from '~/routes/discount.$code';
import {loader as permalinkLoader} from '~/routes/cart.$lines';
import {loadProductDetail} from '~/lib/productDetail';
import {loader as productLoader} from '~/routes/merch.$handle';
import {loader as drumkitProductLoader} from '~/routes/drumkits.$handle';
import {
  createCart,
  createProduct,
  createProductCard,
} from '../fixtures/catalog';

function createArgs(path = '/', inputs?: unknown, redirectTo?: string) {
  const form = new FormData();
  if (inputs) form.set('cartFormInput', JSON.stringify(inputs));
  if (redirectTo) form.set('redirectTo', redirectTo);
  const query = vi
    .fn()
    .mockResolvedValue({products: {nodes: []}, collection: null});
  const result = {cart: createCart(), errors: [], warnings: []};
  const context = {
    storefront: {query},
    cart: {
      addLines: vi.fn().mockResolvedValue(result),
      updateLines: vi.fn().mockResolvedValue(result),
      removeLines: vi.fn().mockResolvedValue(result),
      updateDiscountCodes: vi.fn().mockResolvedValue(result),
      create: vi.fn().mockResolvedValue(result),
      setCartId: vi
        .fn()
        .mockReturnValue(new Headers({'Set-Cookie': 'cart=fixture; HttpOnly'})),
    },
  };
  const args = {
    request: new Request(
      `https://store.example${path}`,
      inputs ? {method: 'POST', body: form} : undefined,
    ),
    context,
    params: {code: 'SAVE', lines: '101:2'},
  };
  return {args, context};
}

describe('cart action', () => {
  it.each([
    [
      CartForm.ACTIONS.LinesAdd,
      {
        lines: [
          {merchandiseId: 'gid://shopify/ProductVariant/101', quantity: 2},
        ],
      },
      'addLines',
    ],
    [
      CartForm.ACTIONS.LinesUpdate,
      {lines: [{id: 'line-1', quantity: 2}]},
      'updateLines',
    ],
    [CartForm.ACTIONS.LinesRemove, {lineIds: ['line-1']}, 'removeLines'],
  ] as const)(
    'dispatches %s and preserves the cart cookie',
    async (action, inputs, method) => {
      const {args, context} = createArgs('/cart', {action, inputs});
      const response = await cartAction(
        args as unknown as Parameters<typeof cartAction>[0],
      );
      expect(context.cart[method]).toHaveBeenCalledOnce();
      expect(response.data.cart?.totalQuantity).toBe(1);
      expect(new Headers(response.init?.headers).get('Set-Cookie')).toContain(
        'cart=fixture',
      );
    },
  );
  it('rejects an external redirect but keeps a successful mutation response', async () => {
    const {args} = createArgs(
      '/cart',
      {action: CartForm.ACTIONS.LinesRemove, inputs: {lineIds: ['line-1']}},
      'https://evil.example',
    );
    const response = await cartAction(
      args as unknown as Parameters<typeof cartAction>[0],
    );
    expect(new Headers(response.init?.headers).get('Location')).toBeNull();
    expect(response.init?.status).toBe(200);
  });
  it('keeps a local redirect with a query string', async () => {
    const {args} = createArgs(
      '/cart',
      {action: CartForm.ACTIONS.LinesRemove, inputs: {lineIds: ['line-1']}},
      '/merch?Size=Large',
    );
    const response = await cartAction(
      args as unknown as Parameters<typeof cartAction>[0],
    );
    expect(new Headers(response.init?.headers).get('Location')).toBe(
      '/merch?Size=Large',
    );
    expect(response.init?.status).toBe(303);
  });
  it('returns a useful failure when the cart API is unreachable', async () => {
    const {args, context} = createArgs('/cart', {
      action: CartForm.ACTIONS.LinesAdd,
      inputs: {
        lines: [
          {merchandiseId: 'gid://shopify/ProductVariant/101', quantity: 1},
        ],
      },
    });
    context.cart.addLines.mockRejectedValue(
      new Error('private upstream detail'),
    );
    const response = await cartAction(
      args as unknown as Parameters<typeof cartAction>[0],
    );
    expect(response.init?.status).toBe(502);
    expect(response.data.errors?.[0].message).toMatch(/try again/i);
    expect(JSON.stringify(response.data)).not.toContain(
      'private upstream detail',
    );
  });
});

describe('predictive search loader', () => {
  it('does not query Shopify for whitespace', async () => {
    const {args, context} = createArgs('/search?q=%20%20');
    const result = await searchLoader(
      args as unknown as Parameters<typeof searchLoader>[0],
    );
    expect(result.term).toBe('');
    expect(result.result.total).toBe(0);
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
      'error',
      expect.stringMatching(/try again/i),
    );
  });
});

describe('catalog pagination and product loading', () => {
  it('passes the next cursor to the merch query', async () => {
    const {args, context} = createArgs(
      '/merch?cursor=cursor-12&direction=next',
    );
    await merchLoader(args as unknown as Parameters<typeof merchLoader>[0]);
    expect(context.storefront.query).toHaveBeenCalledWith(expect.any(String), {
      variables: {handle: 'merch', first: 12, endCursor: 'cursor-12'},
    });
  });
  it('uses only the merch collection even when unscoped products are also returned', async () => {
    const {args, context} = createArgs('/merch');
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
      collection: {products},
      products: {nodes: [...products.nodes, createProductCard(2)]},
    });
    const result = await merchLoader(
      args as unknown as Parameters<typeof merchLoader>[0],
    );
    expect(result.products).toEqual(products);
  });
  it('returns an empty listing when the merch collection is missing or unavailable', async () => {
    const {args} = createArgs('/merch');
    const result = await merchLoader(
      args as unknown as Parameters<typeof merchLoader>[0],
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
  it('passes the previous cursor to the drumkits query and retains the empty fallback', async () => {
    const {args, context} = createArgs(
      '/drumkits?cursor=cursor-12&direction=previous',
    );
    const result = await drumkitsLoader(
      args as unknown as Parameters<typeof drumkitsLoader>[0],
    );
    expect(context.storefront.query).toHaveBeenCalledWith(expect.any(String), {
      variables: {handle: 'drumkits', last: 6, startCursor: 'cursor-12'},
    });
    expect(result.collection.products.nodes).toEqual([]);
  });
  it('loads selected options server-side', async () => {
    const {args, context} = createArgs('/merch/fixture-tee?Size=Large');
    context.storefront.query.mockResolvedValue({product: createProduct()});
    await loadProductDetail({
      handle: 'fixture-tee',
      request: args.request,
      storefront: context.storefront as unknown as Parameters<
        typeof loadProductDetail
      >[0]['storefront'],
    });
    expect(context.storefront.query).toHaveBeenCalledWith(expect.any(String), {
      variables: {
        handle: 'fixture-tee',
        selectedOptions: [{name: 'Size', value: 'Large'}],
      },
    });
  });
  it('returns 404 for a missing product', async () => {
    const {args, context} = createArgs('/merch/missing');
    context.storefront.query.mockResolvedValue({product: null});
    await expect(
      loadProductDetail({
        handle: 'missing',
        request: args.request,
        storefront: context.storefront as unknown as Parameters<
          typeof loadProductDetail
        >[0]['storefront'],
      }),
    ).rejects.toMatchObject({status: 404});
  });
});

describe('product section routing', () => {
  it('redirects a drumkit out of Merch and preserves search tracking', async () => {
    const {args, context} = createArgs(
      '/merch/drumkit-vol-002?q=drum&_pos=2&_psid=session',
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

describe('discount and cart permalinks', () => {
  it('rejects scheme-only discount redirects', async () => {
    const {args} = createArgs('/discount/SAVE?redirect=https:evil.example');
    const response = await discountLoader(
      args as unknown as Parameters<typeof discountLoader>[0],
    );
    expect(response.headers.get('Location')).toBe('/');
  });
  it('handles missing cart data from a discount mutation', async () => {
    const {args, context} = createArgs('/discount/SAVE');
    context.cart.updateDiscountCodes.mockResolvedValue({
      cart: null,
      errors: [{message: 'Invalid code'}],
    });
    await expect(
      discountLoader(args as unknown as Parameters<typeof discountLoader>[0]),
    ).rejects.toMatchObject({status: 400});
    expect(context.cart.setCartId).not.toHaveBeenCalled();
  });
  it.each(['101:0', '101:-1', '101:1.5', '101:2junk', 'abc:2', '101:NaN'])(
    'rejects malformed cart permalink %s before creating a cart',
    async (lines) => {
      const {args, context} = createArgs('/cart/invalid');
      args.params.lines = lines;
      await expect(
        permalinkLoader(
          args as unknown as Parameters<typeof permalinkLoader>[0],
        ),
      ).rejects.toMatchObject({status: 400});
      expect(context.cart.create).not.toHaveBeenCalled();
    },
  );
  it('hands valid cart permalinks to Shopify checkout with a cookie', async () => {
    const {args, context} = createArgs('/cart/101:2?discount=SAVE');
    const response = await permalinkLoader(
      args as unknown as Parameters<typeof permalinkLoader>[0],
    );
    expect(context.cart.create).toHaveBeenCalledWith({
      lines: [{merchandiseId: 'gid://shopify/ProductVariant/101', quantity: 2}],
      discountCodes: ['SAVE'],
    });
    expect(response.headers.get('Location')).toBe(
      'https://checkout.example.test/cart/fixture',
    );
    expect(response.headers.get('Set-Cookie')).toContain('cart=fixture');
  });
});
