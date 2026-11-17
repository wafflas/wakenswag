import {createCartComponents} from '@shopify/hydrogen/react';
import type {CartDataFromHandlers} from '@shopify/hydrogen';
import type {cartHandlers} from './cartHandlers.server';
export const {
  CartProvider,
  useCart,
  useSuspenseCart,
  useOptionalCart,
  useCartActions,
  useCartForm,
} = createCartComponents<typeof cartHandlers>();
export type CartApiQueryFragment = CartDataFromHandlers<typeof cartHandlers>;
