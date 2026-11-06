import {useEffect} from 'react';
import {useLocation, useSearchParams} from 'react-router';
import {
  DRUMKITS_PER_PAGE,
  MOBILE_DRUMKITS_PER_PAGE,
} from './productListingUtils';

/** Keep Shopify pagination aligned with the number of visible grid slots. */
export function useDrumkitPageSize() {
  const {pathname} = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = searchParams.get('pageSize');

  useEffect(() => {
    if (pathname !== '/drumkits' && pathname !== '/drumkits/') return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    const syncPageSize = () => {
      const nextSize = String(
        desktop.matches ? DRUMKITS_PER_PAGE : MOBILE_DRUMKITS_PER_PAGE,
      );
      if ((pageSize ?? String(DRUMKITS_PER_PAGE)) === nextSize) return;

      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (desktop.matches) next.delete('pageSize');
          else next.set('pageSize', nextSize);
          // A cursor from a differently sized page could skip products.
          next.delete('cursor');
          next.delete('direction');
          return next;
        },
        {replace: true, preventScrollReset: true},
      );
    };

    syncPageSize();
    desktop.addEventListener('change', syncPageSize);
    return () => desktop.removeEventListener('change', syncPageSize);
  }, [pageSize, pathname, setSearchParams]);
}
