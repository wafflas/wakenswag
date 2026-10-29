# CODEX MASTER AUDIT — SHOPIFY HYDROGEN STOREFRONT

> **Role:** Act as a senior Shopify Hydrogen engineer, staff-level frontend engineer, accessibility specialist, QA automation engineer, application security reviewer, and performance engineer.
>
> **Mission:** Audit the **existing repository** end to end; reproduce and fix verified problems; add maintainable automated coverage; then provide evidence-based production-readiness results. This is an execution task, **not** merely a checklist or speculative code review.
>
> **Design constraint:** The storefront uses a custom PS2 / early-2000s console-inspired interface with animated menus, unusual navigation, product previews, and transitions. Preserve its intended aesthetic and interactions wherever possible. Accessibility, usability, and reliability are non-negotiable; solve these without replacing the design with a generic Shopify template.

## 0. Rules of engagement

1. **Inspect before acting.** Read `package.json`, lockfile, framework/route structure, `vite.config.*`, `tsconfig*`, Hydrogen configuration, app entry points, Shopify API clients, environment-variable handling, build scripts, deployment setup, existing tests, and relevant local project/agent instructions (`AGENTS.md`, `.agents/skills/`, etc.). Determine whether this is legacy Hydrogen/Remix, React Router, Next.js, or another framework with the Hydrogen library. **Do not assume a particular version or API.**
2. Determine the package manager from the lockfile and use it consistently. Follow the repository's conventions and existing testing infrastructure rather than installing replacements without reason.
3. Produce a **feature/route inventory** from actual code. Mark each requirement `APPLICABLE`, `NOT IMPLEMENTED`, `NOT APPLICABLE`, or `BLOCKED`. Do not report missing optional features as bugs unless they are required by the site's actual UX.
4. Create an initial audit baseline **before** modifying application code. Run existing tests, typecheck, lint and build where available; record failures and logs. Never claim a test passed if it was not executed.
5. **Reproduce before fixing.** For each confirmed issue: give a reproduction path, expected vs. actual behavior, root cause, severity, and regression test where practicable.
6. Fix issues incrementally, with small reviewable changes. Avoid unrelated refactors, new dependencies, or visual redesigns. Preserve existing working paths and current UI behavior unless the behavior itself is defective.
7. Run tests against a local/test storefront and safe fixtures. **Do not place real orders, charge cards, send real customer communications, alter live products/inventory, delete live data, or deploy without explicit permission.** Stop automated flows before any irreversible checkout/payment action.
8. Do not commit secrets, tokens, `.env` contents, user PII, raw session cookies, or authentication traces. Mask sensitive data in logs and reports.
9. Avoid false positives. Clearly distinguish **verified bugs**, **potential risks**, **not tested**, and **external platform limitations**. If permissions, fixtures, credentials, devices, or APIs are unavailable, document the exact blocker and a concrete manual verification procedure.
10. Do not weaken accessibility rules, delete tests, suppress errors, or hide warnings merely to make the audit green. Do not silently change pricing, discount logic, inventory rules, analytics semantics, or checkout integration.
11. Prefer official docs for the **installed** Hydrogen, Shopify API version, routing framework, hosting runtime, and testing framework. Read version-matched local Hydrogen agent skills if present.
12. Work through this entire audit autonomously with available tooling; ask for input only when a permission-gated or destructive step genuinely requires it. Continue with all independent checks if one area is blocked.

---

## 1. Discovery and audit matrix

Inventory and map:

- Public routes: landing, product, collection/category, search, cart, checkout handoff, policy, information, contact, 404, and any custom pages.
- Optional routes only if present: customer account, wishlist, filters, sorting, localization/markets, blog/content, recommendations, gift cards, promotional pages.
- UI primitives: navigation overlay, submenu icons, mobile navigation, search UI, cards, product galleries, quick-add, variant selectors, mini-cart/cart drawer, notifications, modals, loaders, transitions, error boundaries, footer, cookie settings.
- State layers: React state, route loader/action data, URL params, Shopify cart state, browser cookies/storage, optimistic state, cached/deferred requests.
- External services: Shopify Storefront API, Customer Account API (if used), analytics, error monitoring, media delivery, third-party fonts/scripts, hosting.
- Feature flags, environment-dependent code paths, preview/test mode, and conditional routes.

Create `audit/FEATURE_MATRIX.md` with columns: feature/route, implementation file(s), intended behavior, test cases, current coverage, audit result, evidence.

## 2. Test infrastructure and execution

- Detect existing runner and test conventions. Add **Playwright** browser end-to-end tests if absent and permitted, plus **axe-core integration** (`@axe-core/playwright`) for automated accessibility checks. Add Vitest or the existing unit/integration runner only if useful and compatible.
- Prefer reliable role/accessible-name selectors; avoid brittle arbitrary delays or selectors tied to animation classes. Use stable test IDs only where needed.
- Configure Chromium, Firefox, and WebKit where executable; document unavailable browser environments. Test desktop and mobile viewports with touch simulation where supported.
- Use safe test product/variant fixtures for in-stock, sold-out, unavailable, multi-variant, single-variant, discounted, compare-at, missing media, and high/low price scenarios where test data exists.
- Make tests deterministic: controlled data, isolated cart/session context, clear fixtures, no dependence on production ordering or inventory drift.
- Capture screenshots, traces and videos for failures when feasible; redact tokens/customer data. Save results under `audit/artifacts/` and keep generated artifacts out of source control if appropriate.
- Use API mocking only for explicit outage/boundary tests. Keep a separate suite hitting a safe, real Shopify development/test store so mocked success cannot conceal integration failures.
- Start the app using the repository's supported scripts, wait for readiness, and terminate cleanly. Check both development and production-built preview if supported.
- Avoid mounting tests onto a live store if test automation could affect customer carts or operational data.

## 3. Core customer journeys — run actual end-to-end tests

### 3.1 Global navigation and PS2 menu

- Landing page loads directly, via link, and on refresh; primary navigation renders without runtime failures.
- Fullscreen PS2-like menu opens/closes consistently via mouse, touch, keyboard, and supported controller inputs if intentionally implemented.
- Default-open first category behaves as intended without relying exclusively on hover.
- Hover between parent icons and submenu icons does not accidentally close or flicker the submenu; no dead gap between activation and submenu regions.
- Submenus are reachable through click/tap and keyboard focus, not hover alone; first tap must not unexpectedly navigate when it is intended to expand.
- Hover sound only plays after a permitted user gesture; no autoplay errors, repeated audio overlap, excessive volume, or errors if audio is unavailable. Respect mute and reduced-sensory preferences where appropriate.
- Selection routes to the correct destination; back-navigation restores meaningful context without trapping the user.
- Active/current navigation state is visibly and programmatically conveyed; focus remains visible and logical.
- Closing via Escape, close control, outside click (if designed), route change, and browser Back is correct.
- Scroll locking when overlay is open; scroll position restoration when it closes; no background interaction/focus leakage.
- Menu interactions during transitions, rapid hover, rapid double click, route prefetch, and loading states do not leave the menu stuck.
- Mobile menu supports touch target sizes, orientation change, safe-area insets, and long labels without clipping.

### 3.2 Search (console-themed search UI)

- Open search from every intended entry point; autofocus only where appropriate and without unexpected mobile keyboard behavior.
- Empty query, whitespace-only query, long query, punctuation, Unicode, accented characters, emoji, case changes, special characters, and strings resembling HTML/SQL are handled safely.
- Debouncing/cancellation prevents stale responses from replacing newer search results; rapid typing and backspacing work correctly.
- Keyboard Enter executes search; Escape closes suggestions or search as appropriate; arrow keys and screen readers navigate suggestions if it is a combobox.
- Suggestions, results counts, loading state, zero-results, API errors, timeout, retries, and offline state are correct and announced accessibly.
- Searching while another request is pending; clearing query; navigating back/forward; reloading a search URL; preserving query parameters.
- Search results contain only expected published/available products in correct market and currency; links route to the correct products.
- No unsafe injection from search text or product data; no search term inadvertently logged as sensitive personal data.
- Animated transitions/3D search objects remain usable without animation or WebGL and when images are missing.

### 3.3 Collections, product listing and product details

- Every live collection and product route loads from a direct URL and in-app navigation; invalid handles return a real 404 with correct status.
- Product title, description, media, alt text, prices, currency, compare-at prices, stock status and metadata are consistent with Shopify response.
- Variant selection updates image, price, availability, purchase button and URL as intended; deep links to variant IDs load correctly.
- Browser Back/Forward restores variant/filter/sort where URL-driven; switching variants repeatedly does not race or desync.
- Out-of-stock/disabled/unavailable variant cannot be purchased; graceful messaging and valid fallback for stale variant links.
- Test products with zero, one, and many images; failed image requests; huge aspect ratios; video/media if present; zero/long descriptions; missing optional metafields.
- Collection pagination/load-more/infinite scrolling, filters, sort order, empty collection, single item, many items, slow load, and duplicate-item avoidance.
- Correct link destinations, interactive card behavior, price formatting, product option labeling, responsive layout, and non-overlapping controls.
- Product recommendations and related products do not create broken links or incorrect cross-market pricing (if implemented).

### 3.4 Cart and checkout handoff

- Add a valid variant; view cart; update quantity; remove one item; empty cart; rebuild cart; proceed to checkout.
- Confirm correct variant identity, quantity, price, discounts, line totals, cart subtotal and currency using Shopify's canonical cart response.
- Prevent/handle add-to-cart with no selected variant, sold-out variant, unavailable variant, quantity 0, negative, non-integer, absurdly large, nonnumeric, or above stock/policy limits.
- Rapid double-click on add; repeated quantity taps; simultaneous updates; slow network; duplicate actions; mutation failures; stale cart response ordering.
- Optimistic cart UI must reconcile correctly with actual Shopify cart data and roll back or explain failures visibly.
- Cart badge, drawer, page, header, and checkout button always reflect the same latest state; verify across route changes and reloads.
- Cart persists correctly across allowed sessions/reloads; expired/invalid cart ID and deleted products fail gracefully; no stale checkout link.
- Discounts, compare-at display, shipping estimates, taxes and promotions **only if implemented**; never invent a final checkout total from incomplete cart data.
- Verify checkout URL is valid, trusted, and originates from the expected Shopify checkout flow; handle failure or missing URL without dead-end navigation.
- If a user changes market/currency, verify cart behavior and buyer identity follow supported Shopify logic.
- Test cart accessibility: announcements after mutations, focus restoration after closing cart drawer, meaningful error text, reachable checkout action.
- **Do not complete payment or submit real orders.** Checkout handoff and safe sandbox/preview checks are sufficient unless an authorized test environment exists.

### 3.5 Accounts and other features (only if implemented)

- Sign-in redirect, callback, logout, session refresh/expiry, access control, logged-out deep links, and sanitized return URLs.
- Confirm session tokens never leak to the browser, URL logs, or client bundles; verify CSRF/state handling according to installed framework and Shopify integration.
- Validate cart/customer identity syncing and shared-device logout behavior where supported.
- Account pages do not expose another customer's profile/orders through caching or session reuse.
- Contact/newsletter forms: validation, loading, success, failure, bot/spam control, double submit, consent, no accidental real-world submissions during tests.
- Wishlist/local storage, recommendations, discounts, localization, gift cards or other custom functionality: cover their full happy path and failure path if present.

## 4. Accessibility audit — target WCAG 2.2 AA

Automated scans are necessary but **not sufficient**. Run axe on each template in each major state (open/closed menu, results/empty search, selected product variant, open cart, error modal), then perform manual keyboard and assistive-technology-oriented checks.

### Semantic structure

- Correct document language, page title, heading hierarchy, landmarks, skip-to-content link, meaningful link/button names, unique IDs and no invalid nested interactive elements.
- Icons-only navigation has correct accessible names and roles. Use buttons for actions, anchors for navigation, not clickable `div`s.
- SVG decoration is hidden from accessibility tree; informative icons have accessible text; images have useful alt or are explicitly decorative.
- Cart counts, selected variants, stock/error states and filter status have understandable text and appropriate live-region announcements.
- Dialogs/drawers use suitable modal semantics; labels, expanded/collapsed state and controlled relationships are correct.

### Keyboard, focus and touch

- Reach every action using only keyboard; visible focus; logical Tab/Shift+Tab order; Enter/Space behavior; Escape behavior; no keyboard traps.
- Manage initial focus, focus containment where appropriate, and focus restoration in dialogs, menu overlays and search.
- Never make hover the only way to access submenu or product actions; keyboard and touch alternatives must exist.
- WCAG 2.2 AA focus-not-obscured/target-size requirements; verify small PS2 icon hit areas and mobile controls.
- Verify gestures and drag actions have non-drag equivalents where applicable; no dependence on precise pointer movement.

### Perception and motion

- Text and UI contrast against dark navy/glowing backgrounds in default, hover, disabled, selected, error and focus states. Test actual composited contrast, not just raw hex values.
- Check 200% and 400% zoom, reflow at 320 CSS px, text spacing, large fonts, landscape orientation, and browser forced-colors/high-contrast settings where possible.
- Respect `prefers-reduced-motion`: avoid obligatory zoom tunnels, flashing, continuous parallax/rotation, or delayed access to content. Ensure content remains functional when transitions are disabled.
- Respect reduced transparency where feasible; provide readable non-blurred surfaces if glass/bloom effects make text illegible.
- No seizure-risk flashing; sound has mute control and should not be required to understand navigation.
- Loading animation cannot block interaction indefinitely; always offer deterministic error/fallback states.

### Assistive technology

- Perform manual keyboard review and, if the environment allows, VoiceOver (Safari/macOS) and/or NVDA (Windows) and mobile screen-reader spot checks. **Do not claim manual screen-reader testing unless genuinely performed.**
- Search combobox suggestions and result counts have appropriate roles/announcements if built as combobox; do not apply combobox ARIA incorrectly to an ordinary search field.
- Focus changes and route announcements work after client-side navigation; page title updates are reliable.
- Check error identification and suggestions; required form fields, autocomplete attributes, and instructions.

Report each WCAG failure with criterion, element/selector, route/state, reproduction, severity, and suggested remediation.

## 5. Responsive and cross-browser audit

Test at minimum these representative widths (adjust to project needs): **320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 CSS px**, plus 200%/400% zoom.

- Chromium, Firefox and WebKit; desktop pointer and touch emulation. Real-device testing if available; otherwise mark emulation explicitly.
- iOS Safari-like viewport, Android Chrome-like viewport, mobile keyboard opening, rotation, safe-area inset, browser chrome/URL-bar resizing.
- No horizontal overflow, clipped UI, layered-content collisions, inaccessible fixed buttons, offscreen modal actions, or loss of focus.
- Test menu and hover interactions on devices without hover, mixed input devices, reduced-performance devices, and browser zoom.
- Verify custom font fallback, image loading, SVG rendering, animation behavior, backdrop filters, audio policy, CSS feature support, and `100vh`/dynamic viewport issues.
- Check dark/system contrast settings and media-query changes while page remains open.

## 6. Reliability, API and network edge cases

Inject controlled failures and verify recovery:

- Offline on first visit; lose network during search, variant selection, add-to-cart, quantity update, page transition and checkout handoff.
- Network throttling (slow mobile profile), high latency, request timeout, 429 rate limit, 401/403 unauthorized, 404 missing resource, 500/502/503 backend failures, malformed/partial/null GraphQL responses.
- Aborted and reordered requests; multiple simultaneous calls; slow deferred data; cancellation on route change and unmount.
- Refresh while menu/cart overlay is open; multi-tab changes; stale local/session state; cleared cookies; blocked third-party cookies where applicable.
- Direct deep links with invalid/oversized/encoded query parameters, Unicode and special characters; trailing slashes, unknown handles, unsupported locales, missing IDs.
- Browser Back/Forward during animations, quick route switching, reload mid-mutation; ensure error boundaries recover and no unhandled promise rejection occurs.
- No hydration mismatches, blank-screen failures, infinite loading states, stale race-condition UI, event listener leaks, runaway intervals, or uncontrolled request loops.
- Network errors show accessible, nontechnical and recoverable feedback, not raw stack traces or secrets.

## 7. Security and privacy review

Perform **non-destructive**, local/test-environment security checks only. Never run intrusive scans against Shopify or third-party production infrastructure.

- Search for accidentally committed secrets, server/private Storefront tokens in client bundle, `.env` leaks, public source maps containing confidential data, and logs with credentials/PII.
- Verify environment variable boundaries and no `PRIVATE_*` or equivalent secrets end up in browser-delivered code.
- Inspect output encoding/HTML rendering for XSS from product titles, descriptions, search strings, query params and custom metadata; scrutinize `dangerouslySetInnerHTML` and third-party embeds.
- Review URL redirects (`returnTo`, login callbacks, checkout links), unsafe external links (`target="_blank"` with safe rel), and untrusted URL protocols.
- Review authenticated endpoints for authorization, account/session isolation, correct logout, cache leakage, cookie attributes and session fixation risks where relevant.
- Check CSRF protections for state-changing requests under the chosen framework/session model, plus basic brute-force/rate-limit considerations for custom endpoints.
- Review dependency advisories using the repository's available audit command; triage **exploitable runtime** risks separately from dev-only/transitive issues. Don't blindly perform breaking mass upgrades.
- Inspect security headers where controlled by the app/host: CSP (including inline scripts and external assets), HSTS, content-type sniffing protection, referrer policy, frame policy and permissions policy.
- Confirm consent-sensitive analytics/tracking do not run before required consent; cookie preference choices persist correctly and can be revised where implemented.
- Validate webhook signature verification only if custom webhook handlers exist; do not fabricate a requirement for unused infrastructure.
- Review public error responses and API failures for accidental stack traces, keys, customer info, full GraphQL query logs, or internal details.

## 8. Performance and animation audit

Measure using appropriate Lighthouse/DevTools and available Hydrogen profiling tools in a production-like build. Record environment and throttling configuration so metrics are comparable.

- Measure **LCP, CLS, INP where real-user data exists**, and lab proxies such as TBT when INP field data is unavailable. Do not mislabel TBT as INP.
- Use Web Vitals guidance: generally aim for LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile of real-user samples where available. Treat lab scores as diagnostics, not guaranteed outcomes.
- Inspect route loaders for sequential requests/waterfalls, repeated Shopify API calls, overfetching, missing/incorrect caching and expensive server rendering.
- Ensure cart, account and other personalized responses are not publicly cached; understand caching per route/query and invalidation needs.
- Confirm critical images are sized, responsive, compressed and prioritized correctly; reserve dimensions; avoid lazy-loading the true LCP image.
- Minimize initial JavaScript, defer heavy 3D/animation code, split routes, and inspect bundle composition. Watch GSAP, 3D libraries, custom visual assets and oversized fonts.
- Profile hydration and long tasks; animated PS2 objects should use compositor-friendly transforms where possible, limit expensive blur/filter effects, and not continuously repaint large areas unnecessarily.
- Ensure animations remain responsive under CPU throttling and low-powered mobile devices; provide lightweight fallback if WebGL/canvas is unsupported.
- Check event cleanup for pointer listeners, audio nodes, animation timelines, observers and route transitions; avoid memory growth after repeated navigation.
- Test images disabled, JavaScript delayed, and low-bandwidth connections where practical; server-render essential commerce content where applicable.
- Inspect Shopify analytics/ad pixels/third-party SDKs for duplicate initialization, network overhead and consent handling.
- When available for the installed runtime, use Hydrogen subrequest profiling, build bundle reporting, and Oxygen worker CPU startup tools.

## 9. SEO, metadata and discoverability

- Each indexable route has a unique meaningful title, meta description when appropriate, one clear primary heading, correct canonical URL and consistent Open Graph/Twitter image metadata where available.
- Valid robots directives, robots.txt, sitemap, 404 status, 301/308 redirects as intended; no accidental indexability of sensitive/internal/empty test pages.
- Search/filter/sort/variant query URL canonicalization is sensible; avoid duplicate-index bloat and broken shareable links.
- Correct structured data for products, offers, availability, prices and currency **when implemented**; validate that data matches the rendered storefront and applicable market.
- Server-rendered HTML includes meaningful content and crawlable links; JS-only animated navigation must not hide all important category/product links from crawlers or no-JS browsing.
- Check broken internal links, malformed image URLs, inaccessible link text, missing product alt text, and invalid hreflang/market URLs if multi-market.
- Confirm privacy/cookie tools and analytics do not produce broken hydration or crawler-dependent content.

## 10. Data integrity, internationalization and Shopify-specific concerns

- Inspect Storefront API version compatibility with installed Hydrogen release; ensure typed GraphQL queries are valid, nullable fields handled, and API errors surfaced safely.
- Check pagination cursors, data normalization, product availability, unpublished products, draft data assumptions, and missing optional product/variant/metafields.
- Price formatting with Shopify Money values; correct currency symbols, decimals, locale separators, zero-price cases, compare-at/discount semantics; never use JS float math as the source of truth for totals.
- For configured Markets, verify selected country/language flow, product availability, currency conversion, URL strategy, buyer identity, and price/cart consistency.
- Cart ID/session lifecycle, cookie expiry, optimistic mutations, checkout URL creation, and error boundaries must match the installed Hydrogen implementation.
- Check analytics events (`page_viewed`, `product_viewed`, cart events, checkout handoff, search or collection events where applicable) for correct values, no duplicates and consent conditions.
- Where accounts exist, verify Customer Account API callback/refresh/logout handling per installed version and session integration.
- If deployed to Oxygen, verify Workers runtime compatibility, environment bindings, deployment build output and caching; otherwise audit the actual hosting target.

## 11. Visual regression and design preservation

- Capture baseline screenshots of representative states **before** changes: landing, fullscreen menu (default/hover/active), search (idle/typing/results/empty), collection, product, cart (empty/populated), loading/error, and mobile variants.
- Capture matching screenshots after fixes and review visual diffs; separate expected accessibility changes from unintended regressions.
- Preserve typography, PS2 visual hierarchy, motion personality, icon navigation, glow effects and spatial transitions unless a specific effect violates usability/accessibility or breaks performance.
- Check z-index/layering, scrolling inside full-screen overlays, text truncation, pointer-event handling, edge transitions, audio cleanup, and overlay persistence.
- Never make visual snapshots the only evidence of functional correctness.

## 12. Code quality and maintainability

- Execute existing typecheck, lint, format checks, unit tests and production build; report baseline vs final results.
- Audit obvious dead code, unused dependencies, duplicate subscriptions, stale effects, missing keys, missing cleanup, unsafe casts, non-null assertions on API data, and silent catch blocks.
- Inspect route-level loading/error boundaries, server/client separation, component boundaries, consistent request cancellation and reusable accessible primitives.
- Verify that async mutations disable or guard duplicate submissions appropriately while preserving retry capability.
- Add concise tests for fixed defects and critical paths. Keep mocks representative and maintainable; do not overfit to implementation details.
- Use existing repository style and avoid widespread rewrite merely to satisfy personal coding preferences.

## 13. Required test matrix

At minimum, execute or explicitly mark blocked for every applicable row:

| Journey / state | Desktop | Mobile/touch | Keyboard | Slow/offline | API error | Back/refresh | Axe |
|---|---|---|---|---|---|---|---|
| Landing and global navigation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| PS2 fullscreen overlay/submenus | ✓ | ✓ | ✓ | ✓ | N/A | ✓ | ✓ |
| Search idle/suggestions/results/empty | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Collection listing/filter/sort | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Product/variant/media | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add to cart and cart drawer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cart quantity/remove/empty | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Checkout handoff only | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Account/login/logout (if present) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Error/404/loading states | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

`✓` is **required coverage**, not an assertion of success. `N/A` must be justified. Record actual pass/fail/blocked in the execution report.

## 14. Priority and acceptance criteria

Classify issues:

- **P0 / Blocker:** possible customer data exposure, unsafe payment/checkout redirection, major store unavailability, confirmed critical security problem, or purchase path consistently broken.
- **P1 / High:** serious keyboard/screen-reader barriers to buying, incorrect cart totals/prices, cart corruption, major mobile failure, widely reproducible broken core journey.
- **P2 / Medium:** recoverable API error not explained, broken secondary interaction, notable performance regression, noncritical accessibility failures, SEO defects.
- **P3 / Low:** isolated visual polish, minor console-style animation glitch, cosmetic inconsistency without material usability impact.

A feature is **PASS** only with test evidence (or a documented manual procedure actually performed). A route is not automatically PASS because it rendered once. An inaccessible purchase journey is not production-ready even if click tests pass.

## 15. Required audit outputs

Create these files in the repo (or under a clearly identified `audit/` folder, adapting paths to local conventions):

1. `audit/FEATURE_MATRIX.md` — discovered routes/features, relevant files and applicability.
2. `audit/AUDIT_REPORT.md` — executive summary; environment/version; test commands; baseline and final results; known limits; risk assessment; issue table with **ID, priority, route, reproduction, expected, actual, cause, fix, test evidence, status**.
3. `audit/ACCESSIBILITY_REPORT.md` — automated scan results, manual keyboard checks, contrast/motion findings, WCAG mapping and unresolved manual-screen-reader tasks.
4. `audit/PERFORMANCE_REPORT.md` — reproducible measurements, tools, environment, routes, before/after numbers, bottlenecks and changes.
5. `audit/SECURITY_REVIEW.md` — non-destructive findings and remediation, redacted evidence, unresolved risks.
6. `audit/TEST_MATRIX.md` — actual results for the matrix above; include PASS / FAIL / BLOCKED / N/A and evidence locations.
7. Automated test files and any minimal necessary test configuration, following repository conventions.
8. `audit/RELEASE_READINESS.md` — explicit **GO / CONDITIONAL GO / NO-GO**, P0/P1 blockers, unresolved P2/P3, what was/wasn't executed, and reproducible manual follow-ups.

For each fix, include the changed code paths and linked test(s). Keep reports factual; do not claim full WCAG conformance, security certification or real-user performance guarantees from automated tooling alone.

## 16. Execution order — do this now

**Phase A — Discover:** Inspect the repository and installed stack. Build feature matrix and state coverage map. Identify safe test fixtures and environment constraints.

**Phase B — Baseline:** Run available checks and current flows; collect initial console, network, browser, accessibility, performance and screenshot evidence before touching code.

**Phase C — Reproduce:** Exercise the customer journeys, responsive states, failure injections and edge cases above. Create a prioritized issue log supported by concrete reproduction evidence.

**Phase D — Fix:** Address P0/P1 first, then P2/P3 as practical. Apply minimal robust fixes, prioritize secure and accessible purchase/navigation paths, and write regression tests.

**Phase E — Retest:** Rerun targeted tests, full available suite, typecheck, lint, production build, accessibility scans, visual comparisons, and performance spot-checks. Verify no regressions from fixes.

**Phase F — Deliver:** Generate the audit files and present a concise final summary containing:

- Framework/Hydrogen version and deploy target actually detected.
- Routes/features audited; number of tests **executed / passed / failed / blocked / N/A**.
- Highest-severity findings, fixes made, and remaining blockers.
- Before/after accessibility and performance evidence where measured.
- Exact commands to rerun locally/CI.
- **GO / CONDITIONAL GO / NO-GO** and why.

### Completion standard

**Do not stop after producing a plan, list of suspected bugs, or running only lint/build.** Actually inspect the code, exercise the site, test failure states, fix reproducible problems, and rerun the appropriate checks. If execution is blocked, still complete everything that can be tested and label the rest clearly. Never invent outcomes, screenshots, metrics, manual reviews or passing tests.

---

## Reference documentation

Verify relevance against installed versions rather than assuming the newest release applies:

- Shopify Hydrogen: https://shopify.dev/docs/api/hydrogen/latest
- Shopify Hydrogen performance guidance: https://shopify.dev/docs/storefronts/themes/best-practices/performance/hydrogen-performance
- Shopify customer accounts (if implemented): https://shopify.dev/docs/storefronts/hydrogen/customer-accounts
- Shopify Hydrogen repository / agent skills: https://github.com/Shopify/hydrogen
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
