import {describe, expect, it} from 'vitest';
import {getVariantUrl, isDefaultTitleOption} from '~/lib/variants';
import {
  getProductDescriptionBullets,
  getProductDetailTheme,
} from '~/components/product-detail/productDetailUtils';
import {normalizeSearchProduct} from '~/components/search/searchUtils';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
} from '~/lib/search';
import {createProduct, createVariant} from '../fixtures/catalog';

describe('product variant links', () => {
  it('encodes selected options and preserves a locale prefix', () => {
    expect(
      getVariantUrl({
        handle: 'tee',
        pathname: '/en-us/merch',
        searchParams: new URLSearchParams(),
        selectedOptions: [{name: 'Color', value: 'Blue & White'}],
      }),
    ).toBe('/en-us/merch/tee?Color=Blue+%26+White');
  });
  it('omits Shopify default-title options', () => {
    expect(isDefaultTitleOption({name: 'TITLE', value: 'Default Title'})).toBe(
      true,
    );
    expect(
      getVariantUrl({
        handle: 'tee',
        pathname: '/',
        searchParams: new URLSearchParams(),
        selectedOptions: [{name: 'Title', value: 'Default Title'}],
      }),
    ).toBe('/merch/tee');
  });
});

describe('product description and theme', () => {
  it('prefers HTML list text without rendering HTML', () => {
    expect(
      getProductDescriptionBullets({
        description: 'Fallback',
        descriptionHtml:
          '<ul><li>Soft <b>cotton</b> &amp; silk</li><li>Wash<br>cold</li></ul>',
      }),
    ).toEqual(['Soft cotton & silk', 'Wash cold']);
  });
  it('falls back to nonempty plain-text bullets', () => {
    expect(
      getProductDescriptionBullets({
        description: '- Cotton\n\n• Wash cold',
        descriptionHtml: '',
      }),
    ).toEqual(['Cotton', 'Wash cold']);
  });
  it('uses selected color before the product title', () => {
    const variant = {
      ...createVariant(),
      selectedOptions: [{name: 'Colour', value: 'Navy'}],
    };
    expect(
      getProductDetailTheme(createProduct({title: 'Red tee'}), variant).key,
    ).toBe('blue');
  });
  it('uses a neutral theme for unknown colors', () => {
    expect(getProductDetailTheme(createProduct(), null).key).toBe('gray');
  });
});

describe('predictive search data', () => {
  it('normalizes category and prioritizes variant availability', () => {
    const product = createProduct();
    expect(
      normalizeSearchProduct({
        ...product,
        productType: ' drumkits ',
        availableForSale: true,
        selectedOrFirstAvailableVariant: createVariant('Large', false),
      }),
    ).toMatchObject({category: 'DRUMKITS', availableForSale: false});
  });
  it('handles missing optional media and price', () => {
    expect(
      normalizeSearchProduct({id: '1', handle: 'tee', title: 'Tee'}),
    ).toMatchObject({category: 'MERCH', image: null, price: null});
    expect(getEmptyPredictiveSearchResult()).toEqual({
      total: 0,
      items: {products: [], queries: []},
    });
  });
  it('encodes user search terms and preserves Shopify tracking', () => {
    expect(
      urlWithTrackingParams({
        baseUrl: '/merch/tee',
        term: 'tee & hat',
        trackingParams: 'pos=1',
      }),
    ).toBe('/merch/tee?q=tee+%26+hat&pos=1');
  });
});
