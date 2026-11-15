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
  it.each(['/swag', '/drumkits'])(
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

  it('previews only the first HTML bullet of the selected drumkit', () => {
    const product = {
      ...createProductCard(),
      title: 'Drumkit Vol. 001',
      description: 'Distorted 808s.\nIncludes WAV samples.',
      descriptionHtml:
        '<p>Full kit description</p><ul><li>Distorted <strong>808s</strong> &amp; kicks.</li><li>Includes WAV samples.</li></ul>',
    };
    renderProductItem('/drumkits', {product, isSelected: true});
    expect(
      screen.getByRole('link', {name: /Drumkit Vol. 001, selected/}),
    ).toHaveAccessibleDescription('Distorted 808s & kicks.');
    expect(screen.getByText('Distorted 808s & kicks.')).toBeInTheDocument();
    expect(screen.queryByText('Includes WAV samples.')).not.toBeInTheDocument();
    expect(screen.queryByText('Full kit description')).not.toBeInTheDocument();
    expect(screen.getByText(product.title)).toBeInTheDocument();
  });

  it('falls back to the first nonempty plain-text bullet', () => {
    const product = {
      ...createProductCard(),
      description: '\n- Distorted 808s.\n• Includes WAV samples.',
      descriptionHtml: '<p>Distorted 808s. Includes WAV samples.</p>',
    };
    renderProductItem('/drumkits', {product, isSelected: true});
    expect(screen.getByRole('link')).toHaveAccessibleDescription(
      'Distorted 808s.',
    );
    expect(screen.queryByText('Includes WAV samples.')).not.toBeInTheDocument();
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
      product: {
        ...createProductCard(),
        featuredImage: null,
        description: '',
        descriptionHtml: '',
      },
      isSelected: true,
    });
    const link = screen.getByRole('link', {name: /Fixture Tee, selected/});
    expect(link).not.toHaveAccessibleDescription();
    expect(link.querySelector('img')).toBeNull();
  });

  it('keeps the hover description out of Swag cards', () => {
    const product = createProductCard();
    renderProductItem('/swag', {product, isSelected: true});
    expect(screen.queryByText(product.description)).not.toBeInTheDocument();
    expect(screen.getByRole('link')).not.toHaveAccessibleDescription();
  });
});
