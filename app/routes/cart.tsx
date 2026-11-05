import {data, type HeadersFunction} from 'react-router';
import type {Route} from './+types/cart';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {getSafeRedirectPath} from '~/lib/redirect';
import {getDrumkitQuantityCorrections} from '~/components/cart/cartUtils';

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  let formData: FormData;
  let parsedInput: ReturnType<typeof CartForm.getFormInput>;
  try {
    formData = await request.formData();
    parsedInput = CartForm.getFormInput(formData);
  } catch {
    return cartFailure('Invalid cart request. Please try again.', 400);
  }

  const {action, inputs} = parsedInput;

  if (!action) {
    return cartFailure('No cart action provided.', 400);
  }

  let status = 200;
  let result: CartQueryDataReturn;

  try {
    switch (action) {
      case CartForm.ACTIONS.LinesAdd:
        if (
          !Array.isArray(inputs.lines) ||
          !inputs.lines.length ||
          inputs.lines.length > 250 ||
          inputs.lines.some(
            (line) =>
              !line ||
              typeof line.merchandiseId !== 'string' ||
              !line.merchandiseId ||
              !isValidQuantity(line.quantity ?? 1, 1),
          )
        ) {
          return cartFailure('Invalid cart items. Please try again.', 400);
        }
        result = await cart.addLines(inputs.lines);
        break;
      case CartForm.ACTIONS.LinesUpdate:
        if (
          !Array.isArray(inputs.lines) ||
          !inputs.lines.length ||
          inputs.lines.length > 250 ||
          inputs.lines.some(
            (line) =>
              !line ||
              typeof line.id !== 'string' ||
              !line.id ||
              (line.quantity != null && !isValidQuantity(line.quantity, 0)),
          )
        ) {
          return cartFailure('Invalid cart quantity. Please try again.', 400);
        }
        result = await cart.updateLines(inputs.lines);
        break;
      case CartForm.ACTIONS.LinesRemove:
        if (
          !Array.isArray(inputs.lineIds) ||
          !inputs.lineIds.length ||
          inputs.lineIds.length > 250 ||
          inputs.lineIds.some((id) => typeof id !== 'string' || !id)
        ) {
          return cartFailure('Invalid cart items. Please try again.', 400);
        }
        result = await cart.removeLines(inputs.lineIds);
        break;
      case CartForm.ACTIONS.DiscountCodesUpdate: {
        const formDiscountCode = inputs.discountCode;

        // User inputted discount code
        const discountCodes = (
          formDiscountCode ? [formDiscountCode] : []
        ) as string[];

        // Combine discount codes already applied on cart
        discountCodes.push(...(inputs.discountCodes ?? []));

        result = await cart.updateDiscountCodes(discountCodes);
        break;
      }
      case CartForm.ACTIONS.GiftCardCodesAdd: {
        const formGiftCardCode = inputs.giftCardCode;

        const giftCardCodes = (
          formGiftCardCode ? [formGiftCardCode] : []
        ) as string[];

        result = await cart.addGiftCardCodes(giftCardCodes);
        break;
      }
      case CartForm.ACTIONS.GiftCardCodesRemove: {
        const appliedGiftCardIds = inputs.giftCardCodes as string[];
        result = await cart.removeGiftCardCodes(appliedGiftCardIds);
        break;
      }
      case CartForm.ACTIONS.BuyerIdentityUpdate: {
        result = await cart.updateBuyerIdentity({
          ...inputs.buyerIdentity,
        });
        break;
      }
      default:
        return cartFailure('Unknown cart action.', 400);
    }

    if (
      (action === CartForm.ACTIONS.LinesAdd ||
        action === CartForm.ACTIONS.LinesUpdate) &&
      result.cart?.id &&
      !result.errors?.length
    ) {
      const cartId = result.cart.id;
      const savedCart = await cart.get({cartId});
      if (!savedCart)
        return cartFailure('Could not load your cart. Please try again.', 502);
      const {updates, removals} = getDrumkitQuantityCorrections(
        savedCart.lines.nodes,
      );
      if (removals.length) result = await cart.removeLines(removals, {cartId});
      if (updates.length && !result.errors?.length)
        result = await cart.updateLines(updates, {cartId});
    }
  } catch (error) {
    console.error('Cart mutation failed', error);
    return cartFailure('Could not update your cart. Please try again.', 502);
  }

  if (!result.cart && !result.errors?.length) {
    return cartFailure('Could not update your cart. Please try again.', 502);
  }

  const cartId = result.cart?.id;
  const headers = cartId ? cart.setCartId(cartId) : new Headers();
  const {cart: cartResult, errors, warnings} = result;
  status = errors?.length ? 400 : cartResult ? 200 : 502;

  const redirectTo = getSafeRedirectPath(formData.get('redirectTo'));
  if (redirectTo && status === 200) {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

function isValidQuantity(quantity: number, minimum: number) {
  return (
    Number.isInteger(quantity) &&
    quantity >= minimum &&
    quantity <= 2_147_483_647
  );
}

function cartFailure(message: string, status: number) {
  return data(
    {
      cart: null,
      errors: [{message}],
      warnings: [],
      analytics: {cartId: undefined},
    },
    {status},
  );
}
