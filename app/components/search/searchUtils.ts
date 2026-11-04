import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

type SearchMoney = Pick<MoneyV2, 'amount' | 'currencyCode'>;

type SearchImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/** Normalized product card used by predictive search results. */
export type SearchProductCard = {
  id: string;
  handle: string;
  title: string;
  category: string;
  availableForSale: boolean;
  trackingParameters?: string | null;
  image?: SearchImage | null;
  price?: SearchMoney | null;
};

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
    price?: Pick<MoneyV2, 'amount' | 'currencyCode'> | null;
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
