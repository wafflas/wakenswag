import {CartLineQuantity} from './CartLineQuantity';
import type {CartLine, CartLayout, LineItemChildrenMap} from './cartUtils';
import {Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from '~/components/layout/Aside';
import {formatMoney} from '~/lib/money';

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
  // Newly added optimistic lines do not have Shopify's calculated costs yet.
  const totalAmount = line.cost?.totalAmount;

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
          {totalAmount ? formatMoney(totalAmount) : '—'}
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
