import type {ImgHTMLAttributes} from 'react';

interface StorefrontImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> {
  data: {
    url: string;
    width?: number | null;
    height?: number | null;
    altText?: string | null;
  };
  aspectRatio?: string;
}

/** Responsive Shopify CDN images; external image URLs pass through unchanged. */
export function StorefrontImage({
  data,
  aspectRatio,
  alt,
  style,
  loading = 'lazy',
  ...props
}: StorefrontImageProps) {
  const url = new URL(data.url);
  const isShopify = ['cdn.shopify.com', 'mock.shop'].some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
  );
  const widths = [100, 200, 400, 600, 800, 1200].filter(
    (width) => !data.width || width <= data.width,
  );
  const srcSet = isShopify
    ? widths
        .map((width) => {
          const sized = new URL(url);
          sized.searchParams.set('width', String(width));
          return `${sized.href} ${width}w`;
        })
        .join(', ')
    : undefined;
  return (
    <img
      {...props}
      alt={alt ?? data.altText ?? ''}
      src={data.url}
      srcSet={srcSet}
      width={data.width ?? undefined}
      height={data.height ?? undefined}
      loading={loading}
      decoding="async"
      style={{
        width: '100%',
        aspectRatio:
          aspectRatio ??
          (data.width && data.height
            ? `${data.width}/${data.height}`
            : undefined),
        ...style,
      }}
    />
  );
}
