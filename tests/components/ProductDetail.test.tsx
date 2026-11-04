import {createMemoryRouter, RouterProvider} from 'react-router';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {ProductDetail} from '~/components/product-detail/ProductDetail';
import {createProduct, createVariant} from '../fixtures/catalog';

function renderProduct(available = true) {
  const selectedVariant = createVariant('Small', available);
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <ProductDetail
          product={createProduct()}
          selectedVariant={selectedVariant}
        />
      ),
    },
  ]);
  return render(<RouterProvider router={router} />);
}

describe('product purchase controls', () => {
  it('starts at one and respects the stock limit', async () => {
    const user = userEvent.setup();
    renderProduct();
    expect(
      screen.getByRole('button', {name: 'Decrease quantity'}),
    ).toBeDisabled();
    const increase = screen.getByRole('button', {name: /Increase quantity/});
    await user.click(increase);
    await user.click(increase);
    expect(screen.getByRole('status')).toHaveTextContent('3');
    expect(increase).toBeDisabled();
  });
  it('disables purchasing when the variant is sold out', () => {
    renderProduct(false);
    expect(screen.getByRole('button', {name: 'Sold out'})).toBeDisabled();
    expect(
      screen.queryByRole('group', {name: 'Quantity'}),
    ).not.toBeInTheDocument();
  });
  it('safely renders a product with no selectable variant', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ProductDetail
            product={createProduct({selectedOrFirstAvailableVariant: null})}
            selectedVariant={null}
          />
        ),
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('button', {name: 'Sold out'})).toBeDisabled();
  });
  it('prevents repeat submissions and presents a recoverable cart error', async () => {
    const user = userEvent.setup();
    let finish = () => {};
    const pending = new Promise<{errors: Array<{message: string}>}>(
      (resolve) => {
        finish = () => resolve({errors: [{message: 'Sold out'}]});
      },
    );
    const action = vi.fn(() => pending);
    const variant = createVariant();
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ProductDetail product={createProduct()} selectedVariant={variant} />
        ),
      },
      {path: '/cart', action},
    ]);
    render(<RouterProvider router={router} />);
    await user.click(screen.getByRole('button', {name: 'Add to cart'}));
    expect(
      screen.getByRole('button', {name: 'Adding to cart...'}),
    ).toBeDisabled();
    await user.click(screen.getByRole('button', {name: 'Adding to cart...'}));
    expect(action).toHaveBeenCalledOnce();
    finish();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Please try again'),
    );
    expect(screen.getByRole('button', {name: 'Add to cart'})).toBeEnabled();
  });
});
