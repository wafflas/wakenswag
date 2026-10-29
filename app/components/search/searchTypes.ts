type SearchMoney = {
  amount: string;
  currencyCode: string;
};

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
