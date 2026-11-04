import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import androidChrome192 from '~/assets/favicons/android-chrome-192x192.png?url';
import androidChrome512 from '~/assets/favicons/android-chrome-512x512.png?url';
import appleTouchIcon from '~/assets/favicons/apple-touch-icon.png?url';
import favicon16 from '~/assets/favicons/favicon-16x16.png?url';
import favicon32 from '~/assets/favicons/favicon-32x32.png?url';
import favicon48 from '~/assets/favicons/favicon-48x48.png?url';
import faviconIco from '~/assets/favicons/favicon.ico?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/layout/PageLayout';
import {ButtonSound} from './components/shared/ButtonSound';
import {CRTOverlay} from './components/shared/CRTOverlay';
import {NotFoundPage} from './components/shared/NotFoundPage';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/x-icon', href: faviconIco},
    {rel: 'icon', type: 'image/png', sizes: '512x512', href: androidChrome512},
    {rel: 'icon', type: 'image/png', sizes: '192x192', href: androidChrome192},
    {rel: 'icon', type: 'image/png', sizes: '48x48', href: favicon48},
    {rel: 'icon', type: 'image/png', sizes: '32x32', href: favicon32},
    {rel: 'icon', type: 'image/png', sizes: '16x16', href: favicon16},
    {rel: 'apple-touch-icon', sizes: '180x180', href: appleTouchIcon},
  ];
}

export function loader({context}: Route.LoaderArgs) {
  const {storefront, cart, env} = context;
  return {
    cart: cart.get(),
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <CRTOverlay />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <ButtonSound />
      <PageLayout cart={data.cart}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const errorStatus = isRouteErrorResponse(error) ? error.status : 500;

  if (errorStatus === 404) {
    return <NotFoundPage />;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      <p>Something went wrong. Please refresh the page and try again.</p>
    </div>
  );
}
