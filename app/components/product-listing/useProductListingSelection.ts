import {useEffect, useState} from 'react';

import {
  PRODUCT_LISTING_STAGGER_MS,
  PRODUCTS_PER_PAGE,
} from './productListingUtils';

interface ProductListingSelectionProduct {
  id: string;
  title: string;
}

interface UseProductListingSelectionOptions {
  initialProduct?: ProductListingSelectionProduct | null;
  fallbackTitle?: string;
  productCount: number;
}

export function useProductListingSelection({
  initialProduct,
  fallbackTitle = 'Merch',
  productCount,
}: UseProductListingSelectionOptions) {
  const initialTitle = initialProduct?.title ?? fallbackTitle;
  const [displayTitle, setDisplayTitle] = useState(initialTitle);
  const [selectedProductId, setSelectedProductId] = useState(
    initialProduct?.id,
  );

  useEffect(() => {
    setDisplayTitle(initialTitle);
    setSelectedProductId(initialProduct?.id);
  }, [initialProduct?.id, initialTitle]);

  return {
    displayTitle,
    selectedProductId,
    loadingDurationMs:
      Math.min(productCount, PRODUCTS_PER_PAGE) * PRODUCT_LISTING_STAGGER_MS,
    onSelect(productId: string, title: string) {
      setSelectedProductId(productId);
      setDisplayTitle(title);
    },
  };
}
