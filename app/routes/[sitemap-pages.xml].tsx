import type {LoaderFunctionArgs} from 'react-router';

export function loader({request}: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;
  const paths = ['/', '/merch', '/drumkits', '/info'];
  const urls = paths
    .map((path) => `<url><loc>${origin}${path}</loc></url>`)
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=86400',
      },
    },
  );
}
