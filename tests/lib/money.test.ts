import {describe, expect, it} from 'vitest';
import {formatMoney} from '~/lib/money';
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

describe('product variant URLs', () => {
  it('does not change the caller’s search parameters while making a variant URL', () => {
    const params = new URLSearchParams('q=tee');
    expect(
      getVariantUrl({
        handle: 'tee',
        pathname: '/swag',
        searchParams: params,
        selectedOptions: [{name: 'Size', value: 'Large'}],
      }),
    ).toBe('/swag/tee?q=tee&Size=Large');
    expect(params.toString()).toBe('q=tee');
  });
});
