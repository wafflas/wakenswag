import type {ComponentProps} from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {describe, expect, it, vi} from 'vitest';
import {ProductItem} from '~/components/product-listing/ProductItem';
import {createProductCard} from '../fixtures/catalog';

function renderProductItem(
  listingPath: string,
  props: ComponentProps<typeof ProductItem>,
) {
  const router = createMemoryRouter(
    [{path: '*', element: <ProductItem {...props} />}],
    {initialEntries: [listingPath]},
  );
  return render(<RouterProvider router={router} />);
}

describe('product grid links', () => {
  it.each(['/merch', '/drumkits'])(
    'opens the product inside %s',
    (listingPath) => {
      const product = createProductCard();
      renderProductItem(listingPath, {product});
      expect(screen.getByRole('link', {name: /Fixture Tee/})).toHaveAttribute(
        'href',
        `${listingPath}/fixture-tee`,
      );
    },
  );

  it('describes the selected drumkit with its Shopify description', () => {
    const product = {
      ...createProductCard(),
      title: 'Drumkit Vol. 001',
      description: 'Distorted 808s.\nIncludes WAV samples.',
    };
    renderProductItem('/drumkits', {product, isSelected: true});
    expect(
      screen.getByRole('link', {name: /Drumkit Vol. 001, selected/}),
    ).toHaveAccessibleDescription(product.description);
    expect(screen.getByText(product.title)).toBeInTheDocument();
  });

  it('selects the drumkit when reached with the keyboard', async () => {
    const product = createProductCard();
    const onSelect = vi.fn();
    renderProductItem('/drumkits', {product, onSelect});
    await userEvent.tab();
    expect(onSelect).toHaveBeenCalledWith(product.id, product.title);
  });

  it('handles a drumkit without an image or description', () => {
    renderProductItem('/drumkits', {
      product: {...createProductCard(), featuredImage: null, description: ''},
      isSelected: true,
    });
    const link = screen.getByRole('link', {name: /Fixture Tee, selected/});
    expect(link).not.toHaveAccessibleDescription();
    expect(link.querySelector('img')).toBeNull();
  });

  it('keeps the hover description out of merch cards', () => {
    const product = createProductCard();
    renderProductItem('/merch', {product, isSelected: true});
    expect(screen.queryByText(product.description)).not.toBeInTheDocument();
    expect(screen.getByRole('link')).not.toHaveAccessibleDescription();
  });
});
