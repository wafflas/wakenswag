import {useCart, useCartForm} from '~/lib/cart';
import type {CartLine} from './cartUtils';
import {getProductListingPathForProduct} from '~/lib/variants';

const QUANTITY_BUTTON_CLASS_NAME =
  'ps2-controller-action border-0 bg-transparent p-0 text-inherit enabled:cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-20';

export function CartLineQuantity({line}: {line: CartLine}) {
  const {formProps, register} = useCartForm();
  const pending = useCart((state) => state.pending.lines.has(line.id));
  const errors = useCart((state) => state.errors.lines.get(line.id));
  const networkErrors = useCart((state) => state.errors.network);
  const isDrumkit =
    getProductListingPathForProduct(line.merchandise?.product ?? {}) ===
    '/drumkits';
  const stockLimit = line.merchandise?.quantityAvailable ?? null;
  return (
    <form
      {...formProps()}
      className="ps2-soft-copy flex items-center justify-center gap-4 text-2xl leading-none text-ps2-gray sm:text-3xl"
    >
      <button {...register('set')} />
      <input type="hidden" {...register('lineId', {value: line.id})} />
      <button
        {...(line.quantity === 1 ? register('remove') : register('decrease'))}
        type="submit"
        aria-label={line.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
        className={QUANTITY_BUTTON_CLASS_NAME}
        disabled={pending}
      >
        −
      </button>
      <input
        {...register('quantity', {value: line.quantity, interactive: true})}
        aria-label="Item quantity"
        className="w-[2ch] min-w-3 border-0 bg-transparent p-0 text-center text-inherit"
        disabled={pending}
      />
      <output aria-live="polite" className="sr-only">
        {line.quantity}
      </output>
      {!isDrumkit ? (
        <button
          {...register('increase')}
          type="submit"
          aria-label={
            stockLimit === null
              ? 'Increase quantity'
              : `Increase quantity (maximum ${stockLimit})`
          }
          className={QUANTITY_BUTTON_CLASS_NAME}
          disabled={
            pending || (stockLimit !== null && line.quantity >= stockLimit)
          }
        >
          +
        </button>
      ) : null}
      {!pending && (errors?.userErrors.length || networkErrors.length) ? (
        <p role="alert" className="text-sm">
          Could not update this item. Please try again.
        </p>
      ) : null}
    </form>
  );
}
