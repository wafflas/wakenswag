import {useEffect, useLayoutEffect, type RefObject} from 'react';

const useBrowserLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;
const FOCUSABLE_SELECTOR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Shared lifecycle for the three full-screen dialogs, including their HUD. */
export function useModalDialog({
  dialogRef,
  isOpen,
  onClose,
  openerRef,
}: {
  dialogRef: RefObject<HTMLDivElement>;
  isOpen: boolean;
  onClose: () => void;
  openerRef?: RefObject<HTMLElement>;
}) {
  useBrowserLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    const previousFocus = openerRef?.current ?? document.activeElement;
    const previousAction =
      previousFocus instanceof HTMLElement
        ? previousFocus.dataset.controllerAction
        : undefined;
    const previousOverflow = document.body.style.overflow;
    const controls = document.querySelector<HTMLElement>(
      '[data-modal-controls]',
    );
    const inertElements = new Map<HTMLElement, boolean>();
    let current: HTMLElement = dialog;

    // Disable siblings along the dialog's ancestor chain, preserving the HUD.
    while (current.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (
          sibling instanceof HTMLElement &&
          sibling !== current &&
          !sibling.contains(controls)
        ) {
          inertElements.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      if (current.parentElement === document.body) break;
      current = current.parentElement;
    }

    document.body.style.overflow = 'hidden';
    dialog.focus();

    const isInside = (target: EventTarget | null) =>
      target instanceof Node &&
      (dialog.contains(target) || Boolean(controls?.contains(target)));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      if (event.key !== 'Tab') return;

      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ...(controls?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []),
      ].filter(
        (element) =>
          !element.closest('[inert]') && element.getClientRects().length > 0,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog ||
          !isInside(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !isInside(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const handleFocus = (event: FocusEvent) => {
      if (!isInside(event.target)) dialog.focus();
    };
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocus);
      document.body.style.overflow = previousOverflow;
      for (const [element, wasInert] of inertElements) element.inert = wasInert;
      // The HUD replaces its buttons while a dialog is open. Restore the
      // matching new button after React finishes committing the close render.
      queueMicrotask(() => {
        const target =
          previousFocus instanceof HTMLElement && previousFocus.isConnected
            ? previousFocus
            : [
                ...(controls?.querySelectorAll<HTMLElement>(
                  '[data-controller-action]',
                ) ?? []),
              ].find(
                (element) =>
                  element.dataset.controllerAction === previousAction,
              );
        const activeDialog = document.querySelector<HTMLElement>(
          '[aria-modal="true"]',
        );
        if (
          target &&
          !target.closest('[inert]') &&
          (!activeDialog ||
            activeDialog.contains(target) ||
            controls?.contains(target))
        )
          target.focus();
      });
    };
  }, [dialogRef, isOpen, onClose, openerRef]);
}
