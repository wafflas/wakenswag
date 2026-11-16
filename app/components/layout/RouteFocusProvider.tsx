import {
  createContext,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';

interface RouteFocusPage {
  pathname: string;
  hadProductDialog: boolean;
  pending: boolean;
}

export const RouteFocusContext =
  createContext<MutableRefObject<RouteFocusPage | null> | null>(null);

/** Keeps navigation focus history when an error replaces the root layout. */
export function RouteFocusProvider({children}: {children: ReactNode}) {
  const pageRef = useRef<RouteFocusPage | null>(null);
  return (
    <RouteFocusContext.Provider value={pageRef}>
      {children}
    </RouteFocusContext.Provider>
  );
}
