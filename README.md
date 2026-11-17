# Wake N Swag

Custom Shopify storefront using **Hydrogen 2026.10.3, React 19, React Router 7 and Oxygen**. The PS2 interface, `/swag`, `/drumkits`, policy pages and cart/search dialogs are app-owned components. This migration keeps React Router; it introduces no Next.js dependency.

## Local development

Use Node **22.12+ on the 22 line, or Node 24**, and npm:

```sh
npm ci
npx --no-install hydrogen skills sync
npm run dev
```

Configure `.env` with `PUBLIC_STORE_DOMAIN` and either `PRIVATE_STOREFRONT_API_TOKEN` (Oxygen) or `PUBLIC_STOREFRONT_API_TOKEN`. A mock.shop domain uses a public client without a token. `PUBLIC_STOREFRONT_ID` identifies the Hydrogen storefront. `PUBLIC_CHECKOUT_DOMAIN` is optional for CSP when checkout uses another domain. Keep all credentials out of Git. For the deterministic local test store, use `npm run test:e2e:serve`; its separate fixture environment contains no credentials.

`npm run dev:https` enables the SDK's HTTPS helper. Customer accounts are not implemented in this storefront; adding them requires their own handlers, session manager and Shopify configuration.

## Request and UI flow

1. `server.ts` receives Oxygen's request/env/execution context. `app/lib/context.ts` creates a fresh Shopify request context and Storefront client for each request, including a trusted buyer IP for private clients. It shares Oxygen's cache and schedules cache refreshes with `waitUntil`.
2. Root middleware delegates `/api/cart` and `/api/predictive-search` to the new Hydrogen handlers, then runs React Router loaders and Shopify URL redirects. `/cart` remains a redirect to the home page; the cart itself remains a dialog.
3. Loaders call `storefrontClient.graphql()`. Public queries explicitly use the former default policy (1 second fresh, up to 24 hours stale while refreshing); cart queries and responses stay private and uncached. A streamed cart promise lets pages render without waiting for the basket.
4. Typed `CartProvider` and `ProductProvider` bindings own optimistic cart updates and variant selection. The custom cart handler preserves the single-copy drumkit rule on the server, including native form submissions. Prices/totals always come from Shopify. Search uses the SDK's debounced provider and ignores stale responses.
5. `ShopifyScripts` sets up browser actions, analytics and consent. The existing custom banner waits for a loaded Customer Privacy API; analytics delivery remains consent-gated. A fresh CSP nonce accompanies every server-rendered document.

GraphQL documents use `gql()` and inferred result types. `npm run codegen` validates those documents and generates React Router route types; the old `storefrontapi.generated.d.ts` generator is removed. SDK-managed skills in `.agents/skills` and `.claude/skills` must stay aligned with the installed Hydrogen version.

## Validation and deployment

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run preview` builds and runs the production Oxygen worker locally. `npm run deploy` first builds the production entry, then uploads `dist/client` and `dist/server` through Shopify CLI. The GitHub Oxygen workflow runs the quality workflow before deployment. No migration branch should be pushed as a way of asking for review without first checking that workflow's deployment behavior.

See [TESTING.md](TESTING.md) for fixtures, the 1,000-user local stress workload and live-integration limits.

References: [Hydrogen migration](https://shopify.dev/docs/storefronts/hydrogen/migrate), [typed queries](https://shopify.dev/docs/storefronts/hydrogen/data-fetching/typed-queries), [Oxygen deployment](https://shopify.dev/docs/storefronts/hydrogen/deploy/oxygen).
