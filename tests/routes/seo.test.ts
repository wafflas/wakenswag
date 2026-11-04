import {describe, expect, it, vi} from 'vitest';
import {meta as productMeta} from '~/routes/merch.$handle';
import {loader as sitemapIndex} from '~/routes/[sitemap.xml]';
import {loader as productSitemap} from '~/routes/sitemap.$type.$page[.xml]';
import {loader as pageSitemap} from '~/routes/[sitemap-pages.xml]';
import {createProduct} from '../fixtures/catalog';

describe('custom storefront SEO', () => {
  it('falls back to the product name/description when Shopify SEO strings are empty', () => {
    const descriptors = productMeta({
      data: {
        product: createProduct(),
        productUrl: 'https://store.example/merch/fixture-tee',
      },
      params: {handle: 'fixture-tee'},
    } as Parameters<typeof productMeta>[0]);
    expect(descriptors).toContainEqual({title: 'Fixture Tee | Wake n Swag'});
    expect(descriptors).toContainEqual({
      name: 'description',
      content: 'Soft cotton tee',
    });
    expect(descriptors).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://store.example/merch/fixture-tee',
    });
  });
  it('indexes only implemented static pages and the custom product sitemap', async () => {
    const request = new Request('https://store.example/sitemap.xml');
    const query = vi
      .fn()
      .mockResolvedValue({products: {pagesCount: {count: 1}}});
    const response = await sitemapIndex({
      request,
      context: {storefront: {query}},
    } as unknown as Parameters<typeof sitemapIndex>[0]);
    const xml = await response.text();
    expect(xml).toContain('https://store.example/sitemap/products/1.xml');
    expect(xml).toContain('https://store.example/sitemap-pages.xml');
    expect(xml).not.toContain('/sitemap/collections/');
    const pages = await pageSitemap({request} as Parameters<
      typeof pageSitemap
    >[0]);
    expect(await pages.text()).toContain('https://store.example/drumkits');
  });
  it('emits product URLs that match the real merch routes', async () => {
    const query = vi.fn().mockResolvedValue({
      sitemap: {
        resources: {
          items: [{handle: 'fixture-tee', updatedAt: '2026-11-04'}],
        },
      },
    });
    const response = await productSitemap({
      request: new Request('https://store.example/sitemap/products/1.xml'),
      params: {type: 'products', page: '1'},
      context: {storefront: {query}},
    } as unknown as Parameters<typeof productSitemap>[0]);
    const xml = await response.text();
    expect(xml).toContain('<loc>https://store.example/merch/fixture-tee</loc>');
    expect(xml).not.toContain('/products/fixture-tee');
  });
});
