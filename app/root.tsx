import {
  gql,
  handleShopifyRoutes,
  handleShopifyRedirects,
} from '@shopify/hydrogen';
import {ShopifyScripts} from '@shopify/hydrogen/react';
import {useNonce} from '~/lib/nonce';
import {CartProvider} from '~/lib/cart';
import {cartHandlers} from '~/lib/cartHandlers.server';
import {predictiveSearchHandlers} from '~/lib/predictiveSearch.server';
import {
  envContext,
  storefrontClientContext,
  routeTemplates,
  publicDataCache,
} from '~/lib/context';
import {setupConsent} from '~/lib/consent';
import {StorefrontAnalytics} from '~/components/analytics/StorefrontAnalytics';
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
  useNavigate,
} from 'react-router';
import type {Route} from './+types/root';
import androidChrome192 from '~/assets/favicons/android-chrome-192x192.png?url';
import androidChrome512 from '~/assets/favicons/android-chrome-512x512.png?url';
import appleTouchIcon from '~/assets/favicons/apple-touch-icon.png?url';
import favicon16 from '~/assets/favicons/favicon-16x16.png?url';
import favicon32 from '~/assets/favicons/favicon-32x32.png?url';
import favicon48 from '~/assets/favicons/favicon-48x48.png?url';
import faviconIco from '~/assets/favicons/favicon.ico?url';
import openGraphImage from '~/assets/wakenswagOGimage2.png?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/layout/PageLayout';
import {ButtonSound} from './components/shared/ButtonSound';
import {CRTOverlay} from './components/shared/CRTOverlay';
import {NotFoundPage} from './components/shared/NotFoundPage';
import {useRouteFocus} from './components/layout/useRouteFocus';

export type RootLoader = typeof loader;

export const meta: Route.MetaFunction = ({error}) => {
  if (error === undefined || error === null) return [];

  const errorStatus = isRouteErrorResponse(error) ? error.status : 500;
  return [
    {title: errorStatus === 404 ? 'Wake N Swag | 404' : 'Wake N Swag | Error'},
    {name: 'robots', content: 'noindex'},
  ];
};

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

export const middleware: Route.MiddlewareFunction[] = [
  async ({context, request}, next) => {
    const storefrontClient = context.get(storefrontClientContext);
    const requestContext = storefrontClient.requestContext;
    const pathname = new URL(request.url).pathname;
    const isRemovedCommerceRoute = /^\/(?:cart\/.+|discount\/)/.test(pathname);
    const matched = isRemovedCommerceRoute
      ? null
      : handleShopifyRoutes({
          request,
          requestContext,
          storefrontClient,
          routeTemplates,
          handlers: [cartHandlers, predictiveSearchHandlers],
        });
    if (matched) return await matched;
    const response = await next();
    if (response.status === 404 && !isRemovedCommerceRoute) {
      const redirect = await handleShopifyRedirects({
        request,
        storefrontClient,
        routeTemplates,
      });
      if (redirect) return redirect;
    }
    requestContext.applyResponseHeaders(response.headers);
    return response;
  },
];

const SHOP_QUERY = gql(
  `query ShopData { shop {id} localization {country {currency {isoCode}}} }`,
);
export async function loader({context, request}: Route.LoaderArgs) {
  const storefront = context.get(storefrontClientContext);
  const env = context.get(envContext);
  const cart = cartHandlers
    .get({request, storefrontClient: storefront})
    .then((result) => result.data);
  const {data, errors} = await storefront.graphql(SHOP_QUERY, {
    cache: publicDataCache,
  });
  if (errors?.length || !data?.shop.id)
    throw new Response('Store is unavailable', {status: 502});
  return {
    socialImageUrl: new URL(openGraphImage, request.url).href,
    cart,
    shop: {
      shopId: data.shop.id,
      storefrontId: env.PUBLIC_STOREFRONT_ID ?? '',
      myshopifyDomain: env.PUBLIC_STORE_DOMAIN,
    },
    i18n: {
      ...storefront.locale,
      currency: data.localization.country.currency.isoCode,
    },
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  useRouteFocus();
  const nonce = useNonce();
  const navigate = useNavigate();
  const data = useRouteLoaderData<RootLoader>('root');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        {/* Keep the shared image when a child route supplies its own meta. */}
        {data?.socialImageUrl ? (
          <>
            <meta property="og:image" content={data.socialImageUrl} />
            <meta property="og:image:type" content="image/png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Wake N Swag" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content={data.socialImageUrl} />
            <meta name="twitter:image:alt" content="Wake N Swag" />
          </>
        ) : null}
        <Links />
        {data ? (
          <ShopifyScripts
            shop={data.shop}
            i18n={data.i18n}
            nonce={nonce}
            routes={routeTemplates}
            navigate={(url) => {
              void navigate(url);
            }}
            consent={{mode: 'custom-banner', setup: setupConsent}}
            analytics={{
              channel: data.shop.storefrontId ? 'hydrogen' : 'headless',
            }}
            shopifyAnalytics={Boolean(data.shop.storefrontId)}
          />
        ) : null}
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
    <CartProvider initialData={data.cart}>
      <StorefrontAnalytics />
      <ButtonSound />
      <PageLayout>
        <Outlet />
      </PageLayout>
    </CartProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const root = useRouteLoaderData<RootLoader>('root');
  const errorStatus = isRouteErrorResponse(error) ? error.status : 500;

  if (errorStatus === 404) {
    return (
      <CartProvider initialData={root?.cart ?? {cart: null}}>
        <NotFoundPage />
      </CartProvider>
    );
  }

  return (
    <div className="route-error">
      <h1 data-route-focus tabIndex={-1}>
        Oops
      </h1>
      <h2>{errorStatus}</h2>
      <p>Something went wrong. Please refresh the page and try again.</p>
    </div>
  );
}
