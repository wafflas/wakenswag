import {getProductListingPath, isProductDetailPath} from '~/lib/variants';

/** Product deep links return to their collection; other pages return home. */
export function getControllerBackPath(pathname: string): string | null {
  if (pathname === '/') return null;

  return isProductDetailPath(pathname) ? getProductListingPath(pathname) : '/';
}
