# Shopify Hydrogen development

This storefront is scaffolded from Shopify's Hydrogen skeleton template. See the README for framework-specific details.

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts).

# Component simplicity

- Keep one React component per dedicated UI component file. Preserve framework-required exports in route modules.
- Extract a component only when it owns a clear responsibility, meaningful behavior/state or useful reuse, and makes the parent easier to understand. Give justified extractions their own descriptive files.
- Inline trivial markup instead of creating wrappers or extra files. Prefer a readable, cohesive component over many small fragments.
- Leave clean, simple, correct implementations alone; avoid cosmetic renaming, unnecessary hooks and abstractions.

# Centralized tests

- Keep all test files in the existing `tests/` directory; never place `.test.*` or `.spec.*` files alongside production source.
- Preserve the established `tests/lib`, `tests/components`, `tests/routes`, `tests/e2e` and shared fixtures/setup organization. Add feature nesting only when it helps; do not create empty directories.
- When simplifying, renaming, extracting or consolidating a component, locate its existing tests first, preserve them, update imports and add meaningful edge-case coverage as needed. Run affected tests before proceeding.
- Share fixtures/setup, keep tests independent and behavioral, and verify Vitest/Playwright discovery. Do not delete tests silently or add tests solely to increase coverage.

# Feature utility files

- Consolidate a component folder's stateless helpers and related shared data/types in one camelCase `<feature>Utils.ts` file, such as `cartUtils.ts` or `productDetailUtils.ts`.
- Import named helpers directly from that file; remove superseded helper modules instead of adding barrel re-exports or wrapper functions. Keep internal implementation helpers private unless another module needs them.
- Keep hooks in `useSomething.ts`, context in its owning module, component props beside their component, and callbacks that capture effect/state/cleanup values with their owner. Do not turn React lifecycle code into generic utilities.
- Reuse cross-feature helpers in `app/lib/` rather than copying them into each utility file. Do not create empty utility files in folders that have no independent helpers.

The simplest maintainable implementation wins: clear responsibilities, minimal complexity, predictable names, readable React code and confidence in existing behavior.
