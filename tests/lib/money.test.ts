import {describe, expect, it} from 'vitest';
import {formatMoney} from '~/lib/money';
import {getSafeRedirectPath} from '~/lib/redirect';
import {getVariantUrl} from '~/lib/variants';

describe('storefront money display', () => {
  it('preserves the EUR design and removes unnecessary trailing zeros', () => {
    expect(formatMoney({amount: '25.00', currencyCode: 'EUR'})).toBe('25 EURO');
    expect(formatMoney({amount: '0.00', currencyCode: 'EUR'})).toBe('0 EURO');
    expect(formatMoney({amount: '1234.50', currencyCode: 'EUR'})).toBe(
      '1,234.5 EURO',
    );
  });
  it('uses the actual currency and its decimal precision', () => {
    expect(formatMoney({amount: '25.00', currencyCode: 'USD'})).toBe('25 USD');
    expect(formatMoney({amount: '1000', currencyCode: 'JPY'})).toBe(
      '1,000 JPY',
    );
    expect(formatMoney({amount: '1.234', currencyCode: 'KWD'})).toBe(
      '1.234 KWD',
    );
  });
});

describe('user-supplied redirect paths', () => {
  it.each([
    'https://evil.example',
    'https:evil.example',
    '//evil.example',
    '/\\evil.example',
    '\\evil.example',
    'javascript:alert(1)',
    '/merch\nInjected: true',
    '',
    null,
    12,
  ])('rejects %j', (path) => {
    expect(getSafeRedirectPath(path)).toBeNull();
  });
  it('preserves a root-relative path including its query and fragment', () => {
    expect(getSafeRedirectPath('/merch?Size=Large#options')).toBe(
      '/merch?Size=Large#options',
    );
  });
  it('does not change the caller’s search parameters while making a variant URL', () => {
    const params = new URLSearchParams('q=tee');
    expect(
      getVariantUrl({
        handle: 'tee',
        pathname: '/merch',
        searchParams: params,
        selectedOptions: [{name: 'Size', value: 'Large'}],
      }),
    ).toBe('/merch/tee?q=tee&Size=Large');
    expect(params.toString()).toBe('q=tee');
  });
});
