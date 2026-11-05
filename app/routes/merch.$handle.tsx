import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/merch.$handle';
import {ProductDetailRouteView} from '~/components/product-detail/ProductDetailRouteView';
import {loadProductDetail} from '~/lib/productDetail';
import {
  getProductListingPath,
  getProductListingPathForProduct,
} from '~/lib/variants';

export const meta: Route.MetaFunction = ({data, params}) => {
  const product = data?.product;
  const handle = product?.handle ?? params.handle ?? '';

  return [
    {
      title:
        product?.seo.title || `Wake n Swag | ${product?.title ?? 'Product'}`,
    },
    {
      name: 'description',
      content: product?.seo.description || product?.description || '',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: data?.productUrl ?? `/merch/${handle}`,
    },
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('Product not found', {
      status: 404,
    });
  }

  const requestUrl = new URL(request.url);
  const product = await loadProductDetail({
    handle: params.handle,
    request,
    storefront: context.storefront,
  });

  const listingPath = getProductListingPathForProduct(product);
  const canonicalPath = `${listingPath}/${product.handle}`;
  if (getProductListingPath(requestUrl.pathname) !== listingPath) {
    throw redirect(`${canonicalPath}${requestUrl.search}`);
  }

  return {
    canonicalPath,
    product,
    productUrl: new URL(canonicalPath, requestUrl.origin).toString(),
  };
}

export default function MerchProductRoute() {
  const {product, productUrl} = useLoaderData<typeof loader>();

  return <ProductDetailRouteView product={product} productUrl={productUrl} />;
}
