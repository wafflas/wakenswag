import {createElement} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {
  getLineItemChildrenMap,
  getSubmittingContent,
  type CartLine,
} from '~/components/cart/cartUtils';
import {createCart} from '../fixtures/catalog';

describe('cart line grouping', () => {
  it('leaves independent lines out of the children map', () => {
    expect(getLineItemChildrenMap(createCart().lines.nodes)).toEqual({});
    expect(getLineItemChildrenMap([])).toEqual({});
  });

  it('groups child lines by parent while preserving their order', () => {
    const line = createCart().lines.nodes[0];
    const firstChild = {
      ...line,
      id: 'first-child',
      parentRelationship: {parent: {id: 'parent'}},
    };
    const secondChild = {...firstChild, id: 'second-child'};
    const otherChild = {
      ...firstChild,
      id: 'other-child',
      parentRelationship: {parent: {id: 'other-parent'}},
    };

    expect(
      getLineItemChildrenMap([line, firstChild, otherChild, secondChild]),
    ).toEqual({
      parent: [firstChild, secondChild],
      'other-parent': [otherChild],
    });
  });

  it('includes children nested inside componentizable cart lines', () => {
    const line = createCart().lines.nodes[0];
    const directChild = {
      ...line,
      id: 'direct-child',
      parentRelationship: {parent: {id: 'parent'}},
    };
    const nestedChild = {...directChild, id: 'nested-child'};
    const componentLine: CartLine = {
      ...line,
      id: 'component-line',
      lineComponents: [nestedChild],
    };

    expect(getLineItemChildrenMap([directChild, componentLine])).toEqual({
      parent: [directChild, nestedChild],
    });
  });
});

describe('cart submit content', () => {
  it('shows pending text for plain content', () => {
    render(getSubmittingContent('Add to cart'));

    expect(screen.getByText('Adding to cart...')).toBeVisible();
    expect(screen.queryByText('Add to cart')).not.toBeInTheDocument();
  });

  it('preserves the existing element while replacing its visible content', () => {
    render(
      getSubmittingContent(
        createElement('span', {'aria-label': 'Purchase action'}, 'Add to cart'),
      ),
    );

    expect(screen.getByLabelText('Purchase action')).toHaveTextContent(
      'Adding to cart...',
    );
    expect(screen.queryByText('Add to cart')).not.toBeInTheDocument();
  });
});
