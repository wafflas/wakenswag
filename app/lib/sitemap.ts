import {gql} from '@shopify/hydrogen';
import {publicDataCache, type RequestStorefrontClient} from './context';

const INDEX_QUERY = gql(
  `query SitemapIndex { products: sitemap(type: PRODUCT) {pagesCount {count}} }`,
);
const PRODUCTS_QUERY = gql(
  `query SitemapProducts($page: Int!) {sitemap(type: PRODUCT) {resources(page: $page) {items {handle updatedAt}}}}`,
);
const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
function xmlResponse(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export async function getProductSitemapIndex(
  storefront: RequestStorefrontClient,
  request: Request,
) {
  const {data, errors} = await storefront.graphql(INDEX_QUERY, {
    cache: publicDataCache,
  });
  if (errors?.length || !data?.products.pagesCount)
    throw new Response('Sitemap is unavailable', {status: 502});
  const origin = new URL(request.url).origin;
  const links = Array.from(
    {length: data.products.pagesCount.count},
    (_, index) => `${origin}/sitemap/products/${index + 1}.xml`,
  );
  links.push(`${origin}/sitemap-pages.xml`);
  return xmlResponse(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${links.map((link) => `<sitemap><loc>${escapeXml(link)}</loc></sitemap>`).join('')}</sitemapindex>`,
  );
}

export async function getProductSitemap(
  storefront: RequestStorefrontClient,
  request: Request,
  params: {type?: string; page?: string},
) {
  const page = Number(params.page);
  if (params.type !== 'products' || !Number.isSafeInteger(page) || page < 1)
    throw new Response('Not found', {status: 404});
  const {data, errors} = await storefront.graphql(PRODUCTS_QUERY, {
    variables: {page},
    cache: publicDataCache,
  });
  if (errors?.length || !data?.sitemap.resources)
    throw new Response('Sitemap is unavailable', {status: 502});
  const origin = new URL(request.url).origin;
  return xmlResponse(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${data.sitemap.resources.items.map((item) => `<url><loc>${escapeXml(`${origin}/swag/${item.handle}`)}</loc><lastmod>${escapeXml(item.updatedAt)}</lastmod></url>`).join('')}</urlset>`,
  );
}
