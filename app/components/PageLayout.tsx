import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

/**
 * Intentionally minimal storefront shell.
 *
 * Commerce data remains available in the props above so a header, cart drawer,
 * search, and footer can be added without changing the root loader.
 */
export function PageLayout({children = null}: PageLayoutProps) {
  return <main>{children}</main>;
}
