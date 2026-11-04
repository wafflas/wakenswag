# Refactor report

Work performed locally on 2026-11-04. See `CODEBASE_AUDIT.md` for the original architecture/findings, `CONVENTIONS.md` for standards and `TESTING.md` for repeatable commands and test boundaries.

## What changed

The storefront keeps its React 18 / React Router 7.16 / Hydrogen 2026.4 stack, custom routes, PS2 layout, themes, CRT/audio effects and normal animation timings. Important correctness defects were fixed incrementally; there was no folder migration or framework upgrade.

| Area                     | Before                                                                                                                                 | Result and evidence                                                                                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catalog pagination       | First 12 products only; local slicing could never reach the rest                                                                       | Request cursors fetch page-sized Shopify results; native links preserve reload/history. Route tests check next/previous variables; browser tests reach all 25 fixture products.                                                                              |
| Redirects and cart input | External redirect accepted; permissive permalink integer parsing                                                                       | Shared root-relative-path validation, bounded integer/array inputs, rejected malformed requests, no redirect on failed mutations. Boundary/action tests reproduce the original defects.                                                                      |
| Purchase options/data    | No variant controls; nullable variant could crash; prices labeled EURO for all currencies                                              | Hydrogen-derived option links, safe missing/sold-out states, keyed quantity reset, shared currency-aware display. Component and browser tests verify URL/price/merchandise/stock behavior.                                                                   |
| Cart async behavior      | Missing add/quantity error feedback; conflicting controls active                                                                       | Visible recoverable errors, disabled pending forms, optimistic rollback/retry coverage and checkout withheld during pending changes. Real action outage is simulated at the test worker's API boundary.                                                      |
| Search                   | API outages appeared to be no results; invalid limits; unused suggestion handler                                                       | Explicit error/retry state, safe request limits, controlled input and announced status. Retained debounce cleanup and matching-term stale-response guard; browser tests delay an old request behind a new one.                                               |
| Dialogs                  | Repeated partial lifecycle code; background focus/menu shortcuts; removed HUD opener could not regain focus                            | One lifecycle hook handles inert background, scroll lock, focus containment, Escape and cleanup. The opener ref and HUD action identity restore the replacement button after commit. Nested dialog checks run on desktop/mobile.                             |
| Route animations         | Two blockers on product routes; console warned only one is supported                                                                   | One owner shares product exit state. Product image exit stays 400 ms, product opacity stays 300 ms and main-menu fade stays 500 ms. Hook tests cover timer/cancel/reduced-motion behavior; browser tests verify CSS timing and no duplicate-blocker warning. |
| Reduced motion           | Product scale-in/stagger/loading delay remained                                                                                        | Products are immediately visible and loading delay is skipped for reduced-motion preference. Normal animation CSS remains intact.                                                                                                                            |
| SEO/errors               | Sitemap emitted nonexistent standard paths; empty SEO strings suppressed fallbacks; invalid canonical descriptors; nested 404 controls | Actual merch URLs and implemented static-page sitemap, correct link descriptors/product metadata fallbacks, semantic 404 link and safe generic unexpected-error text. Route tests and browser metadata/404 checks cover these.                               |
| Data/tooling             | Unused header/footer/home requests; empty loader wrappers; unused scaffold; no tests; account codegen error                            | Removed unused work and introduced isolated tests plus quality scripts/CI. Storefront codegen and bundles complete without the absent-customer-document error.                                                                                               |

## How the important changes work

### Catalog and variants

1. A pagination link changes `cursor` and `direction` in the URL. `merch.tsx`/`drumkits.tsx` call `getPaginationVariables(request, {pageBy: PRODUCTS_PER_PAGE})`, so Shopify returns the next or previous 12 products. The component displays those nodes directly instead of slicing an incomplete catalog.
2. The listing retains a ref-backed visited-page set for entrance effects. A ref persists between renders but changing `.current` does not trigger a render. Existing selection/loading callbacks run when the first product on the page changes.
3. `getProductOptions` supplies option existence, availability and variant query strings. Choosing an option follows a React Router Link; the server reads selected options and Hydrogen supplies an optimistic variant while loading. The price/image/availability then use that variant.
4. ProductPurchaseControls is keyed by `selectedVariant?.id ?? product.id`. `?.` handles a missing variant; `??` supplies the product ID only when the variant ID is null/undefined. A new key resets only the local purchase quantity to one without a separate reset effect; the product image and option links stay mounted, preserving their animation and keyboard focus. Displayed quantity is also clamped to known stock.
5. `formatMoney` formats Shopify's supplied amount with the currency's precision. EUR retains `EURO`; USD/JPY/KWD use their real code/precision. This function does not calculate a charge or cart total.

### Cart and search requests

1. CartForm sends an action and inputs to `cart.tsx`. The action validates the form/line data before invoking the existing Hydrogen cart method. Invalid input returns 400; an upstream exception returns a safe 502 response. Valid cart responses still set Hydrogen's cart cookie.
2. The fetcher tracks pending work. Buttons/fieldsets disable conflicting submissions, then display a retryable error when a completed response contains errors. Hydrogen still reconciles optimistic cart state with canonical server data; browser tests verify rollback after failure and a successful retry.
3. Search keeps the 220 ms debounce. Its effect clears the old timeout when the term changes or the component unmounts. The matching-term condition refuses stale data even if an older response arrives later.
4. Search's failure response carries `error` separately from the empty result. That lets the component show “Try again” rather than “No memory found.” `onClick={() => ...}` passes a function to React; it runs only when clicked.

### Dialogs and transitions

1. `AsideProvider.open` records the active HUD opener in a ref before updating state. State renders the chosen dialog; the ref remembers the trigger without causing another render.
2. `useModalDialog` sets up focus, scroll locking, inert background siblings and keyboard/focus listeners. It includes the persistent HUD in the permitted focus region. Only the topmost dialog installs this lifecycle, so closing cart over a product leaves the product active.
3. Cleanup removes listeners, restores previous inert/overflow values and queues focus restoration after React replaces the HUD controls. If the original button is gone, `data-controller-action` locates the new equivalent. The queued task checks that focus would not escape another active dialog.
4. `RouteFadeTransition` owns the sole router blocker. It chooses the existing product/page delay and shares a boolean product-exit value through context. `useRouteExitTransition` clears its timer if the navigation changes/unmounts and uses zero delay for reduced motion. No real 3D scene was added; existing effects remain CSS transforms/opacity.

## Simplification and tooling

- Removed unused header/footer menu queries, homepage collection/recommendation queries and associated generated fragments/prop plumbing.
- Removed no-op deferred loaders, unreferenced Aside sidebar markup, MockShopNotice, PaginatedResourceSection and order-filter scaffolding. Account routes were absent before this work; no implemented account behavior was removed.
- Removed direct `react-router-dom`, `graphql-tag` and `eslint-plugin-jest` dependencies. Other dependencies may still use some transitively.
- Removed cheap URL memoization and changed variant URL creation to copy the caller's parameters rather than mutate them.
- Reused generated predictive-search and Money types, fixed nullable variant access, enabled unused-TypeScript-variable/explicit-any rules and removed incompatible Jest-only lint configuration.
- Added Vitest/RTL/user-event, Playwright and axe; no additional state library, API wrapper or MSW layer.
- Build now runs the installed GraphQL generator directly before Hydrogen bundling, so query/schema errors return a failing status instead of being hidden by the CLI wrapper. A deliberately invalid query in a temporary fixture was rejected with exit code 1, confirming this failure path.
- Added reusable CI quality checks and made the existing Oxygen deploy job depend on them. CI configuration was prepared locally; no remote run or deployment is claimed.

## Component simplicity and centralized tests

Applied the additional architectural rules to the dedicated UI files without moving or deleting any existing tests:

- Inlined seven trivial helper components: AddToCartSubmitButton, QuantityButton, CartLineRemoveButton, CartLineUpdateButton, CartCheckoutActions, ControllerFooterGroup and SearchStatusMessage. Their markup stays with the responsibility that uses it; ordinary data helpers and Hydrogen render callbacks remain ordinary functions.
- Moved ProductPurchaseControls (quantity/purchase state), CartLineQuantity (line mutations and stock limits) and ControllerActionCount (count animation state) into dedicated files. The initially separated OptimisticControllerFooter was subsequently consolidated into ControllerFooter during the footer simplification below.
- Preserved the keyed purchase controls, HUD structure/classes, shared cart fetcher key, pending/error behavior and normal animation timings. The paired decrease action/inputs are selected together so TypeScript preserves Hydrogen's action-specific input types.
- Kept the established tests/lib, tests/components, tests/routes and tests/e2e groups. Existing ProductDetail and browser tests continue covering the moved components; six focused CartLineQuantity tests cover remove/decrease/increase dispatch, stock limits, optimistic state and shared pending/error recovery. No test files were moved beside source or silently removed.
- Persisted the rules in AGENTS.md and CONVENTIONS.md. ESLint rejects multiple components in dedicated app/components UI files and test/spec files under app. Its one-component restriction was checked with an in-memory two-component example; existing UI files pass lint. Framework route exports retain their required structure.

## Feature utility consolidation

Each component feature with independent helpers now has one descriptive camelCase utility module containing the real implementations:

| Module                 | Collected responsibilities                                             |
| ---------------------- | ---------------------------------------------------------------------- |
| animationUtils.ts      | Existing animation durations, fade classes and fade variant type       |
| cartUtils.ts           | Cart domain types, child-line grouping and submit-content replacement  |
| controllerUtils.ts     | Concrete Back destinations for home, product and other routes          |
| homeUtils.ts           | Keyboard typing-target detection                                       |
| productDetailUtils.ts  | Existing product themes and description parsing, replacing two modules |
| productListingUtils.ts | Listing constants, data types and cursor URL construction              |
| searchUtils.ts         | Search normalization and card types, replacing two modules             |
| sharedUtils.ts         | Interactive target lookup for interface audio                          |

Components/routes/tests import the named helpers directly; superseded modules were removed rather than retained as re-export wrappers. Listing loaders now import their page-size constant from a stateless module instead of from a React hook module. Pagination receives pathname/search explicitly, preserving unrelated query parameters while replacing its cursor/direction.

Hooks retain useSomething.ts filenames, local component props stay with the UI, and context/effect callbacks remain with their owning lifecycle. Audio playback handlers still share the same effect state/cleanup; only the independent target lookup moved. Layout and content folders have no empty utility files, and shared money/variant logic remains in app/lib instead of being duplicated.

Existing centralized tests and imports were preserved. Added 21 meaningful utility cases for cart grouping/pending content, controller destinations, pagination URL preservation and DOM typing/sound target boundaries. The jsdom typing-target cases explicitly supply the browser's computed isContentEditable property, which jsdom does not implement. An independent read-only review found no stale imports or new component/hook dependency cycles. Pure data utilities keep generated/platform imports type-only where applicable; cart submit helpers use React element utilities without hooks.

## Controller footer simplification

Replaced the four-component callback pipeline (`AppControllerFooter` → `CartControllerFooter` → `OptimisticControllerFooter` → `ControllerFooter`) with two stages:

1. `PageLayout` supplies its existing cart promise directly to `AppControllerFooter`. That component owns the fixed outer footer and `Suspense`/`Await`, rendering usable zero-count controls while the cart is pending or fails.
2. `ControllerFooter` calls Hydrogen's `useOptimisticCart` and reads the route/overlay state where the buttons are rendered. Back closes an open overlay, returns a product to `/merch`, or returns another page to `/`. Search and Cart open their respective overlays. Home has no Back action.
3. Removed unused generic action configuration, grouping, custom/history target modes and show/hide flags. Explicit left/right button groups replace the empty middle grid column. The shared icon and animated-count components retain their existing responsibilities and behavior.
4. The outer `data-modal-controls` element stays mounted when a pending cart resolves. A reproduced regression showed that replacing it while Search was open left focus on the document body after Escape. Keeping that element outside Suspense lets the existing dialog hook find the new Search button and restore focus correctly.

Added twelve centralized component cases. Eleven characterized existing behavior and passed before the refactor; the additional delayed-cart focus case failed before the stable-shell fix and passed afterward. Existing route-helper tests were updated from unused generic/history configuration to the actual home/product/other-route destinations, including trailing slashes. No test file was removed. The controller folder now has five cohesive files: the two footer components, the count animation, shared symbols and `controllerUtils.ts`.

All 104 Vitest cases and 28 desktop/mobile Chromium journeys passed after this change. Before/after screenshot comparisons found zero changed pixels in all eight footer regions (home, product, search and cart at both viewports). Compared the bottom 100 image pixels on desktop and 300 on mobile to include the entire footer at the device pixel ratio; this was a focused footer comparison, not a full application visual-diff suite. Lint, typecheck, formatting and the production build also passed.

## Validation results

| Check                                   | Result                                                                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial characterization suite          | 11 passed before application refactoring                                                                                                                                     |
| Server regression reproduction          | 17 failed / 20 passed before fixes; all 37 passed after server batch                                                                                                         |
| Final Vitest unit/component/route suite | 104 passed across 11 files                                                                                                                                                   |
| V8 coverage                             | 54.34% lines, 53.16% statements, 47.01% branches and 46.44% functions; HTML includes uncovered files                                                                         |
| Playwright Chromium desktop/mobile      | 28 passed: 14 journeys in each project; fixture-backed, not live Shopify                                                                                                     |
| Accessibility                           | Full axe dialog scans recorded one serious search-status contrast finding per viewport; empty-cart scan had zero findings. All separately asserted structural checks passed. |
| Screenshots                             | Home/search/product/cart captured for desktop/mobile; all eight footer regions match pre-footer-refactor screenshots exactly. No full-application visual-diff suite.         |
| ESLint                                  | Passed with no warnings after cleanup                                                                                                                                        |
| TypeScript + React Router generation    | Passed                                                                                                                                                                       |
| Formatting                              | Passed; all matched files conform to the Shopify Prettier configuration                                                                                                      |
| Production build/codegen                | Passed; client/server bundles and storefront codegen complete (nonfatal diagnostics listed below).                                                                           |
| npm audit --omit=dev                    | Nonzero: 6 package findings (2 high, 3 moderate, 1 low); dependency remediation remains                                                                                      |

Coverage percentages apply to the configured authored libraries/components/routes. They do not include Playwright execution or every application entry/config file. Many dialog/cart/listing paths are exercised by browser tests and are consequently shown as uncovered by Vitest. This is a foundation for maintaining critical behavior, not a claim that every branch is tested.

The Shopify AI Toolkit searched version-targeted Hydrogen guidance. Its source validator initially could not resolve TypeScript from its plugin directory; supplying the project's installed TypeScript let it run across 45 changed application files. It reported success for 41 files and five recognized components. Four file checks failed because its isolated compiler omitted DOM iterable/Oxygen globals or inferred null-returning resource components incorrectly; the project TypeScript check includes those libraries and passed. Many other components were outside the toolkit validator's coverage. These results are recorded as partial tool validation, not a clean 45-file pass. Installed types, GraphQL generation, unit tests and browser tests provide the applicable project evidence.

## Remaining debt and limitations

1. **High: dependency advisories.** Hydrogen 2026.4.7 pins router peers to `~7.16.0`. npm recommends 7.18.x router and 2026.10.x Hydrogen upgrades; coordinate and test that migration rather than force incompatible peers here. The runtime audit includes framework-associated development tooling, so its six packages are not six proven runtime exploits. Lodash is reached via build/codegen tooling; a compatible update reported up to date. The full install audit still reported 59 findings across development/transitive dependencies. No `audit fix --force` was applied.
2. **Medium: search-status contrast.** The dim PS2 status text has a real axe contrast finding. A targeted visual-design decision is still needed; structural/keyboard tests do not establish full WCAG conformance.
3. **External integration:** no dedicated real Shopify test store was provided. Real inventory/overselling policy, multi-line/bundle carts, market/currency selection, actual discount/gift-card redemption, expired carts, consent/analytics and hosted checkout need the test-store procedure in `TESTING.md`. No orders were placed.
4. **Browser/device scope:** Chromium desktop and mobile emulation ran. Firefox/WebKit, physical devices, manual screen readers, zoom/reflow, audio behavior and a full visual diff/performance benchmark did not run. No Lighthouse or real-user Web Vitals improvement is claimed.
5. **Build diagnostics:** installed dependencies emit the existing `envFile` deprecation and React Router v8 future-flag warnings. Hydrogen also warns about nine unimplemented standard Shopify routes (this project uses custom merch/drumkits/content routes) and unavailable bundle-analysis metadata under this Vite toolchain. These are recorded warnings, not hidden failing checks. Add tested redirects/pages when those standard integrations are required.
6. **Scope retained:** info/socials remain intentional placeholders; account/filter/sort features remain unimplemented. Listing title/id state and small presentation components remain where changing them offered no clear benefit. Follow-up tests should expand API boundaries and cart/component states before chasing a percentage target.

This refactor is locally verified for its fixture-backed workflows. Production release readiness still depends on addressing the dependency advisories and completing the live integration/accessibility follow-ups above.
