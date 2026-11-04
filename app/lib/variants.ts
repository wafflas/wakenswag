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

export function getProductPath(handle: string, pathname: string) {
  const localeMatch = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const localePrefix = localeMatch?.[0] ?? '/';

  return `${localePrefix}merch/${handle}`;
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
