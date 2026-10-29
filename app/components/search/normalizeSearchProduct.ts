import type {SearchProductCard} from './searchTypes';

type SearchProductLike = {
  id: string;
  handle: string;
  title: string;
  productType?: string | null;
  availableForSale?: boolean | null;
  trackingParameters?: string | null;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  selectedOrFirstAvailableVariant?: {
    availableForSale?: boolean | null;
    image?: {
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
    price?: {
      amount: string;
      currencyCode: string;
    } | null;
  } | null;
};

export function normalizeSearchProduct(
  product: SearchProductLike,
): SearchProductCard {
  const variant = product.selectedOrFirstAvailableVariant;
  const category = product.productType?.trim() || 'MERCH';

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    category: category.toUpperCase(),
    availableForSale:
      variant?.availableForSale ?? product.availableForSale ?? true,
    trackingParameters: product.trackingParameters,
    image: product.featuredImage ?? variant?.image ?? null,
    price: variant?.price ?? null,
  };
}
