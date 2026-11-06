import {getProductListingPath, isProductDetailPath} from '~/lib/variants';

/** Detail screens return to their menu; top-level screens return home. */
export function getControllerBackPath(pathname: string): string | null {
  if (pathname === '/') return null;
  if (pathname.startsWith('/info/') && pathname !== '/info/') return '/info';

  return isProductDetailPath(pathname) ? getProductListingPath(pathname) : '/';
}
