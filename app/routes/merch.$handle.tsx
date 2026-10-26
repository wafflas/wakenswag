import {useLoaderData} from 'react-router';
import type {Route} from './+types/merch.$handle';
import {ProductDetailRouteView} from '~/components/product-detail/ProductDetailRouteView';
import {loadProductDetail} from '~/lib/productDetail';

export const meta: Route.MetaFunction = ({data, params}) => {
  const product = data?.product;
  const handle = product?.handle ?? params.handle ?? '';

  return [
    {
      title:
        product?.seo.title ?? `${product?.title ?? 'Product'} | Wake n Swag`,
    },
    {
      name: 'description',
      content: product?.seo.description ?? product?.description ?? '',
    },
    {
      rel: 'canonical',
      href: `/merch/${handle}`,
    },
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('Product not found', {
      status: 404,
    });
  }

  const product = await loadProductDetail({
    handle: params.handle,
    request,
    storefront: context.storefront,
  });

  const requestUrl = new URL(request.url);
  const canonicalPath = `/merch/${product.handle}`;

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
