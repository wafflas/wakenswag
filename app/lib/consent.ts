/** Keep analytics destinations pending until the custom banner has a saved choice. */
export async function setupConsent() {
  const privacy = window.Shopify?.customerPrivacy;
  if (!privacy) throw new Error('Customer Privacy is unavailable');
  document.dispatchEvent(new Event('wakenswag:consent-ready'));
  const saved = privacy.currentVisitorConsent();
  const hasChoice = ['analytics', 'marketing', 'preferences'].some(
    (key) => saved[key] === 'yes' || saved[key] === 'no',
  );
  if (hasChoice || !privacy.shouldShowBanner()) return;
  await new Promise<void>((resolve) =>
    document.addEventListener('visitorConsentCollected', () => resolve(), {
      once: true,
    }),
  );
}
