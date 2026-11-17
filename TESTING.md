# Testing the storefront

## Setup and commands

Use Node 22.12+ on the 22 line, or Node 24 (local validation used Node 24.19.0) and npm:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run lint
npm run typecheck
npm run format:check
npm run build
```

`test` runs once; `test:watch` reruns relevant tests while editing. Coverage measures the unit/component/route suite, not Playwright. It reports uncovered authored application files rather than hiding them or setting an arbitrary percentage target. A passing build is separate from type checking, linting and browser testing. `build` runs React Router's production build; `typecheck` separately runs route type generation, TypeScript and `hydrogen gql check --fail-on-warn`. CI requires both checks.

Vitest 4.1.12 supports the installed Vite 8. A separate `vitest.config.ts` avoids loading Oxygen's Vite plugins for ordinary tests. jsdom supplies a simulated browser; React Testing Library and user-event exercise components. Vitest inlines Hydrogen and React Router so both use the same router context module. Shared fixtures replace only the external GraphQL/HTTP boundary. Real Hydrogen cart/product stores and Standard Actions run in component tests.

## Unit, component and route tests

- `tests/lib/`: variant URLs/default options, description extraction, product themes, search normalization/tracking, safe redirects and money/currency precision. Request-context tests cover the unconfigured development mock.shop fallback, explicit production configuration and trusted buyer-IP handling.
- `tests/lib/cartUtils.test.ts` and `tests/lib/componentUtils.test.ts`: cart-child grouping/pending content, controller navigation, cursor URL preservation and typing/sound target helpers. Existing description/theme/search tests import their consolidated feature utility modules directly.
- `tests/components/`: real purchase controls, stock/disabled/missing-variant states, pending submissions and recoverable cart errors inside a real memory data router.
- `tests/components/ButtonSound.test.tsx`: audio stays uninitialized until a click/key press, the first activation waits for decoding, StrictMode does not create startup audio engines, and unmount aborts downloads and prevents late playback.
- `tests/components/CartLineQuantity.test.tsx`: remove/decrease/increase actions, line identity, stock limits, numeric quantity editing, shared pending state and failure recovery after component simplification.
- `tests/components/ControllerFooter.test.tsx`: home/product/ordinary-page Back behavior, Search/Cart controls, pending and failed cart loading, optimistic quantity rollback, opening Cart before a pending add has a calculated price and focus restoration when the cart resolves during an open Search dialog. Transport failures and GraphQL error envelopes show a safe message and a full-page reload link instead of a false empty cart. Uses real router/provider/modal components rather than mocking their hooks.
- `tests/components/Aside.test.tsx`: overlay exit timing, repeated-close requests, cancellation when another overlay opens, reduced motion and timer cleanup on unmount. The permanent Shopify `openCart` handler dispatches a DOM event to the currently mounted provider, including after a remount. Existing route-exit tests cover the shared timer through navigation too.
- `tests/routes/`: real loaders/handlers with typed React Router contexts and a mocked GraphQL boundary; cart dispatch/cookies/redirects/failures, search boundaries, pagination variables, selected options, 404 and permalink validation. The generic root error screen also renders in a real memory router without a CartProvider: it shows safe error text and no cart/search controls.
- `tests/fixtures/catalog.ts`: query-type-compatible fictional product, variants, cards and cart. There are in-stock, unavailable and missing-variant states; E2E adds a 25-product catalog for multiple pages.

Example from the product component test:

```tsx
await user.click(screen.getByRole('button', {name: 'Add to cart'}));
expect(screen.getByRole('button', {name: 'Adding to cart...'})).toBeDisabled();
```

This checks what a customer sees and can do, without inspecting React state. Supply real router, cart and product providers for Hydrogen hooks/forms. Mock the API result, not those components' internal hooks. Use a controlled Promise to hold a request pending; release it and check the error/retry state. Avoid arbitrary sleeps and snapshots of entire pages.

Keep this centralized layout when extracting or inlining components. Existing parent tests stay in place: `ProductDetail.test.tsx` continues to test purchase behavior through ProductDetail after ProductPurchaseControls moves to its own file. Locate and preserve tests before changing component boundaries, update imports when needed and run the affected tests. New files beside production components are rejected by lint. Feature subfolders are optional when a group grows; the suggested unit/integration structure does not require moving the current well-organized suites.

## Browser tests

The cart is a modal rather than a page. Direct GET visits to `/cart` or `/cart/` redirect home. Cart forms POST to `/api/cart`, which handles adding, updating and removing products. The endpoint also accepts the SDK's JSON note/discount/attribute operations and native metadata forms, although those editors are not present in the UI. A JSON body changes one supported field per request; malformed and mixed-operation bodies are rejected before Shopify is queried. Route tests cover setting and clearing metadata, mutation variables and private cache headers. GET `/api/cart` returns `{cart: null}` without a cart cookie and private JSON with one. `/cart/:lines` and `/discount/:code` remain unsupported, matching the pre-migration behavior. Native product and quantity forms also use the new handler. Custom native bulk removal uses `intent=empty`; hydrated bulk removal uses Standard Actions, then refreshes the authoritative cart.

`playwright.config.ts` starts `npm run test:e2e:serve` on `http://localhost:4173`, waits for readiness and stops it afterward. Leave that port free; the suite refuses to reuse an existing server by default. During local development, `WAKENSWAG_E2E_REUSE_SERVER=1` explicitly reuses the fixture server. Chromium desktop and Pixel 7 mobile/touch emulation run the same journeys with two workers. Mobile emulation is not a real-device test.

`tests/e2e/server.ts` is a separate Oxygen worker entry. It constructs the real Hydrogen context and React Router request handler, and injects deterministic HTTP responses into the real Storefront client. Real GraphQL queries, SDK handlers, React Router middleware, SSR, hydration, cart cookies, optimistic stores and UI are exercised. The production `server.ts` never imports this entry and has no test-mode flag. `fixture.env` is checked-in fictional configuration, not a store credential.

Unexpected worker query operations throw rather than reaching the network. SDK proxy endpoints that use global fetch are blocked by the fixture entry before middleware; this suite does not validate their live behavior. Browser HTTPS requests are intercepted: images and pinned official Shopify Standard Actions/events/analytics scripts come from `tests/fixtures/shopify/`; other external requests are blocked. Privacy and performance services use test stubs. Cart mutation/read fault headers are handled only by the fixture worker. Read faults cover transport rejection and HTTP 200 GraphQL errors; reloading after either failure restores the saved cart. Each Playwright browser context gets its own cart cookie. The fixture cart increments `updatedAt` on every mutation, as the new cart reconciler expects. Public cache namespaces separate the inherited path-dependent fictional Swag/Drumkits catalogues; real store data is not path-dependent. The fixture cart deliberately models this suite's single-product journeys, not Shopify's entire cart engine; add multi-line/bundle fixture behavior before testing those scenarios.

Journeys cover home/navigation, collection listing/pagination with refresh/history, products/variants/prices/quantity, add/update/remove/empty cart, cookie persistence, checkout URL handoff, search/empty/failure/retry/stale responses, nested dialogs/focus/Escape, 404 and reduced-motion/normal animation timing. Cart/Search share the product's 300 ms entry fade and finish their 300 ms exit before unmounting; browser checks cover both Back and Escape, scroll locking and opener restoration. Checkout coverage checks the URL; it does not navigate to payment or submit an order.

Tests wait for React Router hydration before interacting with initially server-rendered controls. They wait for observable results or controlled requests rather than guessed delays. Scope selectors to the active dialog when another dialog remains mounted underneath it.

Useful focused commands:

```sh
npm run test:e2e -- --project=chromium
npm run test:e2e -- --grep 'cart'
npx playwright show-report
npx playwright show-trace test-results/<failed-test>/trace.zip
```

The HTML report is in `playwright-report/`; machine-readable results, failure screenshots and traces are under `test-results/`. Both directories and coverage output are ignored by Git. CI uploads browser artifacts on failure. Most tests intentionally block the external privacy script; the banner waits for `consentStatus === "loaded"` and remains safe when that service is unavailable.

Cookie and collection-analytics journeys use `tests/e2e/fixtures.ts` to supply a local privacy SDK, a performance-script stub and a successful analytics receiver. Hydrogen's actual consent checks, event queue and payload generation still run. Collection checks verify Swag/Drumkits IDs and handles, no delivery before consent, returning from product details and no collection event for directly opened or nested product pages. Collection pagination follows Hydrogen's normal URL-change tracking. Missing collections omit analytics metadata rather than sending the display fallback's synthetic ID. These fixtures do not prove Shopify Admin reporting or production delivery.

## Accessibility, visual and integration limits

To test the custom cookie banner locally, start `npm run dev` and use a fresh browser profile or clear localhost's saved site data. The banner appears after Shopify is ready when the visitor's region requires consent and no choice is saved. It exposes only Accept and Reject, with no preferences page, close action or preview URL override. Accept/Reject calls Shopify's Customer Privacy API; failed saves show an error and allow retry.

The Content Security Policy uses `PUBLIC_CHECKOUT_DOMAIN` when set, otherwise `PUBLIC_STORE_DOMAIN` (the store's default Shopify domain). If the shop uses a custom checkout domain, set `PUBLIC_CHECKOUT_DOMAIN` to that hostname without `https://` in the relevant local/Oxygen environment. The SDK includes these origins in its frame/connection allowlists. `CartSummary` uses a normal anchor for checkout; that top-level navigation is not restricted by those resource directives. A browser regression removes the checkout host from the actual response policy and follows the link to an intercepted fictional page, with no live checkout request or order. This does not verify live checkout configuration or embedded features. Restart the development server after changing environment variables. Root loader tests cover shop/storefront identity and locale; browser checks cover consent gating, persistence and readiness.

On ordinary visits the banner waits for Shopify's consent initialization, then reads `currentVisitorConsent()`. A saved `yes` or `no` for analytics, marketing or preferences suppresses the prompt. Only visitors without a recorded choice follow the regional `shouldShowBanner()` decision; that method can remain true after a successful rejection. A sale-of-data opt-out alone does not count as a cookie choice because a browser privacy signal can set it automatically. The fixture deliberately keeps `shouldShowBanner()` true even after saving a choice to cover this behavior. Test a fresh browser profile against the deployed domain to check automatic display, accept/reject, reload persistence and suppression of the removed preview URL. Confirm the desired regions under Shopify's Customer privacy settings. Automated cookie journeys verify Hydrogen wiring, UI, viewport fit and persistence behavior with local SDK/cookie fixtures; they do not prove live Shopify consent or analytics delivery.

Axe runs its full dialog scan and attaches violations as JSON. The structural-assertion test explicitly separates color-contrast findings from labels/roles/semantics. A passing structural assertion is not a clean full accessibility scan: the dim search status currently has a recorded contrast finding. No accessibility rule was disabled to hide it. Keyboard containment, HUD availability, focus restoration and nested Escape behavior have separate functional browser checks.

Normal animation durations and reduced-motion visibility are asserted. These are not pixel-perfect before/after visual snapshots. Cart quantity uses a registered editable numeric input with a status announcement. The automated 320 × 256 reflow checks exercise product separation, pagination and complete cart controls. Manual checks remain for contrast/design decisions, VoiceOver/NVDA, actual browser zoom, real devices, Firefox/WebKit and audio experience. See [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md) for the current follow-up list.

Live Storefront API behavior, actual inventory/market pricing, consent/analytics delivery, checkout services and Oxygen production deployment are not proven by fixtures. To validate them, use a dedicated test store: run `npm run dev` with its environment, repeat navigation/variant/cart flows, confirm currency/stock/totals against that store, follow checkout only to its review screen, and stop before payment/order submission. Test real Shopify responses to quantity-limit and expired-cart errors. Do not substitute production fixtures or make real orders.

## Local production stress workload

With port 4173 free:

```sh
npm run test:e2e:build
npm run test:e2e:preview
# In another terminal: users, hold seconds, result file, ramp seconds
npm run test:load -- 1000 60 /tmp/wakenswag-load-results.json 10
```

The harness uses a fixed local target and caps users at 1,000. Every user keeps an independent cart cookie and executes a sequential ten-request journey: home, listing, product, predictive search, add/read, update/read, remove/read. Four in five users buy Swag and one in five a drumkit; drumkit mutations deliberately request extra copies to verify server correction. It checks status, response content, persisted quantities and cart privacy headers. It uses HTTP and 200–600 ms think time, not 1,000 browser renderers. Resource contention from running the generator/server on the same laptop limits interpretation.

A failed mutation may have reached the server even when its response was lost. The harness therefore abandons that journey's cart before restarting, instead of treating a subsequent valid repeated add as corrupted quantity. The result counts distinct final cookies separately from all cookies issued during retries. Any failed request or missing independent cart makes the command exit unsuccessfully.

Stop the fixture preview before `npm run preview` for a real-store production read check. The normal `preview` and `deploy` scripts always rebuild the production entry, so a fixture build is never reused by those commands. This workload does not validate live Shopify throttling, checkout/payment, CDN edge behavior or Oxygen production capacity.

## Migration verification: 2026-11-17

Recorded for migration commit `095b835f`, using Hydrogen 2026.10.3, React 19.2.7 and React Router 7.18.5. These dated results are historical evidence; rerun the commands after relevant changes:

- Vitest: **241 tests in 20 files passed**. Coverage: 77.7% statements, 69.17% branches, 72.08% functions, 78.68% lines.
- Playwright: **82 checks passed** against the production fixture build across Chromium desktop and Pixel 7 emulation. The earlier development-server run passed 80 checks before adding the two initial-cart recovery checks.
- TypeScript, SDK GraphQL validation, lint, formatting, SDK skill synchronization and the normal production build passed. These are separate from browser checks.
- A real browser on the development fixture server showed no console warnings/errors on home and client navigation after Vite's initial dependency optimization. `window.Shopify.actions.openCart()` opened the existing cart modal before and after navigation. Component tests also verify that its permanent handler reaches the current provider after unmount/remount.
- The normal production entry also returned HTTP 200 against the public `pets.mock.shop` API for home, collection, product SSR with purchase controls/structured data, robots, cart reads and the Storefront GraphQL proxy. Creating, reading, removing and rereading a fictional cart returned the expected quantities and private cookie/cache behavior. No checkout, payment or order was submitted.
- `npm audit --omit=dev`: **0 known vulnerabilities**. The full audit still reports **12 development/tooling vulnerabilities** (6 high, 4 moderate, 2 low), including MiniOxygen/Miniflare-related dependencies. No forced major upgrades or unverified overrides were applied. Audit results can change; rerun before deployment.
- The separate Shopify AI Toolkit validator was attempted on 88 application/server files but could not run: its installed bundle lacked TypeScript, and after staging it with the project's TypeScript dependency it still lacked `data/types/index.json`. This is an unavailable check, not a passing validation. The installed Hydrogen SDK's GraphQL checker and project TypeScript check passed.

The **1,000-user stress checks did not pass**. Exact recorded measurements are in [load/results-2026-11-17.json](tests/load/results-2026-11-17.json):

- Immediate 1,000-user burst, 60-second hold: 51,122 requests, 2,744 failures (5.368%), p95 1,762.14 ms. Failures comprised 2,345 HTTP 500s and 399 connection errors.
- Ramp to 1,000 over 10 seconds, then 60-second hold: 55,125 requests, 3,724 HTTP 500s (6.756%), p95 1,847.54 ms.
- Diagnostic 100-user run, 5-second ramp and 20-second hold: 6,810 requests, zero failures, p95 17.79 ms.

Both 1,000-user runs established 1,000 independent cart cookies. Successful responses showed no quantity assertion failures. Logged HTTP 500 stacks came from `Miniflare.dispatchFetch` / MiniOxygen's preview proxy (`TypeError: fetch failed`); this locates the observed failure but does not establish its underlying cause or certify production capacity. There were no live Shopify calls in these stress runs, so they cannot measure Shopify throttling. Changes to the fixture boundary and retry handling also prevent a controlled throughput comparison with pre-migration runs.

No merchant-store environment was available locally. Merchant inventory/pricing, actual checkout handoff, consent/analytics delivery and deployed Oxygen behavior remain live-integration checks. Accounts, B2B, subscriptions, Shop Pay buttons, recommendations, filters and a market selector are not implemented features and were not added by this migration. No push, merge or deployment was performed.

## Adding future tests

1. Reproduce the old behavior with a focused test before fixing it.
2. Extend a shared fixture only when the scenario requires it; preserve generated-type compatibility.
3. For pure calculations, assert inputs/outputs and boundaries. For UI, use roles and user interactions. For routes, mock only external dependencies.
4. For a critical customer journey, add a Playwright scenario and run both desktop/mobile projects.
5. Run the affected test, then lint/typecheck. Before shipping, run all commands above and report each result separately.

The reusable quality workflow runs lint, typecheck, formatting, coverage tests, production build and browser tests. Pull requests run it directly; the push-to-Oxygen workflow waits for it before deployment. `format:check` covers all root Markdown files, application/tests, root TypeScript/JavaScript configuration and workflow files. SDK-managed skills and unmodified vendor runtime snapshots are excluded through `.prettierignore`.
