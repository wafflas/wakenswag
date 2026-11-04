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

type AsideType = 'search' | 'cart' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
  openerRef: RefObject<HTMLElement>;
};

const AsideContext = createContext<AsideContextValue | null>(null);

export function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const openerRef = useRef<HTMLElement | null>(null);
  // Stable callbacks keep dialog listeners from restarting on unrelated renders.
  const open = useCallback((mode: AsideType) => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setType(mode);
  }, []);
  const close = useCallback(() => setType('closed'), []);
  const value = useMemo(
    () => ({type, open, close, openerRef}),
    [close, open, type],
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
