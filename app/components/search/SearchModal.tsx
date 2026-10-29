import {useEffect, useRef} from 'react';
import {useAside} from '~/components/layout/Aside';
import {SearchScreen} from './SearchScreen';

/** Full-screen PS2 system browser search dialog. */
export function SearchModal() {
  const {close, type} = useAside();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = type === 'search';

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [close, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      aria-label="System browser search"
      aria-modal="true"
      className="fixed inset-0 z-40 h-dvh overflow-hidden bg-[rgba(6,6,6,0.95)] font-ps2 text-ps2-muted"
      role="dialog"
      tabIndex={-1}
    >
      <SearchScreen onClose={close} />
    </div>
  );
}
