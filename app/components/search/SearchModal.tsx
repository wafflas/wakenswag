import {useRef} from 'react';
import {useAside} from '~/components/layout/Aside';
import {SearchScreen} from './SearchScreen';
import {useModalDialog} from '~/components/layout/useModalDialog';

/** Full-screen PS2 system browser search dialog. */
export function SearchModal() {
  const {close, type, openerRef} = useAside();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = type === 'search';

  useModalDialog({dialogRef, isOpen, onClose: close, openerRef});

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
