import {
  ServerRouter,
  type RouterContextProvider,
  type EntryContext,
} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';
import {NonceProvider} from '~/lib/nonce';
import {envContext} from '~/lib/context';
import {RouteFocusProvider} from '~/components/layout/RouteFocusProvider';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: RouterContextProvider,
) {
  const env = context.get(envContext);
  const csp = createContentSecurityPolicy({
    shop: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || env.PUBLIC_STORE_DOMAIN,
      storeDomain: env.PUBLIC_STORE_DOMAIN,
    },
  });

  const {nonce} = csp;
  const body = await renderToReadableStream(
    <NonceProvider value={nonce}>
      <RouteFocusProvider>
        <ServerRouter
          context={reactRouterContext}
          url={request.url}
          nonce={nonce}
        />
      </RouteFocusProvider>
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  csp.applyResponseHeaders(responseHeaders);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
