# Testing the storefront

## Setup and commands

Use Node 22 or 24 (local validation used Node 24.19.0) and npm:

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

`test` runs once; `test:watch` reruns relevant tests while editing. Coverage measures the unit/component/route suite, not Playwright. It reports uncovered authored application files rather than hiding them or setting an arbitrary percentage target. A passing build is separate from type checking, linting and browser testing. `build` first runs the installed GraphQL generator and route type generation; `&&` stops the build if either fails. This avoids the Shopify codegen wrapper’s observed success exit code on a printed error.

Vitest 4.1.12 supports the installed Vite 8. A separate `vitest.config.ts` avoids loading Oxygen's Vite plugins for ordinary tests. jsdom supplies a simulated browser; React Testing Library and user-event exercise components. Vitest inlines Hydrogen and React Router so both use the same router context module. MSW is unnecessary: mocked storefront/cart methods already define a narrow API boundary.

## Unit, component and route tests

- `tests/lib/`: variant URLs/default options, description extraction, product themes, search normalization/tracking, safe redirects and money/currency precision.
- `tests/lib/cartUtils.test.ts` and `tests/lib/componentUtils.test.ts`: cart-child grouping/pending content, controller navigation, cursor URL preservation and typing/sound target helpers. Existing description/theme/search tests import their consolidated feature utility modules directly.
- `tests/components/`: real purchase controls, stock/disabled/missing-variant states, pending submissions and recoverable cart errors inside a real memory data router.
- `tests/components/ButtonSound.test.tsx`: audio stays uninitialized until a click/key press, the first activation waits for decoding, StrictMode does not create startup audio engines, and unmount aborts downloads and prevents late playback.
- `tests/components/CartLineQuantity.test.tsx`: remove/decrease/increase actions, line identity, stock limits, optimistic disabling, shared pending state and failure recovery after component simplification.
- `tests/components/ControllerFooter.test.tsx`: home/product/ordinary-page Back behavior, Search/Cart controls, pending and failed cart loading, optimistic quantity rollback, opening Cart before a pending add has a calculated price and focus restoration when the cart resolves during an open Search dialog. Uses real router/provider/modal components rather than mocking their hooks.
- `tests/components/Aside.test.tsx`: overlay exit timing, repeated-close requests, cancellation when another overlay opens, reduced motion and timer cleanup on unmount. Existing route-exit tests cover the shared timer through navigation too.
- `tests/routes/`: real loaders/actions with typed partial Hydrogen context mocks; cart dispatch/cookies/redirects/failures, search boundaries, pagination variables, selected options, 404 and permalink validation.
- `tests/fixtures/catalog.ts`: generated-type-compatible fictional product, variants, cards and cart. There are in-stock, unavailable and missing-variant states; E2E adds a 25-product catalog for multiple pages.

Example from the product component test:

```tsx
await user.click(screen.getByRole('button', {name: 'Add to cart'}));
expect(screen.getByRole('button', {name: 'Adding to cart...'})).toBeDisabled();
```

This checks what a customer sees and can do, without inspecting React state. Supply real router context for components using Hydrogen CartForm/useFetcher. Mock the API result, not those components' internal hooks. Use a controlled Promise to hold a request pending; release it and check the error/retry state. Avoid arbitrary sleeps and snapshots of entire pages.

Keep this centralized layout when extracting or inlining components. Existing parent tests stay in place: `ProductDetail.test.tsx` continues to test purchase behavior through ProductDetail after ProductPurchaseControls moves to its own file. Locate and preserve tests before changing component boundaries, update imports when needed and run the affected tests. New files beside production components are rejected by lint. Feature subfolders are optional when a group grows; the suggested unit/integration structure does not require moving the current well-organized suites.

## Browser tests

`playwright.config.ts` starts `npm run test:e2e:serve` on `http://localhost:4173`, waits for readiness and stops it afterward. Leave that port free; the suite refuses to reuse an existing server so it cannot silently test an unrelated app. Chromium desktop and Pixel 7 mobile/touch emulation run the same journeys with two workers. Mobile emulation is not a real-device test.

`tests/e2e/server.ts` is a separate Oxygen worker entry. It constructs the real Hydrogen context and React Router request handler, then replaces only storefront queries/cart methods with deterministic fixtures. Real route loaders/actions, SSR, hydration, fetchers, cart cookies, optimistic updates and UI are exercised. The production `server.ts` never imports this entry and has no test-mode flag. `fixture.env` is checked-in fictional configuration, not a store credential.

Unexpected worker query operations throw rather than reaching the network. Browser HTTPS requests are intercepted: fixture images are supplied locally and external scripts/analytics/checkout are blocked. The cart test fault header is handled only by the fixture worker; it drives the real action's upstream-error path. Each Playwright browser context gets its own cart cookie. The fixture cart deliberately models this suite's single-product journeys, not Shopify's entire cart engine; add multi-line/discount/bundle fixture behavior before testing those scenarios.

Journeys cover home/navigation, collection listing/pagination with refresh/history, products/variants/prices/quantity, add/update/remove/empty cart, cookie persistence, checkout URL handoff, search/empty/failure/retry/stale responses, nested dialogs/focus/Escape, 404 and reduced-motion/normal animation timing. Cart/Search share the product's 300 ms entry fade and finish their 300 ms exit before unmounting; browser checks cover both Back and Escape, scroll locking and opener restoration. Checkout coverage checks the URL; it does not navigate to payment or submit an order.

Tests wait for React Router hydration before interacting with initially server-rendered controls. They wait for observable results or controlled requests rather than guessed delays. Scope selectors to the active dialog when another dialog remains mounted underneath it.

Useful focused commands:

```sh
npm run test:e2e -- --project=chromium
npm run test:e2e -- --grep 'cart'
npx playwright show-report
npx playwright show-trace test-results/<failed-test>/trace.zip
```

The HTML report is in `playwright-report/`; machine-readable results, failure screenshots and traces are under `test-results/`. Both directories and coverage output are ignored by Git. CI uploads browser artifacts on failure. Development-server warnings about blocked customer-privacy scripts are expected because most tests intentionally block external services.

Cookie and collection-analytics journeys use `tests/e2e/fixtures.ts` to supply a local privacy SDK, a performance-script stub and a successful analytics receiver. Hydrogen's actual consent checks, event queue and payload generation still run. Collection checks verify Swag/Drumkits IDs and handles, no delivery before consent, returning from product details and no collection event for directly opened or nested product pages. Collection pagination follows Hydrogen's normal URL-change tracking. Missing collections omit analytics metadata rather than sending the display fallback's synthetic ID. These fixtures do not prove Shopify Admin reporting or production delivery.

## Accessibility, visual and integration limits

To test the custom cookie banner locally, start `npm run dev` and use a fresh browser profile or clear localhost's saved site data. The banner appears after Shopify is ready when the visitor's region requires consent and no choice is saved. It exposes only Accept and Reject, with no preferences page, close action or preview URL override. Accept/Reject calls Shopify's Customer Privacy API; failed saves show an error and allow retry.

Consent configuration and the Content Security Policy use `PUBLIC_CHECKOUT_DOMAIN` when set, otherwise `PUBLIC_STORE_DOMAIN` (the store's default Shopify domain). If the shop uses a custom checkout domain, set `PUBLIC_CHECKOUT_DOMAIN` to that hostname without `https://` in the relevant local/Oxygen environment. Restart the development server after changing environment variables. The root loader tests cover the explicit hostname and both missing/empty fallback cases.

On ordinary visits the banner waits for Shopify's consent initialization, then reads `currentVisitorConsent()`. A saved `yes` or `no` for analytics, marketing or preferences suppresses the prompt. Only visitors without a recorded choice follow the regional `shouldShowBanner()` decision; that method can remain true after a successful rejection. A sale-of-data opt-out alone does not count as a cookie choice because a browser privacy signal can set it automatically. The fixture deliberately keeps `shouldShowBanner()` true even after saving a choice to cover this behavior. Test a fresh browser profile against the deployed domain to check automatic display, accept/reject, reload persistence and suppression of the removed preview URL. Confirm the desired regions under Shopify's Customer privacy settings. Automated cookie journeys verify Hydrogen wiring, UI, viewport fit and persistence behavior with local SDK/cookie fixtures; they do not prove live Shopify consent or analytics delivery.

Axe runs its full dialog scan and attaches violations as JSON. The structural-assertion test explicitly separates color-contrast findings from labels/roles/semantics. A passing structural assertion is not a clean full accessibility scan: the dim search status currently has a recorded contrast finding. No accessibility rule was disabled to hide it. Keyboard containment, HUD availability, focus restoration and nested Escape behavior have separate functional browser checks.

Normal animation durations and reduced-motion visibility are asserted. These are not pixel-perfect before/after visual snapshots. Existing source styles are preserved except the missing reduced-motion rules and necessary new variant/error controls. Manual checks remain for contrast/design decisions, VoiceOver/NVDA, zoom/reflow, real devices, Firefox/WebKit and audio experience.

Live Storefront API behavior, actual inventory/market pricing, consent/analytics delivery, checkout services and Oxygen production deployment are not proven by fixtures. To validate them, use a dedicated test store: run `npm run dev` with its environment, repeat navigation/variant/cart/discount/permalink flows, confirm currency/stock/totals against that store, follow checkout only to its review screen, and stop before payment/order submission. Test real Shopify responses to discount, quantity-limit and expired-cart errors. Do not substitute production fixtures or make real orders.

## Adding future tests

1. Reproduce the old behavior with a focused test before fixing it.
2. Extend a shared fixture only when the scenario requires it; preserve generated-type compatibility.
3. For pure calculations, assert inputs/outputs and boundaries. For UI, use roles and user interactions. For routes, mock only external dependencies.
4. For a critical customer journey, add a Playwright scenario and run both desktop/mobile projects.
5. Run the affected test, then lint/typecheck. Before shipping, run all commands above and report each result separately.

The reusable quality workflow runs lint, typecheck, formatting, coverage tests, production build and browser tests. Pull requests run it directly; the existing push-to-Oxygen workflow now waits for it. No deployment was performed during this refactor.
