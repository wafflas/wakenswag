import {
  useCallback,
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {OVERLAY_FADE_DURATION_MS} from '~/components/animations/animationUtils';
import {useExiting} from '~/components/animations/useExiting';

type AsideType = 'search' | 'cart' | 'closed';
type AsideContextValue = {
  type: AsideType;
  isExiting: boolean;
  open: (mode: AsideType) => void;
  close: () => void;
  openerRef: RefObject<HTMLElement | null>;
  inputMode: 'keyboard' | 'pointer';
};

const AsideContext = createContext<AsideContextValue | null>(null);
const OPEN_CART_EVENT = 'wakenswag:open-cart';

export function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const [isExiting, setIsExiting] = useState(false);
  const [inputMode, setInputMode] = useState<'keyboard' | 'pointer'>(
    'keyboard',
  );
  const openerRef = useRef<HTMLElement | null>(null);

  // Preserve the input mode as the controls move between page and dialog.
  useEffect(() => {
    const handlePointerDown = () => setInputMode('pointer');
    const handleKeyDown = () => setInputMode('keyboard');
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const open = useCallback((mode: AsideType) => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setType(mode);
    setIsExiting(false);
  }, []);

  useEffect(() => {
    const handleOpenCart = () => open('cart');
    const configureOpenCart = () => {
      window.Shopify?.actions?.openCart.configure({
        // Standard Actions keeps this handler for the document's lifetime.
        // Dispatch through the DOM so it never retains an unmounted provider.
        handler: async () => {
          document.dispatchEvent(new Event(OPEN_CART_EVENT));
        },
      });
    };
    document.addEventListener(OPEN_CART_EVENT, handleOpenCart);
    configureOpenCart();
    document.addEventListener('DOMContentLoaded', configureOpenCart, {
      once: true,
    });
    return () => {
      document.removeEventListener(OPEN_CART_EVENT, handleOpenCart);
      document.removeEventListener('DOMContentLoaded', configureOpenCart);
    };
  }, [open]);

  const close = useCallback(() => {
    if (type !== 'closed') setIsExiting(true);
  }, [type]);
  const finishClose = useCallback(() => {
    setType('closed');
    setIsExiting(false);
  }, []);

  useExiting(isExiting ? finishClose : undefined, OVERLAY_FADE_DURATION_MS);

  const value = useMemo(
    () => ({type, isExiting, open, close, openerRef, inputMode}),
    [close, inputMode, isExiting, open, type],
  );
  return (
    <AsideContext.Provider value={value}>{children}</AsideContext.Provider>
  );
}

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) throw new Error('useAside must be used within an AsideProvider');
  return aside;
}
