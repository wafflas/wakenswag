import type {CartApiQueryFragment} from '~/lib/cart';
import {useCart} from '~/lib/cart';
import {formatMoneyAmount} from '~/lib/money';

type CartSummaryProps = {
  cart: CartApiQueryFragment | null;
};

export function CartSummary({cart}: CartSummaryProps) {
  const subtotal = cart?.cost?.subtotalAmount;
  const checkoutUrl = cart?.checkoutUrl;
  const pending = useCart((state) => state.pending.cost || state.revalidating);
  const isCalculating = pending || !checkoutUrl;

  return (
    <div className="cart-main-summary ps2-soft-copy flex flex-col items-center gap-2 text-center text-xl leading-none">
      <p className="text-ps2-gray">
        Total{' '}
        <span className="text-ps2-white">
          {subtotal?.amount && subtotal.currencyCode
            ? formatMoneyAmount({
                amount: subtotal.amount,
                currencyCode: subtotal.currencyCode,
              })
            : '—'}
        </span>{' '}
        {subtotal?.currencyCode === 'EUR' ? 'EURO' : subtotal?.currencyCode}
      </p>
      {isCalculating ? (
        <p
          aria-busy="true"
          aria-live="polite"
          className="ps2-cta pointer-events-none cursor-default opacity-50"
        >
          Calculating...
        </p>
      ) : (
        <a className="ps2-cta" href={checkoutUrl} target="_self">
          Go to checkout
        </a>
      )}
    </div>
  );
}
