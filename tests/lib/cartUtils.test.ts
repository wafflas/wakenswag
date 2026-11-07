import {createElement} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {
  getLineItemChildrenMap,
  getSubmittingContent,
  type CartLine,
  getDrumkitQuantityCorrections,
} from '~/components/cart/cartUtils';
import {createCart, createDrumkitCart} from '../fixtures/catalog';

describe('single-copy drumkits', () => {
  it('caps drumkit quantities and removes a second variant of the same product', () => {
    const drumkit = createDrumkitCart(3).lines.nodes[0];
    const duplicate = {
      ...drumkit,
      id: 'duplicate-line',
      merchandise: {...drumkit.merchandise, id: 'another-variant'},
    };
    const swag = {...createCart(5).lines.nodes[0], id: 'swag-line'};
    expect(getDrumkitQuantityCorrections([swag, drumkit, duplicate])).toEqual({
      updates: [{id: drumkit.id, quantity: 1}],
      removals: ['duplicate-line'],
    });
  });
  it('leaves one-copy drumkits and physical Swag quantities unchanged', () => {
    expect(
      getDrumkitQuantityCorrections([
        ...createDrumkitCart().lines.nodes,
        ...createCart(4).lines.nodes,
      ]),
    ).toEqual({updates: [], removals: []});
  });
});

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
