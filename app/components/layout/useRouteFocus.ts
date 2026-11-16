import {useContext, useEffect} from 'react';
import {useLocation} from 'react-router';
import {getProductListingPath} from '~/lib/variants';
import {RouteFocusContext} from './RouteFocusProvider';

/** Gives ordinary pages a reading start without replacing dialog focus behavior. */
export function useRouteFocus() {
  const {pathname} = useLocation();
  const pageRef = useContext(RouteFocusContext);

  useEffect(() => {
    if (!pageRef) return;
    const previous = pageRef.current;
    if (!previous || previous.pathname !== pathname) {
      pageRef.current = {
        pathname,
        hadProductDialog: !!document.querySelector(
          '[role="dialog"] [data-product-theme]',
        ),
        pending:
          !!previous &&
          !(
            previous.hadProductDialog &&
            getProductListingPath(previous.pathname) === pathname
          ),
      };
    }
    const page = pageRef.current;
    // Initial loads and query updates keep their focus; Radix restores products.
    if (!page?.pending) return;

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>('[data-route-focus]');
      if (!target) {
        page.pending = false;
        return;
      }
      const focusedAtStart = document.activeElement;
      const animations =
        target.closest('.route-fade-transition')?.getAnimations() ?? [];

      void Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(() => {
        if (cancelled) return;
        page.pending = false;
        if (
          !target.isConnected ||
          document.querySelector('[role="dialog"][aria-modal="true"]') ||
          target.closest(
            '[aria-hidden="true"], [inert], .route-fade-transition--out',
          )
        )
          return;
        // A user may have already moved focus while the fade was finishing.
        if (
          document.activeElement !== focusedAtStart &&
          document.activeElement !== document.body
        )
          return;
        target.focus({preventScroll: true});
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [pageRef, pathname]);
}
