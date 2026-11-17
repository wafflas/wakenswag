import {useLocation, useRouteError} from 'react-router';
import {useOptionalCart} from '~/lib/cart';
import {useAside} from '~/components/layout/Aside';
import {isProductDetailPath} from '~/lib/variants';
import {ControllerFooter} from './ControllerFooter';

interface AppControllerFooterProps {
  inDialog?: boolean;
}

/**
 * Shows controls inside the active dialog, or on an ordinary page.
 * Reads the shared cart store without suspending or replacing focused controls.
 */
export function AppControllerFooter({
  inDialog = false,
}: AppControllerFooterProps) {
  const state = useOptionalCart((state) => state);
  const {pathname} = useLocation();
  const routeError = useRouteError();
  const {type, inputMode} = useAside();
  const isProductPage = isProductDetailPath(pathname) && !routeError;
  const isPageSlot = !inDialog && !isProductPage;
  const isSuppressed = isPageSlot && type !== 'closed';
  if (!inDialog && isProductPage) return null;

  return (
    <footer
      aria-hidden={isSuppressed ? true : undefined}
      data-modal-controls
      data-input-mode={inputMode}
      {...(isSuppressed ? {inert: true} : {})}
      className={[
        'fixed inset-x-0 bottom-0 z-50',
        'px-2 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-5',
        isSuppressed ? 'invisible pointer-events-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ControllerFooter cart={state?.data} isCartReady={!state?.loading} />
    </footer>
  );
}
