import {
  createMemoryRouter,
  RouterProvider,
  type ActionFunction,
} from 'react-router';
import {act, render, screen, waitFor} from '@testing-library/react';
import {CartProvider} from '~/lib/cart';
import {ProductProvider} from '~/lib/product';
import {mockCartRequest} from '../fixtures/shopifyRuntime';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import type {ProductFragment} from '~/lib/productDetail';
import {ProductDetail as ProductDetailView} from '~/components/product-detail/ProductDetail';
import {
  createProduct,
  createVariant,
  createDrumkitVariant,
  createDrumkitCart,
} from '../fixtures/catalog';

function ProductDetail({
  product,
  selectedVariant,
  cart = null,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  cart?: ReturnType<typeof createDrumkitCart> | null;
}) {
  const selectedProduct = {
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  };
  return (
    <CartProvider initialData={{cart}}>
      <ProductProvider product={selectedProduct}>
        <ProductDetailView product={selectedProduct} />
      </ProductProvider>
    </CartProvider>
  );
}

function renderProduct(
  available = true,
  pathname = '/',
  action?: ActionFunction,
) {
  const selectedVariant = createVariant('Small', available);
  if (action)
    mockCartRequest(async (payload) =>
      action({
        request: new Request('http://localhost/api/cart', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {'content-type': 'application/json'},
        }),
        params: {},
        context: {},
      } as Parameters<ActionFunction>[0]),
    );
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
    const form = (await request.json()) as {lines: Array<{quantity: number}>};
    submittedQuantity(form.lines[0].quantity);
    return {};
  };
  return {action, submittedQuantity};
}

it('keeps every description bullet on the full product page', () => {
  const product = createProduct({
    descriptionHtml:
      '<ul><li>Distorted 808s.</li><li>Includes WAV samples.</li></ul>',
  });
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <ProductDetail
          product={product}
          selectedVariant={product.selectedOrFirstAvailableVariant}
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  expect(screen.getByText('Distorted 808s.')).toBeInTheDocument();
  expect(screen.getByText('Includes WAV samples.')).toBeInTheDocument();
});

describe('product sale pricing', () => {
  function priceView(
    selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'],
  ) {
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
    return <RouterProvider key={selectedVariant?.id} router={router} />;
  }

  it('shows the original price and updates the sale when the selected variant changes', () => {
    const variant = {
      ...createVariant(),
      price: {amount: '40.00', currencyCode: 'EUR' as const},
      compareAtPrice: {amount: '50.00', currencyCode: 'EUR' as const},
    };
    const {rerender} = render(priceView(variant));

    expect(screen.getByText('50 EURO').closest('s')).toBeInTheDocument();
    expect(screen.getByText('40 EURO')).toHaveTextContent('Sale price:');
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/% off/)).not.toBeInTheDocument();

    rerender(priceView(createVariant('Large')));

    expect(screen.getByText('30 EURO')).toHaveTextContent('Price:');
    expect(screen.queryByText('50 EURO')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/% off/)).not.toBeInTheDocument();
  });

  it.each([null, '25.00', '20.00'])(
    'shows only the current price when the compare-at amount is %s',
    (amount) => {
      render(
        priceView({
          ...createVariant(),
          compareAtPrice: amount ? {amount, currencyCode: 'EUR'} : null,
        }),
      );

      expect(screen.getByText('25 EURO')).toHaveTextContent('Price:');
      expect(screen.queryByText('Original price:')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/% off/)).not.toBeInTheDocument();
    },
  );

  it('does not compare prices in different currencies', () => {
    render(
      priceView({
        ...createVariant(),
        compareAtPrice: {amount: '50.00', currencyCode: 'USD'},
      }),
    );

    expect(screen.getByText('25 EURO')).toBeInTheDocument();
    expect(screen.queryByText('Original price:')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/% off/)).not.toBeInTheDocument();
  });

  it('shows both prices even for a small discount', () => {
    render(
      priceView({
        ...createVariant(),
        compareAtPrice: {amount: '25.01', currencyCode: 'EUR'},
      }),
    );

    expect(screen.getByText('25.01 EURO').closest('s')).toBeInTheDocument();
    expect(screen.getByText('25 EURO')).toHaveTextContent('Sale price:');
  });
});

describe('product purchase controls', () => {
  it('disables a drumkit already present in the resolved root cart', async () => {
    const variant = createDrumkitVariant();
    const product = createProduct({
      selectedOrFirstAvailableVariant: variant,
      adjacentVariants: [],
      options: [
        {
          name: 'Title',
          optionValues: [
            {
              name: 'Default Title',
              firstSelectableVariant: variant,
              swatch: null,
            },
          ],
        },
      ],
      encodedVariantExistence: 'v1_0',
      encodedVariantAvailability: 'v1_0',
    });
    const router = createMemoryRouter(
      [
        {
          id: 'root',
          path: '*',
          loader: () => ({cart: Promise.resolve(createDrumkitCart())}),
          element: (
            <ProductDetail
              product={product}
              selectedVariant={variant}
              cart={createDrumkitCart()}
            />
          ),
        },
      ],
      {initialEntries: ['/drumkits/fixture-drumkit']},
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('button', {name: 'In cart'})).toBeDisabled();
  });
  it.each(['/swag', '/drumkits'])(
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
    ['/swag/fixture-tee', 2],
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

  it('submits one after switching from a previously increased Swag quantity to drumkits', async () => {
    const user = userEvent.setup();
    const {action, submittedQuantity} = createAddToCartAction();
    const {router} = renderProduct(true, '/swag/fixture-tee', action);
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
    mockCartRequest(() => action());
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
