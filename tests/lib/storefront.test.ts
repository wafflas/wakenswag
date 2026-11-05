import {describe, expect, it} from 'vitest';
import {
  getVariantUrl,
  isDefaultTitleOption,
  isProductDetailPath,
} from '~/lib/variants';
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

describe('product detail route detection', () => {
  it.each([
    ['/merch/tee', true],
    ['/merch/tee/', true],
    ['/drumkits/wnb-vol-001', true],
    ['/drumkits/wnb-vol-001/', true],
    ['/', false],
    ['/merch', false],
    ['/drumkits/', false],
    ['/drumkits-archive/wnb-vol-001', false],
    ['/drumkits/wnb-vol-001/extra', false],
  ])('recognizes %s as a product detail route: %s', (pathname, expected) => {
    expect(isProductDetailPath(pathname)).toBe(expected);
  });
});

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
  it.each([
    ['/drumkits', '/drumkits/wnb-vol-001?Format=WAV'],
    ['/drumkits/wnb-vol-001', '/drumkits/wnb-vol-001?Format=WAV'],
    ['/en-us/drumkits', '/en-us/drumkits/wnb-vol-001?Format=WAV'],
    ['/drumkits-archive', '/merch/wnb-vol-001?Format=WAV'],
  ])('keeps the correct listing section for %s', (pathname, expected) => {
    expect(
      getVariantUrl({
        handle: 'wnb-vol-001',
        pathname,
        searchParams: new URLSearchParams(),
        selectedOptions: [{name: 'Format', value: 'WAV'}],
      }),
    ).toBe(expected);
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
  it('uses the requested theme ahead of product colors', () => {
    const variant = {
      ...createVariant(),
      selectedOptions: [{name: 'Colour', value: 'Navy'}],
    };
    expect(
      getProductDetailTheme(
        createProduct({title: 'Red kit'}),
        variant,
        'black',
      ),
    ).toMatchObject({
      key: 'black',
      gradient:
        'linear-gradient(145deg, #383838 0%, #181818 48%, #050505 100%)',
    });
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
  it('recognizes a drumkit collection even when Shopify product type is empty', () => {
    expect(
      normalizeSearchProduct({
        id: 'drumkit',
        handle: 'drumkit-vol-002',
        title: 'Drumkit Vol. 002',
        productType: '',
        collections: {nodes: [{handle: 'merch'}, {handle: 'drumkits'}]},
      }),
    ).toMatchObject({category: 'DRUMKITS', listingPath: '/drumkits'});
  });
  it.each(['Drumkit', 'DRUMKITS', 'drum kit', ' drum kits '])(
    'recognizes the drumkit product type %s',
    (productType) => {
      expect(
        normalizeSearchProduct({
          id: 'kit',
          handle: 'kit',
          title: 'Kit',
          productType,
        }),
      ).toMatchObject({category: 'DRUMKITS', listingPath: '/drumkits'});
    },
  );
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
