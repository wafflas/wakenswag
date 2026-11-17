import {
  cartQueries,
  parseCartRequest,
  createCartServerHandlers,
  createShopifyRouteHandler,
  type CartAction,
  type CartDataFromHandlers,
  type ShopifyRouteHandlerContext,
  type ShopifyRouteHandlerResult,
} from '@shopify/hydrogen';
import {getDrumkitQuantityCorrections} from '~/components/cart/cartUtils';
import {CART_QUERY_FRAGMENT} from './fragments';

const baseCartHandlers = createCartServerHandlers({
  fragment: CART_QUERY_FRAGMENT,
});
const basePost = baseCartHandlers.post;
type ServerCart = CartDataFromHandlers<typeof baseCartHandlers>;
type HandlerContext = Omit<ShopifyRouteHandlerContext, 'sessionManager'>;

// Keep the store's single-copy drumkit rule on the server, including direct API requests.
const post = createShopifyRouteHandler(
  '/api/cart',
  'POST',
  async (context: HandlerContext): Promise<ShopifyRouteHandlerResult> => {
    const invalidRequest = (): ShopifyRouteHandlerResult => ({
      type: 'error',
      status: 400,
      headers: {'Cache-Control': 'private, no-store'},
      error: {code: 'invalid_cart_request', message: 'Unknown cart action.'},
    });
    let responseHeaders: HeadersInit | undefined;
    try {
      const isForm = !context.request.headers
        .get('content-type')
        ?.includes('application/json');
      let request = context.request;
      if (isForm) {
        let action: CartAction;
        try {
          const form = await request.clone().formData();
          action =
            form.get('intent') === 'empty'
              ? {
                  intent: 'remove',
                  lineIds: form
                    .getAll('lineId')
                    .filter((id): id is string => typeof id === 'string'),
                }
              : (await parseCartRequest(request.clone())).action;
        } catch {
          return invalidRequest();
        }
        // Inspect line mutation results before redirecting to enforce drumkit limits.
        // Other native forms keep the SDK's parsing and same-origin redirects.
        if (
          action.intent === 'add' ||
          action.intent === 'update' ||
          action.intent === 'remove'
        ) {
          const body =
            action.intent === 'remove'
              ? {lines: action.lineIds.map((id) => ({id, quantity: 0}))}
              : action;
          const headers = new Headers(request.headers);
          headers.set('content-type', 'application/json');
          request = new Request(request.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: request.signal,
          });
        }
      }
      const result = await basePost({...context, request});
      const privateHeaders = new Headers(result.headers);
      privateHeaders.set('Cache-Control', 'private, no-store');
      result.headers = privateHeaders;
      responseHeaders = privateHeaders;
      if (result.type !== 'json') return result;
      const payload = result.data as {
        cart?: ServerCart | null;
        userErrors?: Array<{message: string}>;
      };
      if (!payload.cart?.id || payload.userErrors?.length) return result;
      const cartId = payload.cart.id;
      const {updates, removals} = getDrumkitQuantityCorrections(
        payload.cart.lines.nodes,
      );
      if (removals.length) {
        const correction = await context.storefrontClient.graphql(
          cartQueries.cartLinesRemove,
          {variables: {cartId, lineIds: removals}},
        );
        if (
          correction.errors?.length ||
          correction.data?.cartLinesRemove?.userErrors.length
        )
          throw new Error('Could not enforce drumkit quantity');
      }
      if (updates.length) {
        const correction = await context.storefrontClient.graphql(
          cartQueries.cartLinesUpdate,
          {variables: {cartId, lines: updates}},
        );
        if (
          correction.errors?.length ||
          correction.data?.cartLinesUpdate?.userErrors.length
        )
          throw new Error('Could not enforce drumkit quantity');
      }
      if (updates.length || removals.length) {
        const url = new URL(context.request.url);
        url.searchParams.set('cartId', cartId);
        const saved = await baseCartHandlers.get({
          storefrontClient: context.storefrontClient,
          request: new Request(url),
        });
        if (!saved.data.cart || saved.data.errors?.length)
          throw new Error('Could not read corrected cart');
        payload.cart = saved.data.cart;
      }
      if (isForm) {
        const referer = context.request.headers.get('referer');
        const target = referer
          ? new URL(referer, context.request.url)
          : new URL('/', context.request.url);
        return {
          type: 'redirect',
          status: 303,
          headers: result.headers,
          location:
            target.origin === new URL(context.request.url).origin
              ? target.pathname + target.search
              : '/',
        };
      }
      return result;
    } catch (error) {
      console.error('Cart mutation failed', error);
      return {
        type: 'error',
        status: 502,
        headers: new Headers({
          ...Object.fromEntries(new Headers(responseHeaders)),
          'Cache-Control': 'no-store',
        }),
        error: {
          code: 'cart_mutation_failed',
          message: 'Could not update your cart. Please try again.',
        },
      };
    }
  },
);
export const cartHandlers = Object.assign(baseCartHandlers, {post});
