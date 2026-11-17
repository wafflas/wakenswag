import {readFileSync} from 'node:fs';
import {vi} from 'vitest';
import * as standardEvents from './shopify/standard-events.js';
import {configureCartEndpoint} from '@shopify/hydrogen';
import {createCart} from './catalog';

/** Real Shopify actions/events with a replaceable HTTP boundary for component tests. */
export function installShopifyRuntime() {
  if (!window.Shopify?.actions) {
    const source = readFileSync(
      'tests/fixtures/shopify/standard-actions.js',
      'utf8',
    );
    // jsdom cannot import a remote ES module; supply the same vendored module locally.
    new Function(
      'standardEvents',
      source.replace(
        'import(`./standard-events.js`)',
        'Promise.resolve(standardEvents)',
      ),
    )(standardEvents);
  }
  configureCartEndpoint('/api/cart');
  document.cookie = 'cart=fixture; path=/';
}

export function mockCartRequest(
  handler: (payload: {
    lines: Array<{id?: string; merchandiseId?: string; quantity: number}>;
  }) => unknown | Promise<unknown>,
) {
  installShopifyRuntime();
  const fetch = vi.fn(async (_input: unknown, init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? '{}')) as Parameters<
      typeof handler
    >[0];
    const result = (await handler(payload)) as
      {errors?: Array<{message: string}>; cart?: unknown} | undefined;
    if (result?.errors?.length)
      return Response.json(
        {error: {message: result.errors[0].message}},
        {status: 502},
      );
    return Response.json({
      cart: result?.cart ?? createCart(payload.lines?.[0]?.quantity ?? 0),
      userErrors: [],
      warnings: [],
    });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
