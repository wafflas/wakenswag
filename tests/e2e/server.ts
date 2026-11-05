// A separate worker entry: production server.ts never imports this module.
import * as build from 'virtual:react-router/server-build';
import {createRequestHandler} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';
import {
  createCart,
  createProduct,
  createProductCard,
  createVariant,
} from '../fixtures/catalog';

const carts = new Map<string, ReturnType<typeof createCart>>();
const catalog = Array.from({length: 25}, (_, index) =>
  createProductCard(index + 1),
);

function productConnection(
  variables: Record<string, unknown>,
  products = catalog,
) {
  const cursor = variables.endCursor ?? variables.startCursor;
  const cursorIndex = Number(cursor ?? -1);
  const start = variables.last
    ? Math.max(0, cursorIndex - Number(variables.last))
    : cursorIndex + 1;
  const nodes = products.slice(
    start,
    start + Number(variables.first ?? variables.last ?? 12),
  );
  return {
    nodes,
    pageInfo: {
      hasPreviousPage: start > 0,
      hasNextPage: start + nodes.length < products.length,
      startCursor: String(start),
      endCursor: String(start + nodes.length - 1),
    },
  };
}

function query(
  queryText: string,
  options?: {variables?: Record<string, unknown>},
  pathname = '/',
) {
  const variables = options?.variables ?? {};
  if (queryText.includes('query ShopData'))
    return Promise.resolve({
      shop: {id: 'gid://shopify/Shop/1'},
      localization: {
        language: {isoCode: 'EN'},
        country: {currency: {isoCode: 'EUR'}},
      },
    });
  if (queryText.includes('query Header'))
    return Promise.resolve({
      shop: {
        id: 'gid://shopify/Shop/1',
        name: 'Fixture shop',
        description: '',
        primaryDomain: {url: 'https://fixture.myshopify.com'},
        brand: null,
      },
      menu: null,
    });
  if (queryText.includes('query Footer')) return Promise.resolve({menu: null});
  if (queryText.includes('query FeaturedCollection'))
    return Promise.resolve({collections: {nodes: []}});
  if (queryText.includes('query RecommendedProducts'))
    return Promise.resolve({products: {nodes: catalog.slice(0, 4)}});
  if (queryText.includes('query Merch'))
    return Promise.resolve({
      collection:
        variables.handle === 'merch'
          ? {products: productConnection(variables)}
          : null,
    });
  if (queryText.includes('query Drumkits')) {
    const products = productConnection(variables, catalog.slice(0, 24));
    return Promise.resolve({
      collection: {
        id: 'collection-1',
        title: 'Drumkits',
        handle: 'drumkits',
        description: 'Fixture drumkits',
        products: {
          ...products,
          nodes: products.nodes.map((product) => ({
            ...product,
            description:
              '808s so distorted your speakers might file a lawsuit.\nScientifically proven to NOT make you a better producer.',
          })),
        },
      },
    });
  }
  if (queryText.includes('query PredictiveSearch')) {
    if (variables.term === 'outage')
      return Promise.reject(new Error('Simulated Storefront outage'));
    const products =
      variables.term === 'nothing'
        ? []
        : variables.term === 'drum'
          ? [
              {
                ...catalog[0],
                title: 'Fixture Drumkit',
                handle: 'fixture-drumkit',
                productType: '',
                collections: {nodes: [{handle: 'drumkits'}]},
                availableForSale: true,
                trackingParameters:
                  '_pos=2&_psid=fixture-session&_psq=drum&_ss=e',
                selectedOrFirstAvailableVariant: createVariant(),
              },
            ]
          : [
              {
                ...catalog[0],
                title:
                  variables.term === 'old'
                    ? 'Old Fixture Tee'
                    : catalog[0].title,
                productType: 'Merch',
                collections: {nodes: [{handle: 'merch'}]},
                availableForSale: true,
                trackingParameters: 'position=1',
                selectedOrFirstAvailableVariant: createVariant(),
              },
            ];
    return Promise.resolve({predictiveSearch: {products, queries: []}});
  }
  if (queryText.includes('query Product(')) {
    const handle = String(variables.handle);
    if (handle === 'missing') return Promise.resolve({product: null});
    const options = variables.selectedOptions as Array<{
      name: string;
      value: string;
    }>;
    const size =
      options.find((option) => option.name === 'Size')?.value ?? 'Small';
    const isDrumkit =
      pathname.startsWith('/drumkits/') || handle === 'fixture-drumkit';
    const product = createProduct({
      handle,
      title:
        handle === 'fixture-drumkit'
          ? 'Fixture Drumkit'
          : (catalog.find((product) => product.handle === handle)?.title ??
            'Fixture Tee'),
      productType: '',
      collections: {nodes: [{handle: isDrumkit ? 'drumkits' : 'merch'}]},
      selectedOrFirstAvailableVariant:
        handle === 'no-variant'
          ? null
          : createVariant(size, handle !== 'sold-out'),
    });
    return Promise.resolve({product});
  }
  throw new Error(
    'Unexpected fixture query: add an explicit response in tests/e2e/server.ts',
  );
}

export default {
  async fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    const context = await createHydrogenRouterContext(
      request,
      env,
      executionContext,
    );
    // This typed production context keeps Oxygen, SSR, routing and cookies real.
    // Only the API boundary is replaced; unknown operations fail closed.
    const rejectExternalApi = () => {
      throw new Error(
        'Unexpected fixture API request. Add an explicit fixture before testing this operation.',
      );
    };
    Object.assign(context.storefront, {
      query: (
        queryText: string,
        options?: {variables?: Record<string, unknown>},
      ) => query(queryText, options, new URL(request.url).pathname),
      mutate: rejectExternalApi,
      forward: rejectExternalApi,
      forwardMcp: rejectExternalApi,
    });
    let cartId = request.headers
      .get('cookie')
      ?.match(/fixtureCart=([^;]+)/)?.[1];
    const saveCart = (cart: ReturnType<typeof createCart>) => {
      cartId ??= crypto.randomUUID();
      carts.set(cartId, cart);
      return Promise.resolve({cart, errors: [], warnings: []});
    };
    Object.assign(context.cart, {
      get: () => Promise.resolve(cartId ? (carts.get(cartId) ?? null) : null),
      setCartId: () =>
        new Headers({
          'Set-Cookie': `fixtureCart=${cartId}; Path=/; HttpOnly; SameSite=Lax`,
        }),
      addLines: (lines: Array<{quantity: number; merchandiseId: string}>) => {
        if (request.headers.get('x-fixture-cart-error') === 'true')
          throw new Error('Simulated cart API outage');
        const line = lines[0];
        const cart = createCart(line.quantity);
        const variant = createVariant(
          line.merchandiseId.endsWith('/102') ? 'Large' : 'Small',
        );
        cart.lines.nodes[0].merchandise = {
          ...cart.lines.nodes[0].merchandise,
          ...variant,
          product: cart.lines.nodes[0].merchandise.product,
        };
        const amount = {
          amount: String(Number(variant.price.amount) * line.quantity),
          currencyCode: variant.price.currencyCode,
        };
        cart.lines.nodes[0].cost.totalAmount = amount;
        cart.cost.subtotalAmount = amount;
        cart.cost.totalAmount = amount;
        return saveCart(cart);
      },
      updateLines: (lines: Array<{quantity: number}>) => {
        const previous = cartId ? carts.get(cartId) : null;
        const cart = createCart(lines[0].quantity);
        if (previous?.lines.nodes[0]) {
          cart.lines.nodes[0].merchandise = previous.lines.nodes[0].merchandise;
          const amount = {
            ...previous.cost.subtotalAmount,
            amount: String(
              Number(previous.lines.nodes[0].merchandise.price.amount) *
                lines[0].quantity,
            ),
          };
          cart.lines.nodes[0].cost.totalAmount = amount;
          cart.cost.subtotalAmount = amount;
          cart.cost.totalAmount = amount;
        }
        return saveCart(cart);
      },
      removeLines: () => saveCart(createCart(0)),
    });
    const handler = createRequestHandler({
      build,
      mode: 'development',
      getLoadContext: () => context,
    });
    return handler(request);
  },
};
