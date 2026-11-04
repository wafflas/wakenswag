import {expect, test, type Page} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';

async function openPage(page: Page, path: string) {
  await page.goto(path);
  // SSR links are visible before React attaches handlers. Wait for the real
  // framework router instead of adding a timing-dependent sleep.
  await page.waitForFunction(() =>
    Boolean(
      (window as Window & {__reactRouterDataRouter?: unknown})
        .__reactRouterDataRouter,
    ),
  );
}

test.beforeEach(async ({page}) => {
  // Tests never send browser requests to Shopify/analytics or real checkout.
  await page.route(/^https:\/\//, async (route) => {
    if (route.request().resourceType() === 'image') {
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#555"/></svg>',
      });
      return;
    }
    await route.abort();
  });
});

test('homepage navigation and important routes work', async ({page}) => {
  await openPage(page, '/');
  await expect(
    page.getByRole('navigation', {name: 'Main navigation'}),
  ).toBeVisible();
  await page.getByRole('link', {name: 'Merch', exact: true}).click();
  await expect(page.getByRole('region', {name: /Products/})).toBeVisible();
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(
    page.getByRole('navigation', {name: 'Main navigation'}),
  ).toBeVisible();
  for (const label of ['Drumkits', 'Info', 'Socials']) {
    await page.getByRole('link', {name: label, exact: true}).click();
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    await page.getByRole('button', {name: 'Back', exact: true}).click();
  }
});

test('product quantity, add to cart, persisted cart and removal work', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openPage(page, '/merch');
  await page.getByRole('link', {name: /Fixture Tee, selected/}).click();
  await expect(
    page.getByRole('dialog', {name: 'Fixture Tee', exact: true}),
  ).toBeVisible();
  await page.getByRole('button', {name: /Increase quantity/}).click();
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText('2');
  await page.getByRole('button', {name: 'Add to cart', exact: true}).click();
  await expect(page.getByRole('button', {name: /Cart \(2\)/})).toBeVisible();
  await page.getByRole('button', {name: /Cart \(2\)/}).click();
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toBeVisible();
  await page
    .getByRole('dialog', {name: 'Shopping cart'})
    .getByRole('button', {name: 'Decrease quantity'})
    .click();
  await expect(
    page.getByRole('dialog', {name: 'Shopping cart'}).getByRole('status'),
  ).toHaveText('1');
  await expect(
    page.getByRole('link', {name: 'Go to checkout'}),
  ).toHaveAttribute('href', 'https://checkout.example.test/cart/fixture');
  await page.reload();
  await page.waitForFunction(() =>
    Boolean(
      (window as Window & {__reactRouterDataRouter?: unknown})
        .__reactRouterDataRouter,
    ),
  );
  await page.getByRole('button', {name: /Cart \(1\)/}).click();
  await page.getByRole('button', {name: 'Remove item', exact: true}).click();
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('predictive search returns products and supports empty results', async ({
  page,
}) => {
  await openPage(page, '/');
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  const input = page.getByRole('searchbox', {name: 'Search memory'});
  await input.fill('tee');
  await expect(page.getByRole('list', {name: 'Search results'})).toBeVisible();
  await input.fill('nothing');
  await expect(page.getByText('No memory found')).toBeVisible();
  await input.clear();
  await expect(page.getByText('Insert search term')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('cursor pagination reaches every product and survives reload and history', async ({
  page,
}) => {
  await openPage(page, '/merch');
  const products = page.getByRole('region', {name: 'Products', exact: true});
  await expect(products.getByRole('link')).toHaveCount(12);
  await page.getByRole('link', {name: 'Go to next product page'}).click();
  await expect(
    products.getByRole('link', {name: /Fixture Tee 13,/}),
  ).toBeVisible();
  await expect(page).toHaveURL(/cursor=11/);
  await page.reload();
  await page.waitForFunction(() =>
    Boolean(
      (window as Window & {__reactRouterDataRouter?: unknown})
        .__reactRouterDataRouter,
    ),
  );
  await expect(
    products.getByRole('link', {name: /Fixture Tee 13,/}),
  ).toBeVisible();
  await page.getByRole('link', {name: 'Go to next product page'}).click();
  await expect(products.getByRole('link')).toHaveCount(1);
  await page.getByRole('link', {name: 'Go to previous product page'}).click();
  await expect(products.getByRole('link')).toHaveCount(12);
  await page.goBack();
  await expect(products.getByRole('link')).toHaveCount(1);
});

test('variant links update URL, price, quantity and merchandise added to cart', async ({
  page,
}) => {
  await openPage(page, '/merch/fixture-tee');
  await expect(page).toHaveTitle('Fixture Tee | Wake n Swag');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4173/merch/fixture-tee',
  );
  const product = page.getByRole('dialog', {name: 'Fixture Tee', exact: true});
  await product.getByRole('button', {name: /Increase quantity/}).click();
  await product.getByRole('link', {name: 'Large', exact: true}).click();
  await expect(page).toHaveURL(/Size=Large/);
  await expect(product.getByText('30 EURO', {exact: true})).toBeVisible();
  await expect(product.getByRole('status')).toHaveText('1');
  await expect(
    product.getByRole('link', {name: 'Large', exact: true}),
  ).toBeFocused();
  await product.getByRole('button', {name: 'Add to cart', exact: true}).click();
  await expect(page.getByRole('button', {name: /Cart \(1\)/})).toBeVisible();
  await page.getByRole('button', {name: /Cart \(1\)/}).click();
  const cart = page.getByRole('dialog', {name: 'Shopping cart'});
  await expect(cart.getByText('Large', {exact: true})).toBeVisible();
  await expect(
    cart
      .getByRole('list', {name: 'Cart items'})
      .getByText('30 EURO', {exact: true}),
  ).toBeVisible();
  await expect(cart.getByText(/^Total/)).toHaveText('Total 30 EURO');
});

test('dialogs contain keyboard focus, preserve the HUD and restore the opener', async ({
  page,
}) => {
  await openPage(page, '/');
  const opener = page.getByRole('button', {name: 'Search', exact: true});
  await opener.click();
  const input = page.getByRole('searchbox', {name: 'Search memory'});
  await expect(input).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', {name: 'Back', exact: true}),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', {name: 'Back', exact: true}),
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('button', {name: 'Back', exact: true}),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('closing a cart over a product keeps the product open and locked', async ({
  page,
}) => {
  const blockerWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('only supports one blocker'))
      blockerWarnings.push(message.text());
  });
  await openPage(page, '/merch/fixture-tee');
  await page.getByRole('button', {name: /Cart/}).click();
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', {name: 'Fixture Tee', exact: true}),
  ).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    'hidden',
  );
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/merch$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(blockerWarnings).toEqual([]);
});

test('search outages have a retry action and sold-out/missing variants stay safe', async ({
  page,
}) => {
  await openPage(page, '/');
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  await page.getByRole('searchbox').fill('outage');
  await expect(page.getByRole('alert')).toContainText('Search is unavailable');
  const retry = page.waitForRequest(
    (request) =>
      request.url().includes('/search.data') &&
      request.url().includes('q=outage'),
  );
  await page.getByRole('button', {name: 'Try again'}).click();
  await retry;
  await expect(page.getByRole('alert')).toBeVisible();
  for (const handle of ['sold-out', 'no-variant']) {
    await openPage(page, `/merch/${handle}`);
    await expect(page.getByRole('button', {name: 'Sold out'})).toBeDisabled();
  }
});

test('404 pages have valid navigation and product images respect reduced motion', async ({
  page,
}) => {
  const response = await page.goto('/not-a-page');
  expect(response?.status()).toBe(404);
  await page.waitForFunction(() =>
    Boolean(
      (window as Window & {__reactRouterDataRouter?: unknown})
        .__reactRouterDataRouter,
    ),
  );
  await expect(page.getByRole('toolbar')).toHaveCount(1);
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  await page.getByRole('searchbox').fill('tee');
  await expect(page.getByRole('list', {name: 'Search results'})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name: /Cart/}).click();
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', {name: 'Return to the main menu'}).click();
  await expect(
    page.getByRole('navigation', {name: 'Main navigation'}),
  ).toBeVisible();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.getByRole('link', {name: 'Merch', exact: true}).click();
  await expect(page.getByText('Now loading...')).toHaveCount(0);
  const first = page
    .getByRole('region', {name: 'Products', exact: true})
    .getByRole('link')
    .first();
  await expect(first).toHaveCSS('animation-name', 'none');
  await expect(first).toHaveCSS('opacity', '1');
});

test('search and cart dialogs pass structural accessibility checks', async ({
  page,
}) => {
  await openPage(page, '/');
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  // Color/blur are intentionally PS2-styled; this checks dialog structure,
  // labels and keyboard semantics, without claiming full WCAG conformance.
  const search = await new AxeBuilder({page})
    .include('[role="dialog"]')
    .analyze();
  await test.info().attach('search-accessibility.json', {
    body: JSON.stringify(search.violations, null, 2),
    contentType: 'application/json',
  });
  expect(
    search.violations.filter((violation) => violation.id !== 'color-contrast'),
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name: /Cart/}).click();
  const cart = await new AxeBuilder({page})
    .include('[role="dialog"]')
    .analyze();
  await test.info().attach('cart-accessibility.json', {
    body: JSON.stringify(cart.violations, null, 2),
    contentType: 'application/json',
  });
  expect(
    cart.violations.filter((violation) => violation.id !== 'color-contrast'),
  ).toEqual([]);
});

test('failed add-to-cart rolls back the optimistic state and permits a retry', async ({
  page,
}) => {
  await openPage(page, '/merch/fixture-tee');
  const cartRoute = /\/cart(?:\.data)?(?:\?|$)/;
  await page.route(cartRoute, (route) =>
    route.continue({
      headers: {...route.request().headers(), 'x-fixture-cart-error': 'true'},
    }),
  );
  await page.getByRole('button', {name: 'Add to cart', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText(
    'Could not add this item',
  );
  await expect(page.getByRole('button', {name: /Cart \(0\)/})).toBeVisible();
  await page.unroute(cartRoute);
  await page.getByRole('button', {name: 'Add to cart', exact: true}).click();
  await expect(page.getByRole('button', {name: /Cart \(1\)/})).toBeVisible();
  await page.getByRole('button', {name: /Cart \(1\)/}).click();
  await page.getByRole('button', {name: 'Empty cart', exact: true}).click();
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
});

test('a delayed old search response cannot replace a newer query', async ({
  page,
}) => {
  await openPage(page, '/');
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  let release = () => {};
  let completed = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const continued = new Promise<void>((resolve) => {
    completed = resolve;
  });
  await page.route(/\/search\.data\?.*q=old/, async (route) => {
    await gate;
    // React Router can abort this fetch when the newer query starts.
    await route.continue().catch(() => undefined);
    completed();
  });
  const requested = page.waitForRequest((request) =>
    request.url().includes('q=old'),
  );
  await page.getByRole('searchbox').fill('old');
  await requested;
  await page.getByRole('searchbox').fill('tee');
  await expect(
    page.getByRole('link', {name: 'View Fixture Tee'}),
  ).toBeVisible();
  release();
  await continued;
  await expect(page.getByRole('searchbox')).toHaveValue('tee');
  await expect(
    page.getByRole('link', {name: 'View Old Fixture Tee'}),
  ).toHaveCount(0);
});

test('product and main-menu exit animations retain their timing', async ({
  page,
}) => {
  await openPage(page, '/merch/fixture-tee');
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(page.locator('.anim-genie-shrink')).toHaveCSS(
    'animation-duration',
    '0.4s',
  );
  await expect(
    page.getByRole('dialog', {name: 'Fixture Tee', exact: true}),
  ).toHaveCSS('animation-duration', '0.3s');
  await expect(page).toHaveURL(/\/merch$/);
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(page.locator('.route-fade-transition--out')).toHaveCSS(
    'animation-duration',
    '0.5s',
  );
  await expect(page).toHaveURL(/:\d+\/$/);
});

test('representative screens fit the viewport and provide review screenshots', async ({
  page,
}) => {
  await openPage(page, '/');
  await page.screenshot({
    path: test.info().outputPath('home.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  await page.getByRole('searchbox').fill('tee');
  await expect(page.getByRole('list', {name: 'Search results'})).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('search.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await openPage(page, '/merch/fixture-tee?Size=Large');
  await expect(page.getByText('30 EURO', {exact: true})).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('product.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', {name: 'Add to cart', exact: true}).click();
  await expect(page.getByRole('button', {name: /Cart \(1\)/})).toBeVisible();
  await page.getByRole('button', {name: /Cart \(1\)/}).click();
  await expect(
    page
      .getByRole('dialog', {name: 'Shopping cart'})
      .getByText('Large', {exact: true}),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('cart.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
