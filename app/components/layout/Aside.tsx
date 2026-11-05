import {
  useCallback,
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
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
  openerRef: RefObject<HTMLElement>;
};

const AsideContext = createContext<AsideContextValue | null>(null);

export function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const [isExiting, setIsExiting] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  // Stable callbacks keep dialog listeners from restarting on unrelated renders.
  const open = useCallback((mode: AsideType) => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setType(mode);
    setIsExiting(false);
  }, []);
  const close = useCallback(() => {
    if (type !== 'closed') setIsExiting(true);
  }, [type]);
  const finishClose = useCallback(() => {
    setType('closed');
    setIsExiting(false);
  }, []);

  useExiting(isExiting ? finishClose : undefined, OVERLAY_FADE_DURATION_MS);

  const value = useMemo(
    () => ({type, isExiting, open, close, openerRef}),
    [close, isExiting, open, type],
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
