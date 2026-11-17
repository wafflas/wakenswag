import {
  createMemoryRouter,
  RouterProvider,
  type ActionFunctionArgs,
} from 'react-router';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {parseCartRequest} from '@shopify/hydrogen';
import {CartProvider} from '~/lib/cart';
import {mockCartRequest} from '../fixtures/shopifyRuntime';
import {describe, expect, it, vi} from 'vitest';
import {CartLineQuantity} from '~/components/cart/CartLineQuantity';
import type {CartLine} from '~/components/cart/cartUtils';
import {createCart} from '../fixtures/catalog';

function renderQuantity(
  line: CartLine,
  action: (args: ActionFunctionArgs) => unknown = () => ({}),
) {
  mockCartRequest((payload) =>
    action({
      request: new Request('http://localhost/api/cart', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(payload),
      }),
      params: {},
      context: {},
    } as ActionFunctionArgs),
  );
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <CartProvider
          initialData={{
            cart: {...createCart(line.quantity), lines: {nodes: [line]}},
          }}
        >
          <CartLineQuantity line={line} />
        </CartProvider>
      ),
    },
    {path: '/cart', action},
  ]);
  return render(<RouterProvider router={router} />);
}

describe('cart line quantity controls', () => {
  it.each([
    [1, 'Remove item', 'remove'],
    [2, 'Decrease quantity', 'update'],
  ] as const)(
    'submits the correct action when decreasing quantity %s',
    async (quantity, label, expectedAction) => {
      const user = userEvent.setup();
      const submitted = vi.fn();
      const line = createCart(quantity).lines.nodes[0];
      renderQuantity(line, async ({request}) => {
        submitted((await parseCartRequest(request)).action);
        return {};
      });
      await user.click(screen.getByRole('button', {name: label}));
      await waitFor(() => expect(submitted).toHaveBeenCalledOnce());
      expect(submitted).toHaveBeenCalledWith({
        intent: expectedAction,
        ...(quantity === 1
          ? {lineIds: [`${line.id}?cart=fixture`]}
          : {lines: [{id: `${line.id}?cart=fixture`, quantity: 1}]}),
      });
    },
  );

  it('submits an increment without changing the line identity', async () => {
    const user = userEvent.setup();
    const line = createCart(1).lines.nodes[0];
    const submitted = vi.fn();
    renderQuantity(line, async ({request}) => {
      submitted((await parseCartRequest(request)).action);
      return {};
    });
    await user.click(screen.getByRole('button', {name: /Increase quantity/}));
    await waitFor(() =>
      expect(submitted).toHaveBeenCalledWith({
        intent: 'update',
        lines: [{id: `${line.id}?cart=fixture`, quantity: 2}],
      }),
    );
  });

  it('disables increases at the stock limit but permits decreasing', () => {
    renderQuantity(createCart(3).lines.nodes[0]);
    expect(
      screen.getByRole('button', {name: /Increase quantity/}),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', {name: 'Decrease quantity'}),
    ).toBeEnabled();
  });

  it('exposes an editable quantity field with numeric input hints', () => {
    renderQuantity(createCart(2).lines.nodes[0]);
    expect(screen.getByRole('textbox', {name: 'Item quantity'})).toHaveValue(
      '2',
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'numeric');
  });

  it('shares pending state between controls and permits retry after failure', async () => {
    const user = userEvent.setup();
    let finish = () => {};
    const pending = new Promise<{errors: Array<{message: string}>}>(
      (resolve) => {
        finish = () => resolve({errors: [{message: 'Fixture failure'}]});
      },
    );
    renderQuantity(createCart(1).lines.nodes[0], () => pending);
    const remove = screen.getByRole('button', {name: 'Remove item'});
    const increase = screen.getByRole('button', {name: /Increase quantity/});
    await user.click(remove);
    expect(remove).toBeDisabled();
    expect(increase).toBeDisabled();
    finish();
    await waitFor(() =>
      expect(
        screen.getByText('Could not update this item. Please try again.'),
      ).toBeVisible(),
    );
    expect(remove).toBeEnabled();
    expect(increase).toBeEnabled();
  });
});
