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

test('search routes drumkits to their collection and preserves search tracking', async ({
  page,
}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const path of ['/', '/merch']) {
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
    await expect(page).toHaveURL(/\/drumkits$/);
    await expect(
      page.getByRole('heading', {name: 'Buy the fucking drumkits'}),
    ).toBeVisible();
  }
  await openPage(
    page,
    '/merch/fixture-drumkit?q=drum&_pos=2&_psid=fixture-session&_psq=drum&_ss=e',
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

test('drumkit pages fit the viewport and paginate all 24 fixture products', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await openPage(page, '/drumkits');
  const products = page.getByRole('region', {name: 'Products', exact: true});
  const visited = new Set<string>();

  const checkLayout = async () => {
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
          heading.top >= box.top - 1 &&
          description.bottom <= box.bottom + 1
        );
      });
      return {
        fits,
        equalHeights: Math.max(...heights) - Math.min(...heights) < 1,
        overflow: grid.scrollHeight - grid.clientHeight,
        documentOverflow: document.documentElement.scrollHeight - innerHeight,
        imageHeight: Math.min(
          ...cards.map(
            (card) => card.querySelector('img')!.getBoundingClientRect().height,
          ),
        ),
        mdUp: innerWidth >= 768,
        compact: innerWidth < 768 || Math.max(...heights) <= 352.5,
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
    expect(geometry.documentOverflow).toBeLessThanOrEqual(1);
    expect(geometry.imageHeight).toBeGreaterThan(0);
    if (geometry.mdUp)
      expect(geometry.imageHeight).toBeGreaterThan(geometry.previousImageSize);
    else expect(geometry.imageHeight).toBeLessThanOrEqual(144.5);
  };

  for (let pageNumber = 1; pageNumber <= 4; pageNumber++) {
    await expect(products.getByRole('link')).toHaveCount(6);
    const index = (pageNumber - 1) * 6 + 1;
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
      }
    }
    if (pageNumber === 2) {
      await page.reload();
      await expect(products.getByRole('link').first()).toHaveAttribute(
        'href',
        '/drumkits/fixture-tee-7',
      );
    }
    if (pageNumber === 1 || pageNumber === 4)
      await page.screenshot({
        path: test.info().outputPath(`drumkits-page-${pageNumber}.png`),
        animations: 'disabled',
      });
    if (pageNumber < 4)
      await page.getByRole('link', {name: 'Go to next product page'}).click();
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
  await openPage(page, '/drumkits?cursor=5&direction=next');
  await page.getByRole('link', {name: 'Go to previous product page'}).click();
  await expect(products.getByRole('link').first()).toHaveAttribute(
    'href',
    '/drumkits/fixture-tee',
  );
  await expect(products.getByRole('link')).toHaveCount(6);
});

test('variant links update URL, price, quantity and merchandise added to cart', async ({
  page,
}) => {
  await openPage(page, '/merch/fixture-tee');
  await expect(page).toHaveTitle('Wake n Swag | Fixture Tee');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:4173/merch/fixture-tee',
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

  await openPage(page, '/merch');
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
    await expect(page).toHaveURL(/\/drumkits$/);
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
  await openPage(page, '/merch/fixture-tee');
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
  await expect(page.getByRole('dialog', {name: 'Shopping cart'})).toHaveCount(
    0,
  );
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

test('cart and search share the product fade, finish their exit and respect reduced motion', async ({
  page,
}) => {
  await openPage(page, '/merch/fixture-tee');
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

for (const listingPath of ['/merch', '/drumkits']) {
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
    await expect(page).toHaveURL(new RegExp(`${listingPath}$`));
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
