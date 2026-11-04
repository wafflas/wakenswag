import {CartForm} from '@shopify/hydrogen';
import type {CartLine} from './cartUtils';

const QUANTITY_BUTTON_CLASS_NAME =
  'ps2-controller-action border-0 bg-transparent p-0 text-inherit enabled:cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-20';

/** Owns quantity/removal forms, their pending state and stock limits. */
export function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line.quantity === 'undefined') return null;

  const {id: lineId, merchandise, quantity, isOptimistic} = line;
  const stockLimit = merchandise.quantityAvailable ?? null;
  const hasReachedStockLimit = stockLimit !== null && quantity >= stockLimit;
  const shouldRemoveLine = quantity === 1;
  const decreaseFormProps = shouldRemoveLine
    ? {action: CartForm.ACTIONS.LinesRemove, inputs: {lineIds: [lineId]}}
    : {
        action: CartForm.ACTIONS.LinesUpdate,
        inputs: {lines: [{id: lineId, quantity: Math.max(0, quantity - 1)}]},
      };
  // Both controls share pending state, so an update disables both forms.
  const fetcherKey = `${CartForm.ACTIONS.LinesUpdate}-${lineId}`;

  return (
    <div className="ps2-soft-copy flex items-center justify-center gap-4 text-2xl leading-none text-ps2-gray sm:text-3xl">
      <CartForm {...decreaseFormProps} fetcherKey={fetcherKey} route="/cart">
        {(fetcher) => (
          <fieldset
            disabled={fetcher.state !== 'idle'}
            className="border-0 p-0"
          >
            <button
              aria-label={
                shouldRemoveLine ? 'Remove item' : 'Decrease quantity'
              }
              className={QUANTITY_BUTTON_CLASS_NAME}
              disabled={!!isOptimistic}
              type="submit"
            >
              −
            </button>
            {fetcher.state === 'idle' && fetcher.data?.errors?.length > 0 ? (
              <p role="alert" className="text-sm">
                {shouldRemoveLine
                  ? 'Could not remove this item. Please try again.'
                  : 'Could not update this item. Please try again.'}
              </p>
            ) : null}
          </fieldset>
        )}
      </CartForm>

      <output aria-live="polite" className="min-w-3 text-center">
        {quantity}
      </output>

      <CartForm
        fetcherKey={fetcherKey}
        route="/cart"
        action={CartForm.ACTIONS.LinesUpdate}
        inputs={{lines: [{id: lineId, quantity: quantity + 1}]}}
      >
        {(fetcher) => (
          <fieldset
            disabled={fetcher.state !== 'idle'}
            className="border-0 p-0"
          >
            <button
              aria-label={
                stockLimit === null
                  ? 'Increase quantity'
                  : `Increase quantity (maximum ${stockLimit})`
              }
              className={QUANTITY_BUTTON_CLASS_NAME}
              disabled={!!isOptimistic || hasReachedStockLimit}
              type="submit"
            >
              +
            </button>
            {fetcher.state === 'idle' && fetcher.data?.errors?.length > 0 ? (
              <p role="alert" className="text-sm">
                Could not update this item. Please try again.
              </p>
            ) : null}
          </fieldset>
        )}
      </CartForm>
    </div>
  );
}
