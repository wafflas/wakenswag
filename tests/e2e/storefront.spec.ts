import {expect, test, type Page} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
import {installShopifyBrowserFixtures} from './fixtures';

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
  await page.getByRole('link', {name: 'Swag', exact: true}).click();
  await expect(page.getByRole('region', {name: /Products/})).toBeVisible();
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(
    page.getByRole('navigation', {name: 'Main navigation'}),
  ).toBeVisible();
  for (const label of ['Drumkits', 'Info']) {
    await page.getByRole('link', {name: label, exact: true}).click();
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    await page.getByRole('button', {name: 'Back', exact: true}).click();
  }
});

test('custom cookie choices persist, ignore removed preview URLs and fit the viewport', async ({
  page,
}) => {
  await installShopifyBrowserFixtures(page);
  await openPage(page, '/');
  const banner = page.getByRole('region', {name: 'Cookies & privacy'});
  await expect(banner).toBeVisible();
  await expect(
    banner.getByRole('button', {name: 'Reject optional'}),
  ).toBeEnabled();
  const box = await banner.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('Missing banner dimensions');
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  const accessibility = await new AxeBuilder({page})
    .include('[aria-labelledby="cookie-consent-title"]')
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('cookie-banner.png'),
    animations: 'disabled',
  });
  await page.getByRole('button', {name: 'Search', exact: true}).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('dialog', {name: 'System browser search'}),
  ).toBeVisible();
  await expect(banner).not.toBeVisible();
  await page.keyboard.press('Escape');
  await expect(banner).toBeVisible();
  await banner.getByRole('button', {name: 'Reject optional'}).click();
  await expect(banner).not.toBeVisible();
  expect(
    (await page.context().cookies()).find(
      (cookie) => cookie.name === 'fixture_consent',
    )?.value,
  ).toBe('no');
  await page.reload();
  await page.waitForFunction(
    () => window.Shopify?.customerPrivacy?.consentStatus === 'loaded',
  );
  await expect(
    page.getByRole('link', {name: 'Info', exact: true}),
  ).toBeVisible();
  await expect(banner).not.toBeVisible();
  await openPage(page, '/info?cookies=1');
  await expect(
    page.getByRole('link', {name: 'Cookie preferences', exact: true}),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', {name: 'Close preferences'}),
  ).toHaveCount(0);
  await expect(banner).not.toBeVisible();
  // A fresh visitor, rather than a preferences screen, exercises Accept.
  await page.context().clearCookies({name: 'fixture_consent'});
  await openPage(page, '/info');
  await expect(banner).toBeVisible();
  await expect(
    banner.getByRole('button', {name: 'Accept optional'}),
  ).toBeEnabled();
  await banner.getByRole('button', {name: 'Accept optional'}).focus();
  await page.keyboard.press('ArrowDown');
  await expect(
    banner.getByRole('button', {name: 'Accept optional'}),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(banner).not.toBeVisible();
  await expect(page).toHaveURL(/\/info$/);
  expect(
    (await page.context().cookies()).find(
      (cookie) => cookie.name === 'fixture_consent',
    )?.value,
  ).toBe('yes');
  await page.reload();
  await page.waitForFunction(
    () => window.Shopify?.customerPrivacy?.consentStatus === 'loaded',
  );
  await expect(
    page.getByRole('navigation', {name: 'Information', exact: true}),
  ).toBeVisible();
  await expect(banner).not.toBeVisible();
});

for (const [listingPath, collectionId] of [
  ['/swag', 2],
  ['/drumkits', 1],
] as const) {
  test(`${listingPath} collection analytics respect consent and exclude product routes`, async ({
    page,
  }) => {
    await installShopifyBrowserFixtures(page);
    const events: Array<{
      event_name: string;
      event_source_url: string;
      collection_name?: string;
      collection_id?: number;
    }> = [];
    await page.route(
      'https://monorail-edge.shopifysvc.com/**',
      async (route) => {
        const body = route.request().postDataJSON() as {
          events: Array<{payload: (typeof events)[number]}>;
        };
        events.push(...body.events.map((event) => event.payload));
        await route.fulfill({
          status: 200,
          body: '',
          headers: {'access-control-allow-origin': '*'},
        });
      },
    );
    const collectionEvents = () =>
      events.filter((event) => event.event_name === 'collection_page_rendered');
    const productEvents = () =>
      events.filter((event) => event.event_name === 'product_page_rendered');

    await openPage(page, listingPath);
    if (listingPath === '/drumkits' && test.info().project.use.isMobile) {
      await expect(page).toHaveURL(
        (url) => url.searchParams.get('pageSize') === '4',
      );
    }
    await expect(
      page.getByRole('button', {name: 'Accept optional'}),
    ).toBeEnabled();
    expect(events).toHaveLength(0);
    await page.getByRole('button', {name: 'Accept optional'}).click();
    await expect.poll(() => collectionEvents().length).toBe(1);
    expect(collectionEvents()[0]).toMatchObject({
      collection_name: listingPath.slice(1),
      collection_id: collectionId,
    });

    await page.locator(`a[href^="${listingPath}/"]`).first().click();
    await expect(
      page.getByRole('dialog', {name: 'Fixture Tee', exact: true}),
    ).toBeVisible();
    await expect.poll(() => productEvents().length).toBeGreaterThan(0);
    expect(collectionEvents()).toHaveLength(1);
    const productPath = new URL(page.url()).pathname;

    const beforeReturn = collectionEvents().length;
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await expect(page).toHaveURL((url) => url.pathname === listingPath);
    if (listingPath === '/drumkits' && test.info().project.use.isMobile) {
      await expect(page).toHaveURL(
        (url) => url.searchParams.get('pageSize') === '4',
      );
    }
    await expect
      .poll(() =>
        collectionEvents()
          .slice(beforeReturn)
          .some((event) => event.event_source_url === page.url()),
      )
      .toBe(true);
    expect(
      collectionEvents().every(
        (event) => new URL(event.event_source_url).pathname === listingPath,
      ),
    ).toBe(true);

    // Direct product loads also mount the parent collection route.
    const previousCollections = collectionEvents().length;
    const previousProducts = productEvents().length;
    await openPage(page, productPath);
    await expect
      .poll(() => productEvents().length)
      .toBeGreaterThan(previousProducts);
    expect(collectionEvents()).toHaveLength(previousCollections);
  });
}

test('removed merch URLs return 404 while Swag product URLs remain available', async ({
  page,
}) => {
  for (const path of [
    '/merch',
    '/merch?cursor=11&direction=next',
    '/merch/fixture-tee?Size=Large&_pos=2',
  ]) {
    const response = await page.request.get(path, {maxRedirects: 0});
    expect(response.status()).toBe(404);
    expect(response.headers()['location']).toBeUndefined();
  }

  await openPage(page, '/swag/fixture-tee?Size=Large&_pos=2');
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/swag/fixture-tee' &&
      url.searchParams.get('Size') === 'Large' &&
      url.searchParams.get('_pos') === '2',
  );
  await expect(
    page.getByRole('dialog', {name: 'Fixture Tee', exact: true}),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4173/swag/fixture-tee',
  );
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(page).toHaveURL((url) => url.pathname === '/swag');
});

test('social previews include a public image in server-rendered pages', async ({
  page,
}) => {
  await openPage(page, '/');
  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content');
  if (!imageUrl) throw new Error('Missing social preview image');
  expect(new URL(imageUrl).origin).toBe(new URL(page.url()).origin);
  expect(new URL(imageUrl).pathname).toContain('wakenswagOGimage2');
  const imageResponse = await page.request.get(imageUrl);
  expect(imageResponse.ok()).toBe(true);
  expect(imageResponse.headers()['content-type']).toContain('image/png');

  for (const path of ['/', '/info/privacy-policy', '/swag/fixture-tee']) {
    const response = await page.request.get(path);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain(`<meta property="og:image" content="${imageUrl}"`);
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta property="og:image:height" content="630"');
    expect(html).toContain(`<meta name="twitter:image" content="${imageUrl}"`);
  }
});

test('information menu opens policies and external links and fits the viewport', async ({
  page,
}) => {
  await openPage(page, '/');
  const homeLogoSize = await page
    .locator('.ps2-logo--base')
    .evaluate((logo) => {
      const {width, height} = logo.getBoundingClientRect();
      return {width, height};
    });
  await expect(
    page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link'),
  ).toHaveCount(4);
  await page.getByRole('link', {name: 'Info', exact: true}).click();
  await expect(
    page.getByRole('heading', {name: 'Website Information', exact: true}),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {name: 'Website Information', exact: true}),
  ).toHaveCSS('color', 'rgb(221, 221, 85)');
  const infoLogoSize = await page
    .locator('.ps2-logo--base')
    .evaluate((logo) => {
      const {width, height} = logo.getBoundingClientRect();
      return {width, height};
    });
  expect(infoLogoSize).toEqual(homeLogoSize);
  await expect(page.getByRole('link', {name: /Instagram/})).toHaveAttribute(
    'href',
    'https://www.instagram.com/wakenswag/',
  );
  const instagram = page.getByRole('link', {name: /Instagram/});
  const credits = page.getByRole('link', {name: /Website Credits/});
  await expect(credits).toHaveAttribute('href', 'https://wafflas.url');
  await expect(credits).toHaveAttribute('target', '_blank');
  // Keyboard focus and pointer hover both use the menu's existing selection state.
  await instagram.focus();
  await expect(instagram.locator('span').first()).toHaveCSS(
    'color',
    'rgb(40, 200, 255)',
  );
  await expect(instagram.getByText('@wakenswag', {exact: true})).toHaveCSS(
    'color',
    'rgb(245, 245, 245)',
  );
  await expect(credits.getByText('wafflas.url', {exact: true})).toHaveCSS(
    'color',
    'rgb(130, 130, 130)',
  );
  if (!test.info().project.use.isMobile) {
    await credits.hover();
    await expect(credits.locator('span').first()).toHaveCSS(
      'color',
      'rgb(40, 200, 255)',
    );
    await expect(credits.getByText('wafflas.url', {exact: true})).toHaveCSS(
      'color',
      'rgb(245, 245, 245)',
    );
  }
  await page.screenshot({
    path: test.info().outputPath('information.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  for (const [label, text] of [
    ['Privacy Policy', 'Fixture privacy policy.'],
    ['Terms of Service', 'Fixture terms of service.'],
    ['Returns & Refunds', 'This policy hasn’t been published yet.'],
  ]) {
    await page.getByRole('link', {name: new RegExp(label)}).click();
    await expect(page.locator('.route-fade-transition--out')).toHaveCSS(
      'animation-duration',
      '0.5s',
    );
    await expect(page.getByText(text, {exact: true})).toBeVisible();
    await expect(page.locator('.route-fade-transition--in')).toHaveCSS(
      'animation-name',
      'fade-in',
    );
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await expect(page.locator('.route-fade-transition--out')).toHaveCSS(
      'animation-duration',
      '0.5s',
    );
    await expect(page).toHaveURL(/\/info$/);
    await expect(
      page.getByRole('navigation', {name: 'Information', exact: true}),
    ).toBeVisible();
  }
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.getByRole('link', {name: /Privacy Policy/}).click();
  await expect(
    page.getByText('Fixture privacy policy.', {exact: true}),
  ).toBeVisible();
  await expect(page.locator('.route-fade-transition--in')).toHaveCSS(
    'animation-name',
    'none',
  );
  await page
    .getByRole('link', {name: 'Back to Information', exact: true})
    .click();
  await expect(
    page.getByRole('navigation', {name: 'Information', exact: true}),
  ).toBeVisible();
  await expect(page.locator('.route-fade-transition--in')).toHaveCSS(
    'animation-name',
    'none',
  );
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.getByRole('link', {name: /Privacy Policy/}).focus();
  await page.keyboard.press('End');
  await expect(
    page.getByRole('link', {name: /Returns & Refunds/}),
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(instagram).toBeFocused();
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  await expect(
    page.getByRole('dialog', {name: 'System browser search'}),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', {name: 'System browser search'}),
  ).not.toBeVisible();
  await page.getByRole('button', {name: 'Back', exact: true}).click();
  await expect(page).toHaveURL(/:\d+\/$/);
});

test('product quantity, add to cart, persisted cart and removal work', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openPage(page, '/swag');
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

test('each drumkit stays at one copy after repeat adds and direct quantity updates', async ({
  page,
}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await openPage(page, '/drumkits/fixture-drumkit');
  const product = page.getByRole('dialog', {
    name: 'Fixture Drumkit',
    exact: true,
  });
  await product.getByRole('button', {name: 'Add to cart', exact: true}).click();
  await expect(product.getByRole('button', {name: 'In cart'})).toBeDisabled();
  await page.getByRole('button', {name: 'Cart (1)', exact: true}).click();
  const cart = page.getByRole('dialog', {name: 'Shopping cart'});
  await expect(cart.getByRole('status')).toHaveText('1');
  await expect(
    cart.getByRole('button', {name: /Increase quantity/}),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(product.getByRole('button', {name: 'In cart'})).toBeDisabled();
  for (const [action, inputs] of [
    [
      'LinesAdd',
      {
        lines: [
          {merchandiseId: 'gid://shopify/ProductVariant/201', quantity: 4},
        ],
      },
    ],
    [
      'LinesUpdate',
      {lines: [{id: 'gid://shopify/CartLine/fixture', quantity: 9}]},
    ],
  ] as const) {
    const response = await page.request.post('/cart.data', {
      form: {cartFormInput: JSON.stringify({action, inputs})},
    });
    expect(response.status()).toBe(200);
    await page.reload();
    await expect(product.getByRole('button', {name: 'In cart'})).toBeDisabled();
    await expect(
      page.getByRole('button', {name: 'Cart (1)', exact: true}),
    ).toBeVisible();
  }
  await page.getByRole('button', {name: 'Cart (1)', exact: true}).click();
  await cart.getByRole('button', {name: 'Remove item', exact: true}).click();
  await expect(cart.getByText('Your cart is empty.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    product.getByRole('button', {name: 'Add to cart', exact: true}),
  ).toBeEnabled();
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

test('search routes drumkits to their collection and preserves search tracking', async ({
  page,
}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const path of ['/', '/swag']) {
    await openPage(page, path);
    await page.getByRole('button', {name: 'Search', exact: true}).click();
    await page.getByRole('searchbox', {name: 'Search memory'}).fill('drum');
    const result = page.getByRole('link', {
      name: 'View Fixture Drumkit',
      exact: true,
    });
    await expect(result.getByText('DRUMKITS', {exact: true})).toBeVisible();
    await expect(result).toHaveAttribute(
      'href',
      '/drumkits/fixture-drumkit?q=drum&_pos=2&_psid=fixture-session&_psq=drum&_ss=e',
    );
    await result.click();
    await expect(page).toHaveURL(/\/drumkits\/fixture-drumkit\?q=drum&_pos=2/);
    const detail = page.getByRole('dialog', {
      name: 'Fixture Drumkit',
      exact: true,
    });
    await expect(detail).toBeVisible();
    await expect(detail.locator('[data-product-theme]')).toHaveAttribute(
      'data-product-theme',
      'black',
    );
    await expect(detail.getByRole('group', {name: 'Quantity'})).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/drumkits(?:\?pageSize=4)?$/);
    await expect(
      page.getByRole('heading', {name: 'Buy the fucking drumkits'}),
    ).toBeVisible();
  }
  await openPage(
    page,
    '/swag/fixture-drumkit?q=drum&_pos=2&_psid=fixture-session&_psq=drum&_ss=e',
  );
  await expect(page).toHaveURL(
    /\/drumkits\/fixture-drumkit\?q=drum&_pos=2&_psid=fixture-session/,
  );
  await expect(
    page.getByRole('dialog', {name: 'Fixture Drumkit', exact: true}),
  ).toBeVisible();
});

test('cursor pagination reaches every product and survives reload and history', async ({
  page,
}) => {
  await openPage(page, '/swag');
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

test('drumkit pages fit the viewport and paginate all 24 fixture products', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await openPage(page, '/drumkits');
  const products = page.getByRole('region', {name: 'Products', exact: true});
  const visited = new Set<string>();
  const pageSize = isMobile ? 4 : 6;
  const pageCount = 24 / pageSize;

  const checkLayout = async () => {
    const expectedCount = await page.evaluate(() =>
      innerWidth < 1024 ? 4 : 6,
    );
    await expect(products.locator('a')).toHaveCount(expectedCount);
    const geometry = await products.evaluate((grid) => {
      const bounds = grid.getBoundingClientRect();
      const cards = [...grid.querySelectorAll('a')];
      const heights = cards.map((card) => card.getBoundingClientRect().height);
      const fits = cards.every((card) => {
        const box = card.getBoundingClientRect();
        const heading = card
          .querySelector('.ps2-drumkit-heading')!
          .getBoundingClientRect();
        const description = card
          .querySelector('.ps2-drumkit-description')!
          .getBoundingClientRect();
        return (
          box.top >= bounds.top - 1 &&
          box.bottom <= bounds.bottom + 1 &&
          box.left >= bounds.left - 1 &&
          box.right <= bounds.right + 1 &&
          heading.top >= box.top - 1 &&
          description.bottom <= box.bottom + 1
        );
      });
      return {
        fits,
        equalHeights: Math.max(...heights) - Math.min(...heights) < 1,
        overflow: grid.scrollHeight - grid.clientHeight,
        horizontalOverflow: grid.scrollWidth - grid.clientWidth,
        documentOverflow: document.documentElement.scrollHeight - innerHeight,
        mobilePortrait: innerWidth < 768 && innerHeight > innerWidth,
        columns: new Set(
          cards.map((card) => Math.round(card.getBoundingClientRect().left)),
        ).size,
        rows: new Set(
          cards.map((card) => Math.round(card.getBoundingClientRect().top)),
        ).size,
        artworkSize: Math.min(
          ...cards.map((card) => {
            const image = card.querySelector('img')!.getBoundingClientRect();
            return Math.min(image.width, image.height);
          }),
        ),
        minimumMobileArtworkSize: Math.min(
          (innerWidth - 48) / 2,
          innerHeight >= 700 ? 144 : innerHeight >= 600 ? 112 : 88,
        ),
        imageHeight: Math.min(
          ...cards.map(
            (card) => card.querySelector('img')!.getBoundingClientRect().height,
          ),
        ),
        mdUp: innerWidth >= 1024 || (innerWidth >= 768 && innerHeight > 500),
        compact: innerWidth < 768 || Math.max(...heights) <= 384.5,
        previousImageSize:
          innerWidth >= 1024
            ? Math.min(innerWidth * 0.1, (innerHeight - 288) / 3, 160)
            : innerWidth >= 768
              ? 96
              : 88,
      };
    });
    expect(geometry.fits).toBe(true);
    expect(geometry.equalHeights).toBe(true);
    expect(geometry.compact).toBe(true);
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.columns).toBe(expectedCount === 4 ? 2 : 6);
    expect(geometry.rows).toBe(expectedCount === 4 ? 2 : 1);
    if (geometry.mobilePortrait)
      expect(geometry.artworkSize).toBeGreaterThanOrEqual(
        geometry.minimumMobileArtworkSize - 1,
      );
    expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(geometry.documentOverflow).toBeLessThanOrEqual(1);
    expect(geometry.imageHeight).toBeGreaterThan(0);
    if (geometry.mdUp)
      expect(geometry.imageHeight).toBeGreaterThan(geometry.previousImageSize);
    else expect(geometry.imageHeight).toBeLessThanOrEqual(224.5);
  };

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    await expect(products.locator('a')).toHaveCount(pageSize);
    const index = (pageNumber - 1) * pageSize + 1;
    const handle = index === 1 ? 'fixture-tee' : `fixture-tee-${index}`;
    await expect(products.getByRole('link').first()).toHaveAttribute(
      'href',
      `/drumkits/${handle}`,
    );
    for (const href of await products
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')!)))
      visited.add(href);
    await checkLayout();
    await expect(products.getByRole('link').first()).toBeInViewport();
    if (pageNumber === 1) {
      await expect(
        page.getByRole('link', {name: 'Go to previous product page'}),
      ).toHaveCount(0);
      const description = products
        .getByRole('link')
        .first()
        .locator('.ps2-drumkit-description');
      await expect(description).toHaveCSS('-webkit-line-clamp', '3');
      await expect
        .poll(() =>
          products
            .getByRole('link')
            .first()
            .locator('img')
            .evaluate((image) => (image as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
      if (!isMobile) {
        for (const [width, height] of [
          [1920, 1080],
          [2560, 1440],
          [1024, 600],
          [375, 667],
          [768, 1024],
          [844, 390],
          [320, 568],
        ]) {
          await page.setViewportSize({width, height});
          await checkLayout();
        }
        await page.setViewportSize({width: 1280, height: 720});
        await checkLayout();
      }
    }
    if (pageNumber === 2) {
      await page.reload();
      await expect(products.getByRole('link').first()).toHaveAttribute(
        'href',
        `/drumkits/fixture-tee-${pageSize + 1}`,
      );
    }
    if (pageNumber === 1 || pageNumber === pageCount)
      await page.screenshot({
        path: test.info().outputPath(`drumkits-page-${pageNumber}.png`),
        animations: 'disabled',
      });
    if (pageNumber < pageCount) {
      await page.getByRole('link', {name: 'Go to next product page'}).click();
    }
  }
  expect(visited.size).toBe(24);
  await expect(
    page.getByRole('link', {name: 'Go to next product page'}),
  ).toHaveCount(0);
  await products.getByRole('link').last().click();
  const product = page.getByRole('dialog', {
    name: 'Fixture Tee 24',
    exact: true,
  });
  await expect(product).toBeVisible();
  await expect(
    product.getByRole('button', {name: 'Add to cart', exact: true}),
  ).toBeEnabled();
  await expect(product.getByRole('group', {name: 'Quantity'})).toHaveCount(0);
  await expect(product.locator('[data-product-theme]')).toHaveAttribute(
    'data-product-theme',
    'black',
  );
  await page.keyboard.press('Escape');
  await expect(product).toHaveCount(0);
  await openPage(
    page,
    `/drumkits?cursor=${pageSize - 1}&direction=next${isMobile ? '&pageSize=4' : ''}`,
  );
  await page.getByRole('link', {name: 'Go to previous product page'}).click();
  await expect(products.getByRole('link').first()).toHaveAttribute(
    'href',
    '/drumkits/fixture-tee',
  );
  await expect(products.getByRole('link')).toHaveCount(pageSize);
});

test('variant links update URL, price, quantity and merchandise added to cart', async ({
  page,
}) => {
  await openPage(page, '/swag/fixture-tee');
  await expect(page).toHaveTitle('Wake n Swag | Fixture Tee');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4173/swag/fixture-tee',
  );
  const product = page.getByRole('dialog', {name: 'Fixture Tee', exact: true});
  const theme = product.locator('[data-product-theme]');
  await expect(theme).toHaveAttribute('data-product-theme', 'gray');
  await expect(theme.locator(':scope > [aria-hidden="true"]')).toHaveCSS(
    'background-image',
    /linear-gradient/,
  );
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

test('controller focus rings follow keyboard input after pointer dialog interactions', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await openPage(page, '/');
  const search = page.getByRole('button', {name: 'Search', exact: true});
  const press = async (button: ReturnType<Page['getByRole']>) => {
    if (isMobile) await button.tap();
    else await button.click();
  };
  await press(search);
  const input = page.getByRole('searchbox', {name: 'Search memory'});
  await expect(input).toBeFocused();
  await input.pressSequentially('nothing');
  await page.keyboard.press('Tab');
  const back = page.getByRole('button', {name: 'Back', exact: true});
  await expect(back).toBeFocused();
  await expect(back).toHaveCSS('outline-style', 'solid');
  await press(back);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS('outline-style', 'none');

  await page.keyboard.press('Tab');
  const cart = page.getByRole('button', {name: /Cart/});
  await expect(cart).toBeFocused();
  await expect(cart).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toBeVisible();
  await press(page.getByRole('button', {name: 'Back', exact: true}));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(cart).toBeFocused();
  await expect(cart).toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Shift+Tab');
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS('outline-style', 'solid');
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

test('drumkit selection follows hover and focus and respects reduced motion', async ({
  page,
  isMobile,
}) => {
  if (!isMobile) await page.setViewportSize({width: 1024, height: 600});
  await openPage(page, '/drumkits');
  const products = page.getByRole('region', {name: 'Products', exact: true});
  const first = products.getByRole('link').nth(0);
  const second = products.getByRole('link').nth(1);
  const heading = first.locator('.ps2-drumkit-heading');
  const description = first.locator('.ps2-drumkit-description');
  await expect(page.getByText('Now loading...', {exact: true})).toHaveCount(0);

  await expect(first).toHaveAttribute('aria-current', 'true');
  await expect(first.getByText('Fixture Tee', {exact: true})).toBeVisible();
  await expect(first.locator('.ps2-drumkit-indicator')).toBeVisible();
  await expect(description).toBeVisible();
  await expect(first).toHaveAccessibleDescription(/808s so distorted/);
  await expect(heading).toHaveCSS('animation-name', 'ps2-drumkit-bounce');
  await expect(first.locator('img')).toHaveCSS('animation-name', 'none');
  await expect(first.locator('img')).toHaveCSS('transform', 'none');
  await expect(first.locator('img')).toHaveCSS('object-fit', 'contain');
  await expect(description).toHaveCSS('animation-name', 'none');
  await expect(second.locator('.ps2-drumkit-heading')).toBeHidden();
  await expect(second.locator('.ps2-drumkit-description')).toBeHidden();
  const initialBounds = await first.boundingBox();

  // Touch devices have no persistent hover; focus still selects the card.
  if (isMobile) await second.focus();
  else await second.hover();
  await expect(second).toHaveAttribute('aria-current', 'true');
  await expect(second.locator('.ps2-drumkit-heading')).toBeVisible();
  await expect(second.locator('.ps2-drumkit-description')).toBeVisible();
  await expect(heading).toBeHidden();
  await expect(description).toBeHidden();
  await expect(heading).toHaveCSS('animation-name', 'none');
  await expect(second.locator('.ps2-drumkit-heading')).toHaveCSS(
    'animation-name',
    'ps2-drumkit-bounce',
  );
  expect(await first.boundingBox()).toEqual(initialBounds);

  await first.focus();
  await expect(first).toHaveAttribute('aria-current', 'true');
  await expect(heading).toBeVisible();
  // The bouncing title must fit above the artwork, even in the top row.
  const headingFits = await heading.evaluate((element) => {
    const grid = element.parentElement?.parentElement;
    return Boolean(
      grid &&
      element.getBoundingClientRect().top >= grid.getBoundingClientRect().top,
    );
  });
  expect(headingFits).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('drumkits.png'),
    fullPage: true,
    animations: 'disabled',
  });

  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(heading).toHaveCSS('animation-name', 'none');
  await expect(heading).toBeVisible();
  await expect(description).toBeVisible();
  const last = products.getByRole('link').last();
  await last.focus();
  await expect(last.locator('.ps2-drumkit-description')).toBeInViewport();
  await first.focus();
  await first.click();
  await expect(page).toHaveURL(/\/drumkits\/fixture-tee(?:\?|$)/);
  await expect(page.getByRole('dialog', {name: 'Fixture Tee'})).toBeVisible();

  await openPage(page, '/swag');
  await expect(products.getByRole('link').first().locator('img')).toHaveCSS(
    'animation-name',
    'none',
  );
  expect(
    await products
      .getByRole('link')
      .first()
      .evaluate((element) => getComputedStyle(element, '::after').opacity),
  ).toBe('1');
});

test('drumkit Back and Escape return to the drumkits collection', async ({
  page,
}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const action of ['Escape', 'Back']) {
    await openPage(page, '/drumkits/fixture-tee');
    const product = page.getByRole('dialog', {
      name: 'Fixture Tee',
      exact: true,
    });
    await expect(product).toBeVisible();
    const theme = product.locator('[data-product-theme]');
    await expect(theme).toHaveAttribute('data-product-theme', 'black');
    await expect(theme.locator(':scope > [aria-hidden="true"]')).toHaveCSS(
      'background-image',
      'linear-gradient(145deg, rgb(56, 56, 56) 0%, rgb(24, 24, 24) 48%, rgb(5, 5, 5) 100%)',
    );
    if (action === 'Escape') {
      await page.screenshot({
        path: test.info().outputPath('drumkit-detail.png'),
        animations: 'disabled',
      });
    }
    await expect(product.getByRole('group', {name: 'Quantity'})).toHaveCount(0);
    await expect(
      product.getByRole('button', {name: 'Add to cart', exact: true}),
    ).toBeEnabled();
    if (action === 'Escape') {
      await page.keyboard.press('Escape');
    } else {
      await page.getByRole('button', {name: 'Back', exact: true}).click();
    }
    await expect(page).toHaveURL(/\/drumkits(?:\?pageSize=4)?$/);
    await expect(product).toHaveCount(0);
    await expect(page.getByRole('region', {name: 'Products'})).toBeVisible();
  }
});

test('closing a cart over a product keeps the product open and locked', async ({
  page,
}) => {
  const blockerWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('only supports one blocker'))
      blockerWarnings.push(message.text());
  });
  await openPage(page, '/swag/fixture-tee');
  await page.getByRole('button', {name: /Cart/}).click();
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('dialog', {name: 'Fixture Tee', exact: true}),
  ).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    'hidden',
  );
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/swag$/);
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
    await openPage(page, `/swag/${handle}`);
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
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toHaveCount(
    0,
  );
  await page.getByRole('link', {name: 'Return to the main menu'}).click();
  await expect(
    page.getByRole('navigation', {name: 'Main navigation'}),
  ).toBeVisible();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.getByRole('link', {name: 'Swag', exact: true}).click();
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
  await openPage(page, '/swag/fixture-tee');
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

test('cart and search share the product fade, finish their exit and respect reduced motion', async ({
  page,
}) => {
  await openPage(page, '/swag/fixture-tee');
  const product = page.getByRole('dialog', {name: 'Fixture Tee', exact: true});
  await expect(product).toHaveCSS('animation-name', 'fade-in');
  await expect(product).toHaveCSS('animation-duration', '0.3s');
  await expect(product).toHaveCSS('animation-timing-function', 'ease-out');

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({reducedMotion});
    for (const [buttonName, dialogName] of [
      [/Cart/, 'Shopping cart'],
      ['Search', 'System browser search'],
    ] as const) {
      await page.getByRole('button', {name: buttonName, exact: true}).click();
      const dialog = page.getByRole('dialog', {name: dialogName, exact: true});
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS(
        'animation-name',
        reducedMotion === 'reduce' ? 'none' : 'fade-in',
      );
      if (reducedMotion === 'no-preference') {
        await expect(dialog).toHaveCSS('animation-duration', '0.3s');
        await expect(dialog).toHaveCSS('animation-timing-function', 'ease-out');
      }
      await expect(dialog).toHaveCSS('opacity', '1');
      if (dialogName === 'Shopping cart') {
        await page.getByRole('button', {name: 'Back', exact: true}).click();
      } else {
        await page.keyboard.press('Escape');
      }
      if (reducedMotion === 'no-preference') {
        await expect(dialog).toHaveCSS('animation-name', 'fade-out');
        await expect(dialog).toHaveCSS('animation-duration', '0.3s');
        await expect(dialog).toHaveCSS('animation-timing-function', 'ease-in');
        expect(await page.evaluate(() => document.body.style.overflow)).toBe(
          'hidden',
        );
      }
      await expect(dialog).toHaveCount(0);
      await expect(product).toBeVisible();
      await expect(
        page.getByRole('button', {name: buttonName, exact: true}),
      ).toBeFocused();
    }
  }
});

for (const listingPath of ['/swag', '/drumkits']) {
  test(`${listingPath} product and main-menu exit animations retain their timing`, async ({
    page,
  }) => {
    await openPage(page, `${listingPath}/fixture-tee`);
    await expect(page.getByText('Now loading...')).toHaveCount(0);
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await expect(page.locator('.anim-genie-shrink')).toHaveCSS(
      'animation-duration',
      '0.4s',
    );
    await expect(
      page.getByRole('dialog', {name: 'Fixture Tee', exact: true}),
    ).toHaveCSS('animation-duration', '0.3s');
    await expect(page).toHaveURL((url) => url.pathname === listingPath);
    await expect(page.getByText('Now loading...')).toHaveCount(0);
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await expect(page.locator('.route-fade-transition--out')).toHaveCSS(
      'animation-duration',
      '0.5s',
    );
    await expect(page).toHaveURL(/:\d+\/$/);
  });
}

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
  await openPage(page, '/swag/fixture-tee?Size=Large');
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
