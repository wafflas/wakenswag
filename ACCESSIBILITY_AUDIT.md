# Accessibility audit

Audited: 16 November 2026. Scope: the current local storefront, using the real
Hydrogen/React components with the repository's Shopify fixtures. No storefront
code was changed for this audit. Existing product-pricing edits were preserved.

## Outcome

Two high-priority issues need attention: insufficient contrast in inactive menu
items, and overlapping/clipped content at high zoom. Five further findings cover
page titles, modal structure, route focus, and navigation semantics. These are
priorities for fixing this storefront, not the severity labels assigned by axe.

This is an engineering accessibility audit, not a claim of WCAG conformance.
Confirmed WCAG failures, observed behavior with assistive-technology risk, and
best-practice improvements are distinguished below.

## Method and coverage

- Ran the existing Playwright tests matching
  `accessib|keyboard|focus|reduced|contrast|axe`: **12 passed**, across desktop
  Chromium and the Pixel 7 Chromium profile.
- Ran unfiltered axe-core 4.14 scans on **26 normal page states**: home,
  information menu, privacy policy, Swag listing, Drumkits listing, both product
  detail types, 404, search prompt, populated search results, empty cart,
  populated cart, and cookie banner, on both profiles.
- Scanned **14 additional stress states**: seven each at 320 × 256 CSS pixels
  and at 200% root-font sizing. The first simulates the viewport available at
  400% browser zoom on a 1280 × 1024 display. Root-font sizing is a text-sizing
  stress check, not an actual browser text-zoom test.
- Independently verified the overlapping grid using browser hit testing, checked
  a populated cart at 320 × 256, inspected Chromium's accessibility tree, and
  exercised keyboard route navigation and toolbar arrow behavior.
- Examined rendered screenshots and reviewed component, CSS, and test source.
- External product images and Shopify browser services were replaced by local
  fixtures. No live cart, checkout, product, or store settings were changed.

axe reported incomplete contrast results on gradients, filters, and some
overlapping content. Those results are **unresolved**, not passes. Its automated
`landmark-one-main`, `page-has-heading-one`, and `region` findings include
best-practice rules; they are not automatically WCAG failures.

## 1. High — product grid overlaps and cart checkout is clipped at high zoom

**Evidence:** At 320 × 256, all four Swag product rows occupy almost the same
vertical space. The first card is at y=47 with height 88px; the tenth card is at
y=83. Hit testing the first card's center returns the tenth product link. The
same interference affects the first nine cards. The page has no document
overflow that would allow an ordinary vertical scroll to reveal separate rows.

In a populated cart at the same size, the item-list viewport is only 26px high.
The checkout link spans y=244–264, beyond the 256px viewport, and is clipped by
the dialog's overflow rules.

**Cause:** A fixed viewport-height shell combines fixed row counts, product-image
sizes, footer space, and `overflow-hidden`. The content cannot shrink enough for
the available height.

**Sources:**
[ProductListingShell.tsx](app/components/product-listing/ProductListingShell.tsx),
[ProductGrid.tsx](app/components/product-listing/ProductGrid.tsx),
[CartModal.tsx](app/components/cart/CartModal.tsx), and
[CartMain.tsx](app/components/cart/CartMain.tsx).

**Reproduce:** Use the fixture storefront at `/swag`, set the viewport to 320 ×
256, and enable reduced motion to remove entrance-animation timing. Inspect the
four rows or click where the first product should be. Add a product, open the
cart, and inspect the bottom of the checkout link.

**Fix:** On short viewports, let the listing grow and scroll vertically or give
the grid an explicit scroll area with non-overlapping rows. Allow the cart body
to scroll as a whole when its header, controls, and summary cannot fit. Keep the
checkout link and focused controls clear of the fixed footer.

**Acceptance:** At the same size, every product can be reached separately and
the entire checkout control can be brought into view without horizontal
scrolling or obscuring another required control. Add a zoom/reflow regression
test; checking `scrollWidth <= innerWidth` alone misses this failure.

**Standard:** Confirmed content/operation loss relevant to
[WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

## 2. High — inactive menu text has insufficient contrast

**Evidence:** On home and Info, axe measures inactive menu text at **2.86:1**
against black. Large text requires at least **3:1**; smaller text requires
**4.5:1**. Both desktop and mobile profiles reproduce the issue.

**Cause:** `.ps2-main-menu-link` uses gray text with `opacity: 0.66`, effectively
reducing it to approximately `#565656` against black. It also applies
`filter: blur(1.2px)`, which further softens the lettering. These are actionable
links, not disabled controls.

**Source:** [ps2-effects.css](app/styles/ps2-effects.css), line 19.

**Fix:** Use a solid text color with adequate contrast for inactive links. Keep
the selected item visually distinct through cyan, an indicator, or weight;
remove blur from meaningful navigation text. Recheck after the CRT overlay is
composited over the page.

**Acceptance:** Every link meets its applicable contrast threshold before
hover/focus, and the normal-state letters remain legible.

**Standard:** Confirmed
[WCAG 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
failure.

## 3. Medium — the rendered 404 has an empty document title

**Evidence:** Loading `/not-a-page` returns the expected 404 UI but
`document.title` is an empty string on both normal profiles. axe reports
`document-title`.

**Cause:** The catch-all route declares a title, but its loader throws and the
root error boundary renders `NotFoundPage`. The catch-all's declared metadata
does not survive into this rendered error response.

**Sources:** [$.tsx](app/routes/$.tsx), line 4, and
[root.tsx](app/root.tsx), `ErrorBoundary`.

**Fix:** Supply error-aware document metadata at the boundary/root level that
actually renders the response. Keep the HTTP 404 response intact.

**Acceptance:** Direct requests and client navigation to missing URLs produce
a descriptive non-empty title such as `404 | Wake N Swag`.

**Standard:** Confirmed
[WCAG 2.4.2 Page Titled](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html)
failure.

## 4. Medium — modal close controls sit outside the modal's semantic boundary

**Evidence:** Search, cart, and product dialogs use `aria-modal="true"`. Their
visible Back control lives in the separate footer, outside the dialog. The
focus-trap hook explicitly allows focus in both the dialog and that footer.
Browser inspection confirmed `Back.closest('[role="dialog"]')` is null.

Chromium currently exposes Back in its accessibility tree and the keyboard
tests pass. Actual VoiceOver/NVDA navigation was not tested: the risk is that
assistive technology restricting navigation to the modal can omit its external
close control. This is a confirmed structural inconsistency, not a reproduced
screen-reader lockout.

**Sources:** [PageLayout.tsx](app/components/layout/PageLayout.tsx), line 43;
[useModalDialog.ts](app/components/layout/useModalDialog.ts), lines 30 and 55;
[AppControllerFooter.tsx](app/components/controller/AppControllerFooter.tsx).

**Fix:** Make all controls required to operate/close a modal descendants of that
modal. A visually fixed footer can retain the existing appearance while being
owned by the active dialog. Keep Tab containment and opener restoration.

**Acceptance:** Back is inside the active dialog in the DOM/accessibility tree;
Tab and Shift+Tab remain inside it; Escape and Back close it; focus returns to
the opener. Verify the result with VoiceOver and NVDA.

**Guidance:**
[WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## 5. Medium — ordinary route changes have no deliberate focus handoff

**Evidence:** Activating Info with Enter from home, then activating Privacy
Policy from Info, leaves `document.activeElement` as `body` after each route
change. The new page has no route-announcement live region; the only live text
in these probes is the cart count. Product and aside dialogs have explicit
focus management, but ordinary pages do not.

**Impact:** Keyboard and screen-reader users can lose their current position
when the activated link unmounts. A screen reader may not clearly convey the
new page's starting point. Screen-reader speech was not directly measured, so
this is an observed focus gap and usability risk, not a conformance verdict.

**Sources:** [PageLayout.tsx](app/components/layout/PageLayout.tsx) and
[RouteFadeTransition.tsx](app/components/animations/RouteFadeTransition.tsx).

**Fix:** After a pathname navigation finishes, focus the new page heading or
main region using `tabIndex={-1}`. Coordinate this with dialog focus handling,
and avoid moving focus on search input updates or variant-query changes.

**Acceptance:** Keyboard activation of an ordinary route provides a predictable
starting point and an understandable page change in screen-reader testing.

**Guidance:**
[WCAG focus-order considerations](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).

## 6. Low — ordinary pages lack a main landmark; home and 404 lack an h1

**Evidence:** The audited normal pages expose no `main`/`role="main"`. Home is
navigation-only without an h1, and the 404's heading-like text is implemented
with paragraphs. axe flags the missing landmark and headings as best-practice
issues. Named navigation, search, and product regions already exist.

**Sources:** [PageLayout.tsx](app/components/layout/PageLayout.tsx),
[HomeShell.tsx](app/components/home/HomeShell.tsx),
[_index.tsx](app/routes/_index.tsx), and
[NotFoundPage.tsx](app/components/shared/NotFoundPage.tsx), line 17.

**Fix:** Give normal route content one main landmark and an appropriate h1,
using a visually hidden heading where it fits the home design. Do not place
every global overlay/footer inside main or introduce multiple nested mains.

**Acceptance:** Landmark and heading navigation identify the page's main
content and title. This is an improvement to page semantics, not a blanket
claim that missing `main` or h1 alone violates WCAG.

## 7. Low — the footer declares a toolbar without toolbar keyboard behavior

**Evidence:** `ControllerFooter` declares `role="toolbar"`, while all buttons
are independent Tab stops and Left/Right Arrow do not move between controls.
The browser probe focused Search and pressed Right Arrow: focus stayed Search.
Ordinary Tab navigation remains functional.

**Source:** [ControllerFooter.tsx](app/components/controller/ControllerFooter.tsx),
line 42.

**Fix:** For this small group of ordinary buttons, use a named group instead of
toolbar. Alternatively, implement the toolbar pattern's single Tab stop and
arrow-key focus movement. The group is the simpler option here.

**Acceptance:** The announced role matches the keyboard interaction.

**Guidance:**
[WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

## Additional review items

- **Product link names:** The populated search and cart scans report
  `label-content-name-mismatch`. Their `aria-label="View [title]"` overrides
  the complete visible contents, which also include price, size, category, or
  availability. The title itself is present in the accessible name, so the
  automated result needs manual label-in-name/voice-control review before being
  classified as a WCAG failure. Consider naming the link from its title and
  associating supplementary details with `aria-describedby`.
- **Search completion:** Successful results remove the scanning status without
  adding a result-count announcement. A count would improve feedback while
  focus remains in the input. A results list alone is not a status message, so
  the absence of that optional count is not itself proof of a 4.1.3 failure.
  See [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).
- **Contrast still requiring manual review:** Gradients, text outlines,
  filters, the CRT overlay, variant controls, and populated cart/search content
  produced incomplete axe contrast checks. Do not interpret zero automated
  violations on a product dialog as a contrast pass.
- **Automated coverage:** The existing dialog accessibility test excludes
  `color-contrast` failures and covers an empty cart. Expand it to representative
  pages, populated results/cart, and short-viewports after fixes. Its current
  pass does not establish whole-store accessibility.

## What is already working

- Native links and buttons provide basic keyboard activation.
- Search has a programmatic input label, initial input focus, empty/loading
  status text, and an error alert with retry.
- Dialog keyboard tests pass for containment, Escape, and focus restoration.
  The modal-boundary concern above remains.
- Reduced-motion styles disable route/product effects and the continuous
  logo/CRT/selection animations; tested motion behavior passed.
- Quantity controls have descriptive labels, pending/stock disabling, and live
  quantities. Add-to-cart failures expose an alert and support retry.
- The document language is set to English. The cookie banner has a named
  region, labeled actions, status/error feedback, and suppresses itself while
  dialogs own focus.

## Limits and evidence

No actual VoiceOver, NVDA, switch-control, or speech-input session was performed.
Safari and Firefox, actual browser zoom, a live Shopify checkout, real catalog
image descriptions, long live policy content, and every product theme/state
remain unverified. Automated scans cannot certify accessibility.

Session evidence is stored at
`/private/tmp/wakenswag-accessibility-audit/`: per-state axe JSON, screenshots,
ARIA snapshots, `summary.json`, `interaction-probes.json`, and
`verified-probes.json`. These temporary files may not survive system cleanup.
The `verified-reflow-swag.png` and `verified-reflow-cart-full.png` screenshots
show the two reproduced layout failures.

Suggested fix order: reflow/checkout access, menu contrast, 404 title, modal
ownership, route focus, then landmark and footer semantics. Re-run targeted
browser checks and perform assistive-technology testing after implementation.
