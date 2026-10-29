import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {urlWithTrackingParams} from '~/lib/search';
import type {SearchProductCard} from './searchTypes';

interface SearchProductItemProps {
  product: SearchProductCard;
  term: string;
  onNavigate: () => void;
}

function formatSearchMoney(amount: string) {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

/** A search result styled like the product entries in the cart modal. */
export function SearchProductItem({
  product,
  term,
  onNavigate,
}: SearchProductItemProps) {
  const productUrl = urlWithTrackingParams({
    baseUrl: `/merch/${product.handle}`,
    trackingParams: product.trackingParameters,
    term,
  });

  return (
    <li className="flex min-h-64 min-w-0 w-full flex-col items-center justify-center p-3 text-center sm:min-h-72 sm:p-4">
      <Link
        aria-label={`View ${product.title}`}
        className="group flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ps2-cyan"
        onClick={onNavigate}
        prefetch="intent"
        to={productUrl}
      >
        <span className="flex h-28 w-full items-center justify-center sm:h-36">
          {product.image ? (
            <Image
              alt={product.image.altText ?? product.title}
              className="h-28 w-auto max-w-full object-contain sm:h-36"
              data={product.image}
              loading="lazy"
              sizes="(min-width: 640px) 192px, 160px"
            />
          ) : null}
        </span>

        <span className="w-full break-words text-base leading-6 text-ps2-muted transition-colors group-hover:text-ps2-white sm:text-lg">
          {product.title}
        </span>

        <span className="text-sm leading-5 text-ps2-gray">
          {product.category}
        </span>

        <span className="whitespace-nowrap text-base leading-6 text-ps2-muted sm:text-lg">
          {product.price
            ? `${formatSearchMoney(product.price.amount)} ${product.price.currencyCode}`
            : '—'}
        </span>

        <span
          className={
            product.availableForSale ? 'text-ps2-cyan' : 'text-ps2-gray'
          }
        >
          {product.availableForSale ? 'AVAILABLE' : 'UNAVAILABLE'}
        </span>
      </Link>
    </li>
  );
}
