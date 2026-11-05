import {Suspense, useEffect, useRef} from 'react';
import {Await} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {ControllerFooter} from './ControllerFooter';

interface AppControllerFooterProps {
  cart: Promise<CartApiQueryFragment | null>;
}

/**
 * Resolves streamed cart data while keeping the controls available.
 * The outer footer stays mounted so dialog focus handling can track it.
 */
export function AppControllerFooter({cart}: AppControllerFooterProps) {
  const controlsRef = useRef<HTMLElement>(null);
  const fallback = <ControllerFooter cart={null} />;

  useEffect(() => {
    const handlePointerDown = () =>
      controlsRef.current?.setAttribute('data-input-mode', 'pointer');
    const handleKeyDown = () =>
      controlsRef.current?.setAttribute('data-input-mode', 'keyboard');

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <footer
      data-modal-controls
      data-input-mode="keyboard"
      ref={controlsRef}
      className={[
        'fixed inset-x-0 bottom-0 z-50',
        'px-2 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-5',
      ].join(' ')}
    >
      <Suspense fallback={fallback}>
        <Await resolve={cart} errorElement={fallback}>
          {(resolvedCart) => <ControllerFooter cart={resolvedCart} />}
        </Await>
      </Suspense>
    </footer>
  );
}
