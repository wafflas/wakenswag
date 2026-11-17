# Wake N Swag

Custom Shopify storefront using **Hydrogen 2026.10.3, React 19, React Router 7 and Oxygen**. The PS2 interface, `/swag`, `/drumkits`, policy pages and cart/search dialogs are app-owned components. Installed versions are recorded in `package.json` and `package-lock.json`.

## Documentation

- [CONVENTIONS.md](CONVENTIONS.md): component responsibilities, types, state, routing and Hydrogen integration.
- [TESTING.md](TESTING.md): commands, fixtures, recorded verification, stress-test failures and live-store checks.
- [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md): implemented accessibility fixes, remaining issues and manual checks.
- [AGENTS.md](AGENTS.md): instructions for coding agents. `CLAUDE.md` imports this same file.

Version-matched Shopify implementation guides are managed by the Hydrogen SDK in `.agents/skills` and `.claude/skills`. Refresh them with `hydrogen skills sync` when upgrading Hydrogen; do not edit these generated copies as project documentation. Project change history is kept in Git.

## Local development

Use Node **22.12+ on the 22 line, or Node 24**, and npm:

```sh
npm ci
npx --no-install hydrogen skills sync
npm run dev
```

Configure `.env` with `PUBLIC_STORE_DOMAIN` and either `PRIVATE_STOREFRONT_API_TOKEN` (Oxygen) or `PUBLIC_STOREFRONT_API_TOKEN`. A mock.shop domain uses a public client without a token. `PUBLIC_STOREFRONT_ID` identifies the Hydrogen storefront. `PUBLIC_CHECKOUT_DOMAIN` is optional for CSP when checkout uses another domain. Keep all credentials out of Git. For the deterministic local test store, use `npm run test:e2e:serve`; its separate fixture environment contains no credentials.

With no store configuration, `npm run dev` defaults to tokenless `mock.shop`, which provides sample apparel. This fallback is limited to development and disabled when a token, storefront ID or checkout domain is already configured. Production always requires `PUBLIC_STORE_DOMAIN`. The resolved domain is shared by the client, root loader and CSP setup.

`npm run dev:https` enables the SDK's HTTPS helper. Customer accounts are not implemented in this storefront; adding them requires their own handlers, session manager and Shopify configuration.

## Request and UI flow

1. `server.ts` receives Oxygen's request/env/execution context. `app/lib/context.ts` creates a fresh Shopify request context and Storefront client for each request, including a trusted buyer IP for private clients. It shares Oxygen's cache and schedules cache refreshes with `waitUntil`.
2. Root middleware delegates `/api/cart` and `/api/predictive-search` to the new Hydrogen handlers, then runs React Router loaders and Shopify URL redirects. `/cart` remains a redirect to the home page; the cart itself remains a dialog.
3. Loaders call `storefrontClient.graphql()`. Public queries explicitly use `publicDataCache` (1 second fresh, with the remainder of a 24-hour window available while refreshing); cart queries and responses stay private and uncached. A streamed cart promise lets pages render without waiting for the basket.
4. Typed `CartProvider` and `ProductProvider` bindings own optimistic cart updates and variant selection. The custom cart handler preserves the single-copy drumkit rule on the server, including native form submissions. Prices/totals always come from Shopify. Search uses the SDK's debounced provider and ignores stale responses.
5. `ShopifyScripts` sets up browser actions, analytics and consent. The existing custom banner waits for a loaded Customer Privacy API; analytics delivery remains consent-gated. A fresh CSP nonce accompanies every server-rendered document.

GraphQL documents use `gql()` and inferred result types. `npm run codegen` validates those documents and generates React Router route types.

## Routes

- `/`: main menu.
- `/swag` and `/drumkits`: cursor-paginated listings. `/swag/:handle` and `/drumkits/:handle` open the corresponding product dialogs.
- `/info` and `/info/:section`: information menu and published Shopify policies.
- `/api/cart`: private cart reads and mutations. `/cart` redirects home; there is no full-page cart fallback.
- `/api/predictive-search`: the search dialog's resource endpoint. `/search` delegates to the same search handler and renders no results page.
- `/robots.txt`, `/sitemap.xml`, `/sitemap-pages.xml` and `/sitemap/:type/:page.xml`: crawler resources.

Removed `/merch`, `/cart/:lines` and `/discount/:code` routes remain unsupported. Accounts, filters/sorting and a market selector are not implemented. See `app/routes/` and root middleware for the actual route behavior.

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

`npm run preview` builds and runs the production Oxygen worker locally. `npm run deploy` first builds the production entry, then uploads `dist/client` and `dist/server` through Shopify CLI. The GitHub Oxygen workflow runs the quality workflow before deployment. Its current trigger includes pushes to every branch; check that workflow before pushing a review branch.

Oxygen variable changes apply to new deployments. Existing deployments keep their previous values until the environment is redeployed; saving or pushing a variable alone does not update the running deployment. See [Oxygen environments and variables](https://shopify.dev/docs/storefronts/hydrogen/deploy/oxygen/environments).

See [TESTING.md](TESTING.md) for fixtures, the 1,000-user local stress workload and live-integration limits.

References: [Hydrogen migration](https://shopify.dev/docs/storefronts/hydrogen/migrate), [typed queries](https://shopify.dev/docs/storefronts/hydrogen/data-fetching/typed-queries), [Oxygen deployment](https://shopify.dev/docs/storefronts/hydrogen/deploy/oxygen).
