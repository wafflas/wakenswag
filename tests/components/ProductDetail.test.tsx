import {
  createMemoryRouter,
  RouterProvider,
  type ActionFunction,
} from 'react-router';
import {act, render, screen, waitFor} from '@testing-library/react';
import {CartForm} from '@shopify/hydrogen';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {ProductDetail} from '~/components/product-detail/ProductDetail';
import {
  createProduct,
  createVariant,
  createDrumkitVariant,
  createDrumkitCart,
} from '../fixtures/catalog';

function renderProduct(
  available = true,
  pathname = '/',
  action?: ActionFunction,
) {
  const selectedVariant = createVariant('Small', available);
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <ProductDetail
            product={createProduct()}
            selectedVariant={selectedVariant}
          />
        ),
      },
      {path: '/cart', action},
    ],
    {initialEntries: [pathname]},
  );
  return {...render(<RouterProvider router={router} />), router};
}

function createAddToCartAction() {
  const submittedQuantity = vi.fn();
  const action: ActionFunction = async ({request}) => {
    const form = CartForm.getFormInput(await request.formData());
    if (form.action === CartForm.ACTIONS.LinesAdd) {
      submittedQuantity(form.inputs.lines[0].quantity);
    }
    return {};
  };
  return {action, submittedQuantity};
}

describe('product purchase controls', () => {
  it('disables a drumkit already present in the resolved root cart', async () => {
    const variant = createDrumkitVariant();
    const product = createProduct({
      selectedOrFirstAvailableVariant: variant,
      adjacentVariants: [],
      options: [],
    });
    const router = createMemoryRouter(
      [
        {
          id: 'root',
          path: '*',
          loader: () => ({cart: Promise.resolve(createDrumkitCart())}),
          element: (
            <ProductDetail product={product} selectedVariant={variant} />
          ),
        },
      ],
      {initialEntries: ['/drumkits/fixture-drumkit']},
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('button', {name: 'In cart'})).toBeDisabled();
  });
  it.each(['/merch', '/drumkits'])(
    'keeps variant links under %s',
    (listingPath) => {
      renderProduct(true, `${listingPath}/fixture-tee`);
      expect(screen.getByRole('link', {name: 'Large'})).toHaveAttribute(
        'href',
        `${listingPath}/fixture-tee?Size=Large`,
      );
    },
  );
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
  it.each([
    ['/merch/fixture-tee', 2],
    ['/drumkits/fixture-tee', 1],
  ])(
    'submits the expected purchase quantity from %s',
    async (pathname, quantity) => {
      const user = userEvent.setup();
      const {action, submittedQuantity} = createAddToCartAction();
      renderProduct(true, pathname, action);
      if (quantity === 2) {
        await user.click(
          screen.getByRole('button', {name: /Increase quantity/}),
        );
      } else {
        expect(
          screen.queryByRole('group', {name: 'Quantity'}),
        ).not.toBeInTheDocument();
      }
      await user.click(screen.getByRole('button', {name: 'Add to cart'}));
      await waitFor(() =>
        expect(submittedQuantity).toHaveBeenCalledWith(quantity),
      );
    },
  );

  it('submits one after switching from a previously increased merch quantity to drumkits', async () => {
    const user = userEvent.setup();
    const {action, submittedQuantity} = createAddToCartAction();
    const {router} = renderProduct(true, '/merch/fixture-tee', action);
    await user.click(screen.getByRole('button', {name: /Increase quantity/}));
    expect(screen.getByRole('status')).toHaveTextContent('2');
    await act(async () => {
      await router.navigate('/drumkits/fixture-tee');
    });
    expect(
      screen.queryByRole('group', {name: 'Quantity'}),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Add to cart'}));
    await waitFor(() => expect(submittedQuantity).toHaveBeenCalledWith(1));
  });

  it.each(['/', '/drumkits/fixture-tee'])(
    'disables purchasing when the variant is sold out on %s',
    (pathname) => {
      renderProduct(false, pathname);
      expect(screen.getByRole('button', {name: 'Sold out'})).toBeDisabled();
      expect(
        screen.queryByRole('group', {name: 'Quantity'}),
      ).not.toBeInTheDocument();
    },
  );
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
