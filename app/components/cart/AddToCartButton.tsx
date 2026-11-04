import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {getSubmittingContent} from './cartUtils';

type CartActionData = {errors?: Array<{message: string}>};

interface AddToCartButtonProps {
  analytics?: unknown;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
}

export function AddToCartButton({
  analytics,
  children,
  className,
  disabled,
  lines,
}: AddToCartButtonProps) {
  return (
    <CartForm action={CartForm.ACTIONS.LinesAdd} inputs={{lines}} route="/cart">
      {(fetcher: FetcherWithComponents<CartActionData>) => {
        const isSubmitting = fetcher.state !== 'idle';

        return (
          <>
            <input
              name="analytics"
              type="hidden"
              value={JSON.stringify(analytics)}
            />
            <button
              className={className}
              disabled={Boolean(disabled) || isSubmitting}
              type="submit"
            >
              {isSubmitting ? getSubmittingContent(children) : children}
            </button>
            {!isSubmitting && fetcher.data?.errors?.length ? (
              <p
                role="alert"
                className="ps2-soft-copy mt-2 text-sm text-ps2-muted"
              >
                Could not add this item. Please try again.
              </p>
            ) : null}
          </>
        );
      }}
    </CartForm>
  );
}
