# Shopify browser runtime snapshots

Downloaded from Shopify CDN on 2026-11-17, to exercise real Standard Actions, events and the analytics destination without depending on CDN access during regression runs. These are unmodified vendor scripts; `standard-actions.js` records its upstream revision in the first line. They are used only by test fixtures and never bundled into production.

Sources:

- https://cdn.shopify.com/storefront/standard-actions.js
- https://cdn.shopify.com/storefront/standard-events.js
- https://cdn.shopify.com/storefront/analytics/shopify.js

Update these snapshots when upgrading Hydrogen, then rerun browser cart and consent/analytics regressions.
