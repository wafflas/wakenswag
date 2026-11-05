# Project conventions

## Stack and structure

Use the versions in `package.json` and `package-lock.json`: React 18, React Router 7 framework mode, Hydrogen 2026.4, TypeScript, Tailwind 4 and npm. This is not a Next.js app. Hydrogen's peer dependencies constrain compatible router releases; upgrade them together.

- `app/routes/`: HTTP loaders/actions, route metadata and page composition. Keep React Router filenames such as `merch.$handle.tsx` and `[robots.txt].tsx`.
- `app/components/<feature>/`: cohesive components plus one camelCase feature utility file for stateless helpers, such as `product-detail/productDetailUtils.ts` or `cart/cartUtils.ts`. Existing feature folders use kebab-case (`product-detail`) or simple domain names (`cart`).
- `app/lib/`: shared domain/server utilities, e.g. `productDetail.ts`, `money.ts`, `session.ts`.
- `app/styles/`: global defaults, Tailwind tokens/utilities, PS2 effects. Keep animation styles together.
- `tests/`: matching component/library/route tests, shared fixtures, isolated E2E worker. Production files never import this directory.

Keep closely related code together. Avoid barrel exports, service layers, component factories or new folders without a clear need. Do not rename working files purely for appearance.

Dedicated UI files contain one React component. Before extracting anything, check whether it owns an independent responsibility, meaningful behavior/state or useful reuse, and whether it makes the parent easier to follow. Inline trivial markup instead of giving it another component/file. Existing cohesive components should remain intact; a readable 150-line component is preferable to a dozen fragmented wrappers.

For example, `ProductPurchaseControls.tsx` owns quantity and purchase behavior, while `ProductDetail.tsx` owns product presentation and options. `CartLineQuantity.tsx` owns stock limits and mutation forms. In contrast, a conditional checkout link stays directly in `CartSummary.tsx`, and search status is one paragraph in `SearchScreen.tsx`. Keep framework-required route exports together; the one-component lint rule applies specifically to `app/components/` UI files.

## Feature utility modules

Use one `<feature>Utils.ts` module per component folder when independent helpers exist. Files and functions use camelCase, shared types use PascalCase, and true static constants use UPPER_SNAKE_CASE.

| Utility module                           | Responsibility                                                    |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `animations/animationUtils.ts`           | Animation durations, fade class mappings and related type         |
| `cart/cartUtils.ts`                      | Shared cart types, child-line grouping and pending submit content |
| `controller/controllerUtils.ts`          | Back destinations for home, product and other routes              |
| `home/homeUtils.ts`                      | Keyboard typing-target detection                                  |
| `product-detail/productDetailUtils.ts`   | Product themes and description parsing                            |
| `product-listing/productListingUtils.ts` | Listing constants, shared data types and pagination URLs          |
| `search/searchUtils.ts`                  | Search product normalization and shared search card types         |
| `shared/sharedUtils.ts`                  | Interactive-element lookup for interface sounds                   |

Components import named helpers directly:

```ts
import {
  getProductDescriptionBullets,
  getProductDetailTheme,
} from './productDetailUtils';
```

These utilities contain the actual implementations, not barrel re-exports. Internal helpers such as HTML stripping/color parsing stay private inside their feature module. Keep local component prop interfaces beside their component; put shared domain types with their related utilities. Reuse cross-feature code such as `app/lib/money.ts` instead of duplicating it across feature files.

Hooks keep their `useSomething.ts` names. Context and callbacks that depend on component state, refs or effect cleanup stay with their owner. In particular, modal lifecycle and audio playback handlers stay in their existing hook/effect. `layout/` and `content/` need no empty utility file because they have no independent helpers to collect. Small styling constants used only by one component can stay there.

The controller footer has two stages: `AppControllerFooter` keeps its outer footer mounted while `Suspense`/`Await` resolve the cart; `ControllerFooter` handles the three concrete Back, Search and Cart actions using the router, overlay context and Hydrogen's optimistic cart. Keep this direct flow rather than passing action-building callbacks through cart wrappers. The stable `data-modal-controls` element lets dialog focus handling find replacement buttons after cart loading. `ControllerActionCount` owns its count animation, and `ControllerSymbol` owns the shared icons.

## Names and types

| Item                | Convention                                | Repository example                        |
| ------------------- | ----------------------------------------- | ----------------------------------------- |
| Components/files    | PascalCase                                | `ProductDetail.tsx`, `CartLineItem.tsx`   |
| Hooks               | camelCase, `use` prefix                   | `useModalDialog`, `useVariantUrl`         |
| Utilities/functions | camelCase, descriptive verb               | `formatMoney`, `loadProductDetail`        |
| Booleans            | is/has/can/should                         | `isExiting`, `hasReachedStockLimit`       |
| Static constants    | UPPER_SNAKE_CASE                          | `PRODUCTS_PER_PAGE`                       |
| Types/props         | PascalCase                                | `ProductDetailProps`, `SearchProductCard` |
| Event callbacks     | `on...` props, `handle...` local handlers | `onClose`, `handleKeyDown`                |
| Tests               | source/domain name plus `.test.ts(x)`     | `ProductDetail.test.tsx`, `money.test.ts` |
| CSS classes         | existing Tailwind or `ps2-...` kebab-case | `ps2-main-menu-link`                      |

Use generated Shopify query/fragment types from `storefrontapi.generated.d.ts`; use `import type` for imports that exist only at compile time. Prefer inference for obvious local values. `Pick`/`Partial` are useful for a genuine subset of an existing type; do not create a generic framework around them. No explicit `any`; unused TypeScript variables are lint errors. Prefix intentionally unused function arguments with `_`.

After changing a GraphQL selection, run `npm run codegen`; never manually edit generated declarations. Keep fixtures checked against those same types. An `as unknown as ...` assertion is allowed at the test boundary where a deliberately partial mocked context stands in for the full Hydrogen context; do not use it to bypass application type errors.

## React and browser behavior

Keep state local unless several independent features coordinate through it. `AsideProvider` coordinates search/cart/HUD, and the product-exit context shares the one navigation blocker. Those providers solve concrete shared-state constraints.

Derive values during render when possible. For example, ProductPurchaseControls derives the allowed displayed quantity from requested quantity and current stock. The keyed ProductPurchaseControls resets quantity when the selected variant changes:

```tsx
<ProductPurchaseControls key={selectedVariant?.id ?? product.id} />
```

This excerpt omits the other required props. `?.` safely reads a property when the variant may be absent; `??` supplies a fallback for null/undefined. Changing `key` tells React this is a different component instance, so its local quantity starts at one. See [React's guidance on effects and state reset](https://react.dev/learn/you-might-not-need-an-effect).

Use state for values that affect rendering. Use refs for persistent mutable browser references/history, such as a dialog element, opener or visited-page set. Updating `.current` does not render the component. Avoid `useMemo`/`useCallback` unless their stable identity or measured work matters; stable `open`/`close` callbacks prevent dialog effects from unnecessarily restarting.

Effects synchronize browser systems: focus, scroll locking, audio, timers and event listeners. Return cleanup that restores previous values, removes listeners and clears timers. Reuse `useModalDialog` for full-screen dialogs; it preserves HUD actions, traps focus, makes background siblings inert and restores focus after closing. Do not add another document-level Escape listener to those dialogs.

`AsideProvider` keeps Search/Cart active while `isExiting` drives `FadeTransition`'s 300 ms overlay fade-out. All close paths share this state; keep focus containment and scroll locking active until the exit finishes. `useExiting` shares timer cleanup and reduced-motion handling with `useRouteExitTransition`. Opening another overlay cancels the pending close. Only `RouteFadeTransition` installs a router blocker.

Pass callbacks rather than invoking them during render: `onClick={close}` waits for a click, while `onClick={close()}` calls immediately. Use an arrow callback when arguments or multiple steps are needed.

React Router supports one active navigation blocker. `RouteFadeTransition` owns it; ProductDetailRouteView consumes its product-exit state. Preserve the normal 400 ms product exit / 500 ms main-menu fade and reduced-motion behavior.

Use stable product/line IDs for list keys. Keep semantic links for navigation and buttons for actions. Do not nest interactive elements. Announce async status/errors using `role="status"`/`role="alert"`; provide a useful retry path.

## Hydrogen and routing

Fetch catalog/product data in loaders and mutate carts in actions. Continue using `CartForm`, `useOptimisticCart`, `useOptimisticVariant`, `getProductOptions` and `getSelectedProductOptions` from the installed Hydrogen package. Keep the request context, session/cart cookies, streamed promises, analytics/consent provider and CSP nonce handling.

Use `getPaginationVariables(request, {pageBy: PRODUCTS_PER_PAGE})` in catalog loaders. ProductListingPagination emits ordinary React Router links with matching `cursor` and `direction` parameters. This supports page flips and browser history without Hydrogen Pagination's accumulating-node behavior. Never download the entire catalog for pagination.

Validate user-controlled redirect paths with `getSafeRedirectPath`; checkout URLs come from Shopify cart responses. Do not invent product availability, cart totals or currency conversions on the client. `formatMoney` only formats Shopify amounts. Keep EUR's existing `EURO` label; display other currencies accurately.

Handle nullable API data, GraphQL errors and mutation `errors` separately from successful HTTP transport. Preserve the custom `/merch/:handle` routes in canonical links, cards, search, cart and sitemaps. Info/socials placeholders and unimplemented account/filter features are intentional, not invitations to add unrelated features.

## Formatting and testing

Use the existing Shopify Prettier config, single quotes and no spaces inside import/object braces. `npm run format:check`, `lint` and `typecheck` enforce the mechanical rules. Keep imports explicit and remove unused imports; avoid adding an import-sorting dependency.

`react/no-multi-comp` enforces one component per dedicated UI file. ESLint also rejects test/spec files under `app/`. All tests remain centralized in `tests/`; keep the existing library, component, route integration and E2E groups. Use component/functionality names, shared fixtures/setup and useful feature nesting without creating empty directories. Vitest discovers `tests/**/*.test.{ts,tsx}`; Playwright uses `tests/e2e/`.

Before changing a component boundary or filename, locate its centralized tests, preserve/update their imports, check important edge cases and run the affected tests. Do not silently remove tests when removing a wrapper or add superficial tests solely to raise coverage.

Test observable behavior and edge cases. Prefer role/name selectors and realistic user events over snapshots or state inspection. Each meaningful bug fix should have an appropriate regression test. Unit/integration tests use deterministic fixtures; E2E tests use the test-only Oxygen worker. Read `TESTING.md` before extending either suite. Preserve the PS2 visual design and verify animation/responsive behavior in a browser when changing it.
