import {useEffect, useRef, useState, type ReactNode} from 'react';
import {useLocation} from 'react-router';
import {ProductListingHeader} from '~/components/product-listing/ProductListingHeader';

interface ProductListingShellProps {
  animationKey?: string;
  children: ReactNode;
  displayTitle: string;
  loadingDurationMs: number;
}

export function ProductListingShell({
  animationKey,
  children,
  displayTitle,
  loadingDurationMs,
}: ProductListingShellProps) {
  const location = useLocation();
  const isProductDetailRoute = /^\/merch\/[^/]+\/?$/.test(location.pathname);
  const wasProductDetailRouteRef = useRef(isProductDetailRoute);
  const [isShowingLoadingScreen, setIsShowingLoadingScreen] = useState(
    () => !isProductDetailRoute,
  );

  const listingAnimationKey =
    animationKey ?? `${location.pathname}${location.search}`;

  useEffect(() => {
    const returningFromProductDetail =
      wasProductDetailRouteRef.current && !isProductDetailRoute;
    wasProductDetailRouteRef.current = isProductDetailRoute;

    // Nested PDP mounts under the listing layout; never cover it with "Now loading..."
    if (isProductDetailRoute) {
      setIsShowingLoadingScreen(false);
      return;
    }

    // Closing the PDP must not replay the listing intro.
    if (returningFromProductDetail) {
      return;
    }

    setIsShowingLoadingScreen(true);

    const loadingTimer = window.setTimeout(() => {
      setIsShowingLoadingScreen(false);
    }, loadingDurationMs);

    return () => {
      window.clearTimeout(loadingTimer);
    };
  }, [isProductDetailRoute, listingAnimationKey, loadingDurationMs]);

  return (
    <div
      className={[
        'relative isolate flex min-h-dvh flex-col overflow-hidden',
        'font-ps2 text-ps2-white',
        '[background:linear-gradient(140deg,#c4c4c4_0%,#757575_40%,#303030_80%,#151515_100%)]',
      ].join(' ')}
    >
      <ProductListingHeader displayTitle={displayTitle} />

      <div
        className="relative z-10 flex-1 pb-20 sm:pb-24"
        key={listingAnimationKey}
      >
        {children}
      </div>

      {isShowingLoadingScreen ? (
        <div
          aria-hidden="true"
          className={[
            'pointer-events-none fixed inset-0 z-[60]',
            'flex h-dvh w-screen items-center justify-center',
            'overflow-hidden font-ps2',
          ].join(' ')}
        >
          <p className="text-4xl text-ps2-white text-ps2-outline lg:text-6xl">
            Now loading...
          </p>
        </div>
      ) : null}
    </div>
  );
}
