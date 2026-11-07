import {useLocation} from 'react-router';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';

export function isDefaultTitleOption(
  option: Pick<SelectedOption, 'name' | 'value'>,
) {
  return (
    option.name.toLowerCase() === 'title' &&
    option.value.toLowerCase() === 'default title'
  );
}

export function isProductDetailPath(pathname: string): boolean {
  return /^\/(?:swag|drumkits)\/[^/]+\/?$/.test(pathname);
}

export function getProductListingPath(pathname: string): '/swag' | '/drumkits' {
  if (pathname === '/drumkits' || pathname.startsWith('/drumkits/')) {
    return '/drumkits';
  }

  return '/swag';
}

export function getProductPath(handle: string, pathname: string) {
  const localeMatch = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const localePrefix = localeMatch?.[0] ?? '/';
  const normalizedPathname = pathname.replace(localePrefix, '/');
  const listingPath = getProductListingPath(normalizedPathname);

  return `${localePrefix}${listingPath.slice(1)}/${handle}`;
}

export function getProductListingPathForProduct(product: {
  productType?: string | null;
  collections?: {nodes: Array<{handle: string}>} | null;
}): '/swag' | '/drumkits' {
  const isDrumkitCollection = product.collections?.nodes.some(
    ({handle}) => handle === 'drumkits',
  );
  const isDrumkitType = /^drum\s*kits?$/i.test(
    product.productType?.trim() ?? '',
  );
  return isDrumkitCollection || isDrumkitType ? '/drumkits' : '/swag';
}

export function useVariantUrl(
  handle: string,
  selectedOptions?: SelectedOption[],
) {
  const {pathname} = useLocation();

  return getVariantUrl({
    handle,
    pathname,
    searchParams: new URLSearchParams(),
    selectedOptions,
  });
}

export function getVariantUrl({
  handle,
  pathname,
  searchParams,
  selectedOptions,
}: {
  handle: string;
  pathname: string;
  searchParams: URLSearchParams;
  selectedOptions?: SelectedOption[];
}) {
  const path = getProductPath(handle, pathname);
  const variantParams = new URLSearchParams(searchParams);

  selectedOptions
    ?.filter((option) => !isDefaultTitleOption(option))
    .forEach((option) => {
      variantParams.set(option.name, option.value);
    });

  const searchString = variantParams.toString();

  return path + (searchString ? `?${searchString}` : '');
}
