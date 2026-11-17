import {useRef, type ReactNode, type RefObject} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {FadeTransition} from '~/components/animations/FadeTransition';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';

interface StorefrontDialogProps {
  children: ReactNode;
  className: string;
  isExiting?: boolean;
  isActive?: boolean;
  onClose: () => void;
  openerRef?: RefObject<HTMLElement | null>;
  title: string;
}

/** Shared dialog behavior, animation and controls for product, search and cart. */
export function StorefrontDialog({
  children,
  className,
  isExiting = false,
  isActive = true,
  onClose,
  openerRef,
  title,
}: StorefrontDialogProps) {
  const openedFromRef = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        // The owner unmounts the dialog after its existing exit animation.
        if (!open) onClose();
      }}
    >
      <Dialog.Overlay className="fixed inset-0 z-40" />
      <Dialog.Content
        aria-label={title}
        aria-modal={isActive ? 'true' : undefined}
        aria-describedby={undefined}
        asChild
        onPointerDownOutside={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          // Reduced-motion dialogs can receive focus before Radix attaches its
          // document listener. Keep Escape responsive in that initial interval.
          if (isActive && event.key === 'Escape' && !event.defaultPrevented) {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
        onOpenAutoFocus={() => {
          openedFromRef.current =
            openerRef?.current ??
            (document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null);
        }}
        onCloseAutoFocus={(event) => {
          // Route-based dialogs have no Radix Trigger. The footer also replaces
          // its buttons, so find the replacement when the opener was removed.
          event.preventDefault();
          const opener = openerRef?.current ?? openedFromRef.current;
          const action = opener?.dataset.controllerAction;
          const href = opener?.getAttribute('href');
          const candidates = [
            opener,
            ...document.querySelectorAll<HTMLElement>(
              '[data-controller-action], a[href]',
            ),
          ];
          const target = candidates.find(
            (element) =>
              element &&
              element !== document.body &&
              element.isConnected &&
              !element.closest('[aria-hidden="true"], [inert]') &&
              (element === opener ||
                (action && element.dataset.controllerAction === action) ||
                (href && element.getAttribute('href') === href)),
          );
          target?.focus({preventScroll: true});
        }}
      >
        <div className="fixed inset-0 z-40">
          <FadeTransition className={className} isExiting={isExiting}>
            {children}
          </FadeTransition>
          {isActive ? <AppControllerFooter inDialog /> : null}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
