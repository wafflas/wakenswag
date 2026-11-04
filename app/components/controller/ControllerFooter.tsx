import type {MouseEvent} from 'react';
import {useOptimisticCart} from '@shopify/hydrogen';
import {useLocation, useNavigate} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/layout/Aside';
import {ControllerActionCount} from './ControllerActionCount';
import {ControllerSymbol} from './ControllerSymbol';
import {getControllerBackPath} from './controllerUtils';

const ACTION_CLASS_NAME = [
  'ps2-controller-action flex min-h-9 items-center gap-1 whitespace-nowrap sm:min-h-11 sm:gap-1.5',
  'border-0 bg-transparent p-0',
  'text-[0.625rem] text-ps2-muted sm:text-xs',
  'cursor-pointer',
].join(' ');

interface ControllerFooterProps {
  cart: CartApiQueryFragment | null;
}

/** The storefront's Back, Search and Cart controls. */
export function ControllerFooter({cart}: ControllerFooterProps) {
  const optimisticCart = useOptimisticCart(cart);
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const {close, open, type} = useAside();
  const isDialogOpen = type !== 'closed';
  const backPath = getControllerBackPath(pathname);

  function handleBack(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.focus();
    if (isDialogOpen) {
      close();
    } else if (backPath) {
      void navigate(backPath);
    }
  }

  return (
    <div
      aria-label="Screen actions"
      className="flex w-full items-center justify-between"
      role="toolbar"
    >
      <div className="flex items-center gap-3 px-2 sm:gap-7">
        {isDialogOpen || backPath ? (
          <button
            className={ACTION_CLASS_NAME}
            data-controller-action="Back"
            onClick={handleBack}
            type="button"
          >
            <ControllerSymbol symbol="circle" />
            <span>Back</span>
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 px-2 sm:gap-7">
        {!isDialogOpen ? (
          <>
            <button
              className={ACTION_CLASS_NAME}
              data-controller-action="Search"
              onClick={(event) => {
                event.currentTarget.focus();
                open('search');
              }}
              type="button"
            >
              <ControllerSymbol symbol="triangle" />
              <span>Search</span>
            </button>
            <button
              className={ACTION_CLASS_NAME}
              data-controller-action="Cart"
              onClick={(event) => {
                event.currentTarget.focus();
                open('cart');
              }}
              type="button"
            >
              <ControllerSymbol symbol="square" />
              <span>
                Cart{' '}
                <ControllerActionCount
                  count={optimisticCart?.totalQuantity ?? 0}
                />
              </span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
