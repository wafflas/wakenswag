import {redirect} from 'react-router';
import type {Route} from './+types/cart.$lines';

/**
 * Automatically creates a new cart based on the URL and redirects straight to checkout.
 * Expected URL structure:
 * ```js
 * /cart/<variant_id>:<quantity>
 *
 * ```
 *
 * More than one `<variant_id>:<quantity>` separated by a comma, can be supplied in the URL, for
 * carts with more than one product variant.
 *
 * @example
 * Example path creating a cart with two product variants, different quantities, and a discount code in the querystring:
 * ```js
 * /cart/41007289663544:1,41007289696312:2?discount=HYDROBOARD
 *
 * ```
 */
export async function loader({request, context, params}: Route.LoaderArgs) {
  const {cart} = context;
  const {lines} = params;
  if (!lines) {
    throw new Response('Cart lines are required.', {status: 400});
  }
  const linesMap = lines.split(',').map((line) => {
    const match = /^([1-9]\d*):([1-9]\d*)$/.exec(line);
    const quantity = match ? Number(match[2]) : NaN;
    if (!match || !Number.isSafeInteger(quantity) || quantity > 2_147_483_647) {
      throw new Response('Invalid cart link. Check the variant and quantity.', {
        status: 400,
      });
    }
    const variantId = match[1];

    return {
      merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
      quantity,
    };
  });
  if (linesMap.length > 250) {
    throw new Response('Too many cart items.', {status: 400});
  }

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const discount = searchParams.get('discount');
  const discountArray = discount ? [discount] : [];

  // create a cart
  const result = await cart.create({
    lines: linesMap,
    discountCodes: discountArray,
  });

  const cartResult = result.cart;

  if (result.errors?.length || !cartResult) {
    throw new Response('Link may be expired. Try checking the URL.', {
      status: 410,
    });
  }

  // Update cart id in cookie
  const headers = cart.setCartId(cartResult.id);

  // redirect to checkout
  if (cartResult.checkoutUrl) {
    return redirect(cartResult.checkoutUrl, {headers});
  } else {
    throw new Error('No checkout URL found');
  }
}

export default function Component() {
  return null;
}
