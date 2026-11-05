import type {OptimisticCartLine} from '@shopify/hydrogen';
import {cloneElement, isValidElement, type ReactNode} from 'react';
import {getProductListingPathForProduct} from '~/lib/variants';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;
export type CartLayout = 'page' | 'aside';
export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

/** Keep a single copy of each drumkit product, including across variants. */
export function getDrumkitQuantityCorrections(lines: CartLine[]) {
  const seenProducts = new Set<string>();
  const updates: Array<{id: string; quantity: number}> = [];
  const removals: string[] = [];
  for (const line of lines) {
    const product = line.merchandise.product;
    if (getProductListingPathForProduct(product) !== '/drumkits') continue;
    if (seenProducts.has(product.id)) {
      removals.push(line.id);
    } else {
      seenProducts.add(product.id);
      if (line.quantity !== 1) updates.push({id: line.id, quantity: 1});
    }
  }
  return {updates, removals};
}

/** Returns a map of all line items and their children. */
export function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

export function getSubmittingContent(children: ReactNode) {
  if (isValidElement<{children?: ReactNode}>(children)) {
    return cloneElement(children, undefined, 'Adding to cart...');
  }

  return 'Adding to cart...';
}
