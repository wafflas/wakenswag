import {CartForm} from '@shopify/hydrogen';

export function CartEmptyButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      {(fetcher) => (
        <div className="text-right">
          <button
            type="submit"
            disabled={disabled || fetcher.state !== 'idle' || !lineIds.length}
            className="ps2-controller-action rounded-sm px-3 text-sm text-ps2-muted  decoration-ps2-gray/50 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ps2-cyan enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 sm:text-base"
          >
            {fetcher.state !== 'idle' ? 'Emptying…' : 'Empty cart'}
          </button>
          {fetcher.state === 'idle' && fetcher.data?.errors?.length > 0 && (
            <p role="alert" className="max-w-64 text-sm text-ps2-muted">
              Could not empty your cart. Please try again.
            </p>
          )}
        </div>
      )}
    </CartForm>
  );
}
