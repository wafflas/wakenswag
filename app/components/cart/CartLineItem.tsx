import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/cart/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from '~/components/layout/Aside';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;

  return (
    <li
      key={id}
      className="relative flex min-h-64 min-w-0 w-full flex-col items-center justify-center gap-3 justify-self-stretch p-3 text-center sm:min-h-72 sm:p-4"
    >
      <Link
        aria-label={`View ${product.title}`}
        className="group flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ps2-cyan"
        prefetch="intent"
        to={lineItemUrl}
        onClick={() => {
          if (layout === 'aside') close();
        }}
      >
        <div className="flex h-28 w-full items-center justify-center sm:h-36">
          {image ? (
            <Image
              alt={image.altText ?? title}
              className="h-28 w-auto max-w-full object-contain sm:h-36"
              data={image}
              loading="lazy"
              sizes="(min-width: 640px) 192px, 160px"
            />
          ) : null}
        </div>

        <p className="w-full break-words text-base leading-6 text-ps2-muted transition-colors group-hover:text-ps2-white sm:text-lg">
          {product.title}
        </p>

        <p className="whitespace-nowrap text-base leading-6 text-ps2-muted sm:text-lg">
          {formatCartMoney(line.cost.totalAmount.amount)} EURO
        </p>

        {selectedOptions.some((option) => option.name !== 'Title') ? (
          <p className="max-w-40 text-sm leading-5 text-ps2-gray sm:max-w-48">
            {selectedOptions
              .filter((option) => option.name !== 'Title')
              .map((option) => option.value)
              .join(' / ')}
          </p>
        ) : null}
      </Link>

      <div className="relative z-20 flex w-full items-center justify-center">
        <CartLineQuantity line={line} />
      </div>

      {lineItemChildren ? (
        <div className="relative z-20">
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="cart-line-children">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, merchandise, quantity, isOptimistic} = line;
  const stockLimit = merchandise.quantityAvailable ?? null;
  const hasReachedStockLimit = stockLimit !== null && quantity >= stockLimit;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="ps2-soft-copy flex items-center justify-center gap-4 text-2xl leading-none text-ps2-gray sm:text-3xl">
      {quantity === 1 ? (
        <CartLineRemoveButton lineIds={[lineId]}>
          <QuantityButton ariaLabel="Remove item" disabled={!!isOptimistic}>
            −
          </QuantityButton>
        </CartLineRemoveButton>
      ) : (
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <QuantityButton
            ariaLabel="Decrease quantity"
            disabled={!!isOptimistic}
          >
            −
          </QuantityButton>
        </CartLineUpdateButton>
      )}

      <output aria-live="polite" className="min-w-3 text-center">
        {quantity}
      </output>

      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <QuantityButton
          ariaLabel={
            stockLimit === null
              ? 'Increase quantity'
              : `Increase quantity (maximum ${stockLimit})`
          }
          disabled={!!isOptimistic || hasReachedStockLimit}
        >
          +
        </QuantityButton>
      </CartLineUpdateButton>
    </div>
  );
}

function QuantityButton({
  ariaLabel,
  children,
  disabled,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  disabled: boolean;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="ps2-controller-action border-0 bg-transparent p-0 text-inherit enabled:cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-20"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  children,
  lineIds,
}: {
  children: React.ReactNode;
  lineIds: string[];
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      {children}
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @param lineIds - line ids affected by the update
 * @returns
 */
function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}

function formatCartMoney(amount: string) {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}
