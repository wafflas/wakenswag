import {useProductForm} from '~/lib/product';
import {getSubmittingContent} from './cartUtils';

interface AddToCartButtonProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  quantity: number;
}

export function AddToCartButton({
  children,
  className,
  disabled,
  quantity,
}: AddToCartButtonProps) {
  const {formProps, register, pending, errors} = useProductForm();
  const hasError =
    errors.userErrors.length > 0 || errors.networkErrors.length > 0;
  return (
    <form {...formProps()}>
      <input type="hidden" {...register('merchandiseId', {})} />
      <input type="hidden" {...register('quantity', {value: quantity})} />
      <button
        {...register('addToCart', {})}
        className={className}
        disabled={Boolean(disabled) || pending}
      >
        {pending ? getSubmittingContent(children) : children}
      </button>
      {!pending && hasError ? (
        <p role="alert" className="ps2-soft-copy mt-2 text-sm text-ps2-muted">
          Could not add this item. Please try again.
        </p>
      ) : null}
    </form>
  );
}
