import type {Page} from '@playwright/test';

export async function installShopifyBrowserFixtures(page: Page) {
  // Replace external Shopify browser services; keep the real Hydrogen hooks,
  // consent gating, event queue and payload generation running locally.
  await page.route(
    'https://cdn.shopify.com/shopifycloud/consent-tracking-api/**',
    async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
        (() => {
          const read = () => document.cookie.split('; ').find(value => value.startsWith('fixture_consent='))?.split('=')[1];
          const allowed = () => read() === 'yes';
          window.Shopify.customerPrivacy = {
            ...window.Shopify.customerPrivacy,
            consentStatus: 'loaded',
            // Shopify can still return true after an explicit Accept/Reject.
            shouldShowBanner: () => true,
            analyticsProcessingAllowed: allowed,
            marketingAllowed: allowed,
            preferencesProcessingAllowed: allowed,
            saleOfDataAllowed: () => false,
            currentVisitorConsent: () => ({analytics: read() || '', marketing: read() || '', preferences: read() || '', sale_of_data: 'no'}),
            setTrackingConsent(consent, callback) {
              document.cookie = 'fixture_consent=' + (consent.analytics ? 'yes' : 'no') + '; path=/; SameSite=Lax';
              document.dispatchEvent(new CustomEvent('visitorConsentCollected', {detail: {
                analyticsAllowed: allowed(), marketingAllowed: allowed(), preferencesAllowed: allowed(),
                saleOfDataAllowed: false, firstPartyMarketingAllowed: allowed(), thirdPartyMarketingAllowed: allowed()
              }}));
              callback();
            }
          };
          document.dispatchEvent(new Event('consentTrackingApiLoaded'));
        })();
      `,
      });
    },
  );
  // Hydrogen holds its event queue until the performance script is ready too.
  await page.route(
    'https://cdn.shopify.com/shopifycloud/perf-kit/**',
    async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: 'window.PerfKit = {navigate() {}, setPageType() {}};',
      });
    },
  );
  await page.route('https://monorail-edge.shopifysvc.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      body: '',
      headers: {'access-control-allow-origin': '*'},
    });
  });
}
