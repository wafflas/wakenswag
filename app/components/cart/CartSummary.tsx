import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {type OptimisticCart} from '@shopify/hydrogen';
import {formatMoneyAmount} from '~/lib/money';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
};

export function CartSummary({cart}: CartSummaryProps) {
  const subtotal = cart?.cost?.subtotalAmount;

  return (
    <div className="ps2-soft-copy flex flex-col items-center gap-2 text-center text-xl leading-none">
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
      {!cart?.isOptimistic && cart?.checkoutUrl ? (
        <a className="ps2-cta" href={cart.checkoutUrl} target="_self">
          Go to checkout
        </a>
      ) : null}
    </div>
  );
}
