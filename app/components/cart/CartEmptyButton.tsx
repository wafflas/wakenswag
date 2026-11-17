import {useCartActions} from '~/lib/cart';
import {useState} from 'react';

export function CartEmptyButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  const {refresh} = useCartActions();
  const [pending, setPending] = useState(false);
  const [hasError, setHasError] = useState(false);
  return (
    <form
      method="post"
      action="/api/cart"
      className="text-right"
      onSubmit={(event) => {
        if (!window.Shopify?.actions) return;
        event.preventDefault();
        setPending(true);
        setHasError(false);
        void window.Shopify.actions
          .updateCart(
            {lines: lineIds.map((id) => ({id, quantity: 0}))},
            {event: {context: 'cart'}},
          )
          .then((result) => {
            setHasError(Boolean(result.userErrors?.length));
            // Bulk Standard Actions can normalize line IDs. Reload the full authoritative cart.
            if (!result.userErrors?.length) refresh();
          })
          .catch(() => setHasError(true))
          .finally(() => setPending(false));
      }}
    >
      <input type="hidden" name="intent" value="empty" />
      {lineIds.map((id) => (
        <input key={id} type="hidden" name="lineId" value={id} />
      ))}
      <button
        type="submit"
        disabled={disabled || pending || !lineIds.length}
        className="ps2-controller-action rounded-sm px-3 text-sm text-ps2-muted decoration-ps2-gray/50 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ps2-cyan enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 sm:text-base"
      >
        {pending ? 'Emptying…' : 'Empty cart'}
      </button>
      {!pending && hasError ? (
        <p role="alert" className="max-w-64 text-sm text-ps2-muted">
          Could not empty your cart. Please try again.
        </p>
      ) : null}
    </form>
  );
}
