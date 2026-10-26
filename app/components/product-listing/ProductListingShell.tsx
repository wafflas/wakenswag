import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {useLocation} from 'react-router';
import {ProductListingHeader} from '~/components/product-listing/ProductListingHeader';
import {PRODUCT_LISTING_STAGGER_MS} from '~/components/product-listing/useProductListingSelection';

const ProductListingLoadingContext = createContext<
  (productCount: number) => void
>(() => {});

export function useProductListingLoading() {
  return useContext(ProductListingLoadingContext);
}

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
  const loadingTimerRef = useRef<number>();
  const [isShowingLoadingScreen, setIsShowingLoadingScreen] = useState(
    () => !isProductDetailRoute,
  );

  const listingAnimationKey =
    animationKey ?? `${location.pathname}${location.search}`;

  const showLoadingScreen = useCallback((durationMs: number) => {
    window.clearTimeout(loadingTimerRef.current);
    setIsShowingLoadingScreen(true);
    loadingTimerRef.current = window.setTimeout(() => {
      setIsShowingLoadingScreen(false);
    }, durationMs);
  }, []);

  const restartLoadingForProducts = useCallback(
    (productCount: number) => {
      showLoadingScreen(productCount * PRODUCT_LISTING_STAGGER_MS);
    },
    [showLoadingScreen],
  );

  useEffect(() => {
    const returningFromProductDetail =
      wasProductDetailRouteRef.current && !isProductDetailRoute;
    wasProductDetailRouteRef.current = isProductDetailRoute;

    // Nested PDP mounts under the listing layout; never cover it with "Now loading..."
    if (isProductDetailRoute) {
      window.clearTimeout(loadingTimerRef.current);
      setIsShowingLoadingScreen(false);
      return;
    }

    // Closing the PDP must not replay the listing intro.
    if (returningFromProductDetail) {
      return;
    }

    showLoadingScreen(loadingDurationMs);

    return () => {
      window.clearTimeout(loadingTimerRef.current);
    };
  }, [
    isProductDetailRoute,
    listingAnimationKey,
    loadingDurationMs,
    showLoadingScreen,
  ]);

  return (
    <ProductListingLoadingContext.Provider value={restartLoadingForProducts}>
      <div
        className={[
          'relative isolate flex h-dvh flex-col overflow-hidden',
          'font-ps2 text-ps2-white',
          '[background:linear-gradient(140deg,#c4c4c4_0%,#757575_40%,#303030_80%,#151515_100%)]',
        ].join(' ')}
      >
        <ProductListingHeader displayTitle={displayTitle} />

        <div
          className="relative z-10 min-h-0 flex-1 [&>*]:h-full"
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
    </ProductListingLoadingContext.Provider>
  );
}
