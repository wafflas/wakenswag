import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {cloneElement, isValidElement, type ReactNode} from 'react';

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
      {(fetcher: FetcherWithComponents<unknown>) => (
        <AddToCartSubmitButton
          analytics={analytics}
          className={className}
          disabled={disabled}
          fetcher={fetcher}
        >
          {children}
        </AddToCartSubmitButton>
      )}
    </CartForm>
  );
}

function AddToCartSubmitButton({
  analytics,
  children,
  className,
  disabled,
  fetcher,
}: Omit<AddToCartButtonProps, 'lines'> & {
  fetcher: FetcherWithComponents<unknown>;
}) {
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <>
      <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />

      <button
        className={className}
        disabled={Boolean(disabled) || isSubmitting}
        type="submit"
      >
        {isSubmitting ? getSubmittingContent(children) : children}
      </button>
    </>
  );
}

function getSubmittingContent(children: ReactNode) {
  if (isValidElement<{children?: ReactNode}>(children)) {
    return cloneElement(children, undefined, 'Adding to cart...');
  }

  return 'Adding to cart...';
}
