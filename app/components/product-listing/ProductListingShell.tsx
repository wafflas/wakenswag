import {useCallback, useEffect, useState, type ReactNode} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {CartControllerFooter} from '~/components/shared/CartControllerFooter';
import type {ControllerFooterAction} from '~/components/shared/ControllerFooter';
import {ProductListingHeader} from '~/components/product-listing/ProductListingHeader';

interface ProductListingShellProps {
  children: ReactNode;
  displayTitle: string;
  loadingDurationMs: number;
}

export function ProductListingShell({
  children,
  displayTitle,
  loadingDurationMs,
}: ProductListingShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isShowingLoadingScreen, setIsShowingLoadingScreen] = useState(true);
  const listingAnimationKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    setIsShowingLoadingScreen(true);

    const loadingTimer = window.setTimeout(() => {
      setIsShowingLoadingScreen(false);
    }, loadingDurationMs);

    return () => window.clearTimeout(loadingTimer);
  }, [listingAnimationKey, loadingDurationMs]);

  const openCart = useCallback(() => {
    void navigate('/cart');
  }, [navigate]);

  const getActions = useCallback(
    (cartCount: number): ControllerFooterAction[] => [
      {
        label: 'Back',
        onActivate: () => void navigate(-1),
        position: 'start',
        symbol: 'circle',
      },
      {
        label: 'Search',
        onActivate: () => void navigate('/search'),
        position: 'center',
        symbol: 'triangle',
      },
      {
        count: cartCount,
        label: 'Cart',
        onActivate: openCart,
        position: 'center',
        symbol: 'square',
      },
      {
        label: 'Filters',
        onActivate: () => undefined,
        position: 'end',
        symbol: 'cross',
      },
    ],
    [navigate, openCart],
  );

  return (
    <div
      className={[
        'relative isolate flex min-h-dvh flex-col overflow-hidden font-ps2 text-ps2-white',
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
      <CartControllerFooter actions={getActions} />
      {isShowingLoadingScreen ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 flex h-dvh w-screen items-center justify-center overflow-hidden font-ps2"
        >
          <p className="text-4xl lg:text-6xl text-ps2-white text-ps2-outline">
            Now loading...
          </p>
        </div>
      ) : null}
    </div>
  );
}
