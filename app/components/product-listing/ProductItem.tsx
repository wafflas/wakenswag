import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';

const productImageClassName =
  'size-22 max-w-none object-cover md:size-24 lg:size-[min(10vw,calc((100dvh-18rem)/3),10rem)]';

interface ProductItemProps {
  product: ProductItemFragment | RecommendedProductFragment;
  isSelected?: boolean;
  animationDelayMs?: number;
  loading?: 'eager' | 'lazy';
  onSelect?: (productId: string, title: string) => void;
  shouldAnimate?: boolean;
}

export function ProductItem({
  product,
  isSelected = false,
  animationDelayMs = 0,
  loading,
  onSelect,
  shouldAnimate = true,
}: ProductItemProps) {
  const image = product.featuredImage;
  const productUrl = `/merch/${product.handle}`;

  return (
    <Link
      aria-current={isSelected ? 'true' : undefined}
      className={[
        'ps2-product-item ps2-product-item-glow group relative inline-flex h-fit w-fit shrink-0 place-self-center',
        shouldAnimate ? 'scale-in' : '',
        'rounded-sm brightness-50 transition duration-150',
        'hover:brightness-100 focus:brightness-100 data-[selected=true]:brightness-100',
      ].join(' ')}
      data-selected={isSelected}
      onFocus={() => onSelect?.(product.id, product.title)}
      onPointerEnter={() => onSelect?.(product.id, product.title)}
      prefetch="intent"
      style={{
        animationDelay: `${animationDelayMs}ms`,
      }}
      to={productUrl}
    >
      {image ? (
        <Image
          alt=""
          aspectRatio="1/1"
          className={productImageClassName}
          data={image}
          loading={loading}
          sizes="(min-width: 1024px) min(10vw, calc((100dvh - 18rem) / 3), 10rem), (min-width: 768px) 96px, 88px"
        />
      ) : (
        <span aria-hidden="true" className={`block ${productImageClassName}`} />
      )}

      <span className="sr-only">
        {product.title}
        {isSelected ? ', selected' : ''},{' '}
        <Money data={product.priceRange.minVariantPrice} />
      </span>
    </Link>
  );
}
