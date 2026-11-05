import {useId} from 'react';
import {Link, useLocation} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {getProductListingPath, getProductPath} from '~/lib/variants';

const productImageClassName =
  'size-22 max-w-none object-cover md:size-24 lg:size-[min(10vw,calc((100dvh-18rem)/3),10rem)]';

interface ProductItemProps {
  product: ProductItemFragment;
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
  const {pathname} = useLocation();
  const descriptionId = useId();
  const isDrumkit = getProductListingPath(pathname) === '/drumkits';
  const image = product.featuredImage;
  const imageClassName = isDrumkit
    ? 'ps2-drumkit-image'
    : productImageClassName;
  const productUrl = getProductPath(product.handle, pathname);

  return (
    <Link
      aria-current={isSelected ? 'true' : undefined}
      aria-describedby={
        isDrumkit && isSelected && product.description
          ? descriptionId
          : undefined
      }
      className={[
        'ps2-product-item group relative inline-flex h-fit w-fit shrink-0 place-self-center',
        isDrumkit ? 'ps2-drumkit-item' : 'ps2-product-item-glow',
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
      {isDrumkit ? (
        <span aria-hidden="true" className="ps2-drumkit-heading">
          <span className="ps2-drumkit-title">{product.title}</span>
          <span className="ps2-drumkit-indicator" />
        </span>
      ) : null}

      {image ? (
        <Image
          alt=""
          aspectRatio={isDrumkit ? undefined : '1/1'}
          className={imageClassName}
          data={image}
          loading={loading}
          sizes={
            isDrumkit
              ? '(min-width: 1024px) 15vw, 45vw'
              : '(min-width: 1024px) min(10vw, calc((100dvh - 18rem) / 3), 10rem), (min-width: 768px) 96px, 88px'
          }
        />
      ) : (
        <span aria-hidden="true" className={`block ${imageClassName}`} />
      )}

      {isDrumkit ? (
        <span
          aria-hidden="true"
          className="ps2-drumkit-description"
          id={descriptionId}
        >
          {product.description}
        </span>
      ) : null}

      <span className="sr-only">
        {product.title}
        {isSelected ? ', selected' : ''},{' '}
        <Money data={product.priceRange.minVariantPrice} />
      </span>
    </Link>
  );
}
