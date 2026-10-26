import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

interface AddToCartButtonProps {
  analytics?: unknown;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}

export function AddToCartButton({
  analytics,
  children,
  className,
  disabled,
  lines,
  onClick,
}: AddToCartButtonProps) {
  return (
    <CartForm action={CartForm.ACTIONS.LinesAdd} inputs={{lines}} route="/cart">
      {(fetcher: FetcherWithComponents<any>) => {
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
              onClick={onClick}
              type="submit"
            >
              {children}
            </button>
          </>
        );
      }}
    </CartForm>
  );
}
