import type {OptimisticCartLine} from '@shopify/hydrogen';
import {cloneElement, isValidElement, type ReactNode} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;
export type CartLayout = 'page' | 'aside';
export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

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
