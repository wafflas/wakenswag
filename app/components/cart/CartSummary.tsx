import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/cart/CartMain';
import {type OptimisticCart} from '@shopify/hydrogen';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const subtotal = cart?.cost?.subtotalAmount;

  return (
    <div
      className="ps2-soft-copy flex flex-col items-center gap-2 text-center text-xl leading-none"
      data-layout={layout}
    >
      <p className="text-ps2-gray">
        Total{' '}
        <span className="text-ps2-white">
          {subtotal?.amount ? formatCartMoney(subtotal.amount) : '0'}
        </span>{' '}
        EURO
      </p>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <a className="ps2-cta" href={checkoutUrl} target="_self">
      Go to checkout
    </a>
  );
}

function formatCartMoney(amount: string) {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}
