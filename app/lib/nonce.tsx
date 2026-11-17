import {createContext, useContext} from 'react';
export const NonceContext = createContext<string | undefined>(undefined);
export const NonceProvider = NonceContext.Provider;
export function useNonce() {
  return useContext(NonceContext);
}
