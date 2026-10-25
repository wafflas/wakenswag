import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

const productImageClassName =
  'size-22 max-w-none object-cover md:size-24 lg:size-28 xl:size-32 2xl:size-40';

interface ProductItemProps {
  product: ProductItemFragment | RecommendedProductFragment;
  isSelected?: boolean;
  animationDelayMs?: number;
  loading?: 'eager' | 'lazy';
  onSelect?: (productId: string, title: string) => void;
}

export function ProductItem({
  product,
  isSelected = false,
  animationDelayMs = 0,
  loading,
  onSelect,
}: ProductItemProps) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  return (
    <Link
      aria-label={product.title}
      className={[
        'ps2-product-item scale-in ps2-product-item-glow group relative inline-flex w-fit shrink-0 justify-self-center',
        'rounded-sm brightness-50 transition duration-150',
        'hover:brightness-100 focus:brightness-100 data-[selected=true]:brightness-100',
      ].join(' ')}
      data-selected={isSelected}
      onFocus={() => onSelect?.(product.id, product.title)}
      onPointerEnter={() => onSelect?.(product.id, product.title)}
      prefetch="intent"
      style={{animationDelay: `${animationDelayMs}ms`}}
      to={variantUrl}
    >
      {image ? (
        <Image
          className={productImageClassName}
          data={image}
          loading={loading}
        />
      ) : (
        <span aria-hidden="true" className={`block ${productImageClassName}`} />
      )}

      <span className="sr-only">
        {product.title}, <Money data={product.priceRange.minVariantPrice} />
      </span>
    </Link>
  );
}
