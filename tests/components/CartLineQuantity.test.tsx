import {
  createMemoryRouter,
  RouterProvider,
  type ActionFunctionArgs,
} from 'react-router';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CartForm} from '@shopify/hydrogen';
import {describe, expect, it, vi} from 'vitest';
import {CartLineQuantity} from '~/components/cart/CartLineQuantity';
import type {CartLine} from '~/components/cart/cartUtils';
import {createCart} from '../fixtures/catalog';

function renderQuantity(
  line: CartLine,
  action: (args: ActionFunctionArgs) => unknown = () => ({}),
) {
  const router = createMemoryRouter([
    {path: '/', element: <CartLineQuantity line={line} />},
    {path: '/cart', action},
  ]);
  return render(<RouterProvider router={router} />);
}

describe('cart line quantity controls', () => {
  it.each([
    [1, 'Remove item', CartForm.ACTIONS.LinesRemove],
    [2, 'Decrease quantity', CartForm.ACTIONS.LinesUpdate],
  ] as const)(
    'submits the correct action when decreasing quantity %s',
    async (quantity, label, expectedAction) => {
      const user = userEvent.setup();
      const submitted = vi.fn();
      const line = createCart(quantity).lines.nodes[0];
      renderQuantity(line, async ({request}) => {
        submitted(CartForm.getFormInput(await request.formData()));
        return {};
      });
      await user.click(screen.getByRole('button', {name: label}));
      await waitFor(() => expect(submitted).toHaveBeenCalledOnce());
      expect(submitted).toHaveBeenCalledWith({
        action: expectedAction,
        inputs:
          quantity === 1
            ? {lineIds: [line.id]}
            : {lines: [{id: line.id, quantity: 1}]},
      });
    },
  );

  it('submits an increment without changing the line identity', async () => {
    const user = userEvent.setup();
    const line = createCart(1).lines.nodes[0];
    const submitted = vi.fn();
    renderQuantity(line, async ({request}) => {
      submitted(CartForm.getFormInput(await request.formData()));
      return {};
    });
    await user.click(screen.getByRole('button', {name: /Increase quantity/}));
    await waitFor(() =>
      expect(submitted).toHaveBeenCalledWith({
        action: CartForm.ACTIONS.LinesUpdate,
        inputs: {lines: [{id: line.id, quantity: 2}]},
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

  it('disables both controls for an optimistic line', () => {
    renderQuantity({...createCart(1).lines.nodes[0], isOptimistic: true});
    expect(screen.getByRole('button', {name: 'Remove item'})).toBeDisabled();
    expect(
      screen.getByRole('button', {name: /Increase quantity/}),
    ).toBeDisabled();
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
        screen.getByText('Could not remove this item. Please try again.'),
      ).toBeVisible(),
    );
    expect(remove).toBeEnabled();
    expect(increase).toBeEnabled();
  });
});
