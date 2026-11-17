// A separate worker entry: production server.ts never imports this module.
import * as build from 'virtual:react-router/server-build';
import {createRequestHandler} from 'react-router';
import type {CacheInstance} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';
import {
  createCart,
  createProduct,
  createProductCard,
  createVariant,
  createDrumkitVariant,
  createDrumkitCart,
} from '../fixtures/catalog';

let lastCartUpdate = Date.now();
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
  if (queryText.includes('query InfoPolicies')) {
    return Promise.resolve({
      shop: {
        privacyPolicy: {
          body: '<h2>Your privacy</h2><p>Fixture privacy policy.</p>',
        },
        termsOfService: {body: '<p>Fixture terms of service.</p>'},
        refundPolicy: null,
      },
    });
  }
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
  if (queryText.includes('query Swag'))
    return Promise.resolve({
      collection:
        variables.handle === 'swag'
          ? {
              id: 'gid://shopify/Collection/2',
              handle: 'swag',
              products: productConnection(variables),
            }
          : null,
    });
  if (queryText.includes('query Drumkits')) {
    const products = productConnection(variables, catalog.slice(0, 24));
    return Promise.resolve({
      collection: {
        id: 'gid://shopify/Collection/1',
        title: 'Drumkits',
        handle: 'drumkits',
        description: 'Fixture drumkits',
        products: {
          ...products,
          nodes: products.nodes.map((product) => ({
            ...product,
            description:
              '808s so distorted your speakers might file a lawsuit.\nScientifically proven to NOT make you a better producer.',
            descriptionHtml:
              '<ul><li>808s so distorted your speakers might file a lawsuit.</li><li>Scientifically proven to NOT make you a better producer.</li></ul>',
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
                productType: 'Swag',
                collections: {nodes: [{handle: 'swag'}]},
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
      collections: {nodes: [{handle: isDrumkit ? 'drumkits' : 'swag'}]},
      selectedOrFirstAvailableVariant:
        handle === 'no-variant'
          ? null
          : handle === 'fixture-drumkit'
            ? createDrumkitVariant()
            : createVariant(size, handle !== 'sold-out'),
    });
    if (handle === 'fixture-drumkit') {
      const variant = createDrumkitVariant();
      product.options = [
        {
          name: 'Title',
          optionValues: [
            {
              name: 'Default Title',
              firstSelectableVariant: variant,
              swatch: null,
            },
          ],
        },
      ];
      product.adjacentVariants = [];
      product.encodedVariantExistence = 'v1_0';
      product.encodedVariantAvailability = 'v1_0';
    }
    return Promise.resolve({product});
  }
  throw new Error(
    'Unexpected fixture query: add an explicit response in tests/e2e/server.ts',
  );
}

export default {
  async fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    const pathname = new URL(request.url).pathname;
    // SDK proxy routes use global fetch, rather than the injectable GraphQL client.
    // Keep those unconfigured fixture surfaces from reaching external services.
    if (
      (pathname.startsWith('/api/') &&
        !['/api/cart', '/api/predictive-search'].includes(pathname)) ||
      pathname.startsWith('/__shopify') ||
      pathname.startsWith('/.well-known/') ||
      /\/cart(?:\.(?:js|json)|\/(?:add|update|change|clear)(?:\.(?:js|json))?)$/i.test(
        pathname,
      )
    )
      return Response.json(
        {error: 'This proxy is not configured in the test fixture.'},
        {status: 404},
      );
    // Execute the real Storefront client and handlers; replace only HTTP to Shopify.
    const fixtureFetch: typeof globalThis.fetch = async (input, init) => {
      const upstream = new Request(input, init);
      const {query: queryText, variables = {}} = (await upstream.json()) as {
        query: string;
        variables?: Record<string, unknown>;
      };
      if (queryText.includes('Cart')) {
        const readFault = request.headers.get('x-fixture-cart-read-error');
        if (!queryText.includes('mutation') && readFault === 'transport')
          throw new Error('Simulated cart read outage');
        if (!queryText.includes('mutation') && readFault === 'graphql')
          return Response.json({
            data: {cart: null},
            errors: [{message: 'Simulated private cart read error'}],
          });
        if (
          request.headers.get('x-fixture-cart-error') === 'true' &&
          queryText.includes('mutation')
        )
          throw new Error('Simulated cart API outage');
        const cartId = String(variables.cartId ?? variables.id ?? '');
        if (!queryText.includes('mutation'))
          return Response.json({data: {cart: carts.get(cartId) ?? null}});
        const operation = queryText.includes('cartCreate(')
          ? 'cartCreate'
          : queryText.includes('cartLinesAdd(')
            ? 'cartLinesAdd'
            : queryText.includes('cartLinesUpdate(')
              ? 'cartLinesUpdate'
              : queryText.includes('cartLinesRemove(')
                ? 'cartLinesRemove'
                : '';
        if (!operation) throw new Error('Unsupported fixture cart mutation');
        const lines = (variables.lines ??
          (variables.input as {lines?: unknown[]})?.lines ??
          []) as Array<{quantity: number; merchandiseId?: string}>;
        const previous = carts.get(cartId);
        const previousLine = previous?.lines.nodes[0];
        const variantId =
          lines[0]?.merchandiseId ?? previousLine?.merchandise.id ?? '';
        const quantity =
          operation === 'cartLinesRemove'
            ? 0
            : (lines[0]?.quantity ?? 0) +
              (operation === 'cartLinesAdd'
                ? (previous?.totalQuantity ?? 0)
                : 0);
        const drumkit = variantId.endsWith('/201');
        const cart = drumkit
          ? createDrumkitCart(quantity)
          : createCart(quantity);
        cart.id = cartId || `gid://shopify/Cart/${crypto.randomUUID()}`;
        if (!drumkit && cart.lines.nodes[0]) {
          const variant = createVariant(
            variantId.endsWith('/102') ? 'Large' : 'Small',
          );
          const line = cart.lines.nodes[0];
          line.merchandise = {
            ...line.merchandise,
            ...variant,
            product: line.merchandise.product,
          };
          const amount = {
            ...variant.price,
            amount: String(Number(variant.price.amount) * quantity),
          };
          line.cost.totalAmount = amount;
          line.cost.subtotalAmount = amount;
          cart.cost.subtotalAmount = amount;
          cart.cost.totalAmount = amount;
          cart.cost.checkoutChargeAmount = amount;
        }
        lastCartUpdate = Math.max(lastCartUpdate + 1, Date.now());
        cart.updatedAt = new Date(lastCartUpdate).toISOString();
        carts.set(cart.id, cart);
        return Response.json({
          data: {[operation]: {cart, userErrors: [], warnings: []}},
        });
      }
      if (queryText.includes('query SitemapIndex'))
        return Response.json({data: {products: {pagesCount: {count: 1}}}});
      if (queryText.includes('query SitemapProducts'))
        return Response.json({
          data: {
            sitemap: {
              resources: {
                items: catalog.map((product) => ({
                  handle: product.handle,
                  updatedAt: '2026-11-04T00:00:00Z',
                })),
              },
            },
          },
        });
      if (queryText.includes('urlRedirects'))
        return Response.json({data: {urlRedirects: {edges: []}}});
      return Response.json({
        data: await query(
          queryText,
          {variables},
          new URL(request.url).pathname,
        ),
      });
    };
    // The inherited fixtures serve the same fictional handle in two collections.
    // Partition their caches so those intentionally different catalogues do not contaminate each other.
    const fixtureScope = new URL(request.url).pathname.startsWith('/drumkits')
      ? 'drumkits'
      : 'swag';
    const cache = await caches.open(`hydrogen-fixture-v2-${fixtureScope}`);
    const context = await createHydrogenRouterContext(
      request,
      env,
      executionContext,
      {fetch: fixtureFetch, cache: cache as unknown as CacheInstance},
    );
    return createRequestHandler(build, process.env.NODE_ENV)(request, context);
  },
};
