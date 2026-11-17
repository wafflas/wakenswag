# Accessibility status and follow-up checks

Documentation reviewed against the Hydrogen 2026.10 codebase on 2026-11-17. This updates the status of the 2026-11-16 audit; it is not a new full accessibility audit or a claim of WCAG conformance. The original audit used local Shopify fixtures and desktop/mobile Chromium, not a live store or real assistive technology.

The old report described several defects that the current code has addressed. Implementation and existing regression coverage are listed below. Dated execution results and test limits are recorded in [TESTING.md](TESTING.md); documentation maintenance does not rerun or renew those results.

## Implemented fixes and regression coverage

| Area                             | Current implementation                                                                                                                                                              | Existing coverage                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Short-viewport listings and cart | Responsive rules in [ps2-effects.css](app/styles/ps2-effects.css) and the listing/cart components provide reachable content.                                                        | The two reflow journeys check separate product hit targets, pagination and complete cart controls at 320 × 256 CSS pixels.                        |
| 404 document title               | Error-aware metadata in [root.tsx](app/root.tsx) supplies the storefront name and 404 status in the title.                                                                          | Direct SSR, hydration and client-navigation checks assert one non-empty title.                                                                    |
| Modal ownership                  | [StorefrontDialog.tsx](app/components/layout/StorefrontDialog.tsx) uses Radix Dialog and renders the active controller footer inside its content.                                   | Dialog journeys cover containment, Back/Escape, nested overlays and opener restoration.                                                           |
| Ordinary route focus             | [useRouteFocus.ts](app/components/layout/useRouteFocus.ts) focuses `[data-route-focus]` after pathname navigation and the route fade; query updates preserve focus.                 | Route-focus journeys cover navigation and Search typing during query-only updates.                                                                |
| Page landmarks and headings      | [PageLayout.tsx](app/components/layout/PageLayout.tsx) owns a `main`; [home](app/routes/_index.tsx) and [NotFoundPage.tsx](app/components/shared/NotFoundPage.tsx) include an `h1`. | Source structure and the existing 404/navigation checks cover the implemented pages; screen-reader landmark navigation still needs manual review. |
| Footer semantics                 | [ControllerFooter.tsx](app/components/controller/ControllerFooter.tsx) uses a named `group` for ordinary buttons.                                                                   | Keyboard and dialog journeys exercise these controls; no toolbar arrow-key contract is declared.                                                  |

These tests live in [storefront.spec.ts](tests/e2e/storefront.spec.ts). A simulated short viewport is useful regression coverage, but it is not an actual browser-zoom or screen-reader session.

## Remaining issues and review work

### Contrast and legibility

- Inactive home/Info links remain a priority. The previous audit measured 2.86:1 against black. [ps2-effects.css](app/styles/ps2-effects.css) still applies `opacity: 0.66` and `blur(1.2px)` to `.ps2-main-menu-link`; this documentation update did not repeat the measurement. Improve and remeasure the rendered normal state, including the CRT overlay, before closing the finding.
- The dim status paragraph in [SearchScreen.tsx](app/components/search/SearchScreen.tsx) has a recorded contrast finding. Structural dialog assertions do not establish a contrast pass.
- Gradients, outlines, filters, CRT effects, variant controls and populated search/cart states still require manual contrast review. Incomplete axe results are unresolved checks.

### Accessible names and search feedback

- [SearchProductItem.tsx](app/components/search/SearchProductItem.tsx) and [CartLineItem.tsx](app/components/cart/CartLineItem.tsx) use `aria-label="View [title]"` on links whose visible content also includes other details. The earlier audit reported `label-content-name-mismatch`; review with voice control and a screen reader before assigning a conformance verdict.
- Search announces prompt/loading/empty states and recoverable errors. Successful results still have no dedicated result-count announcement. Review that feedback while focus remains in the input.
- Validate real catalog image descriptions and long published policies; fixture text cannot establish their accessibility.

### Manual browser and assistive-technology checks

- Test VoiceOver and NVDA reading/navigation, dialog titles and close controls, nested overlays, restored focus, cart errors and quantity announcements.
- Test actual browser zoom, text sizing, long content and checkout-link visibility; the 320 × 256 tests cover a constrained fixture layout.
- Check Firefox, Safari/WebKit and physical touch devices. Pixel 7 emulation does not prove real-device behavior.
- Review switch/speech input, focus visibility and the complete purchase handoff without submitting an order.

## Repeating the automated checks

With port 4173 free:

```sh
npm run test:e2e -- --grep 'accessib|keyboard|focus|reflow|404 titles|reduced|cookie'
```

Playwright starts the separate fixture worker. See [TESTING.md](TESTING.md) for production-fixture runs, reports and live-store limits.

The structural dialog test runs a full axe scan and attaches its violations, but its assertion filters out `color-contrast`. Inspect `search-accessibility.json` and `cart-accessibility.json` in the Playwright artifacts; a passing structural assertion is not a clean full scan. The cookie-banner and 404-title checks have their own assertions and narrower scope.

Priorities are unresolved menu/search contrast, populated-content/name review, then real assistive-technology and browser/device verification. Keep findings open until the relevant checks have actually been performed.
