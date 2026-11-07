import type {ReactNode} from 'react';
import {
  createMemoryRouter,
  RouterProvider,
  type ActionFunctionArgs,
} from 'react-router';
import {act, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {CartModal} from '~/components/cart/CartModal';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';
import {AsideProvider} from '~/components/layout/Aside';
import {SearchModal} from '~/components/search/SearchModal';
import {createCart, createVariant} from '../fixtures/catalog';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
}

function renderFooter({
  pathname = '/',
  cart = Promise.resolve(createCart(2)),
  children,
  action = () => ({}),
}: {
  pathname?: string;
  cart?: Promise<CartApiQueryFragment | null>;
  children?: ReactNode;
  action?: (args: ActionFunctionArgs) => unknown;
} = {}) {
  const router = createMemoryRouter(
    [
      {
        id: 'root',
        path: '/',
        loader: () => ({cart}),
        hydrateFallbackElement: <></>,
        element: (
          <AsideProvider>
            {children}
            <AppControllerFooter cart={cart} />
          </AsideProvider>
        ),
        children: [{path: '*', element: null}],
      },
      {path: '/cart', action},
    ],
    {initialEntries: [pathname]},
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('controller footer', () => {
  it('shows Search and the cart quantity on home without a Back action', async () => {
    renderFooter();
    await screen.findByRole('button', {name: 'Cart (2)'});
    const toolbar = screen.getByRole('toolbar', {name: 'Screen actions'});
    expect(within(toolbar).getByRole('button', {name: 'Search'})).toBeVisible();
    expect(
      within(toolbar).getByRole('button', {name: 'Cart (2)'}),
    ).toBeVisible();
    expect(
      within(toolbar).queryByRole('button', {name: 'Back'}),
    ).not.toBeInTheDocument();
  });

  it.each(['/swag', '/info', '/missing'])(
    'returns from %s to home',
    async (pathname) => {
      const user = userEvent.setup();
      const router = renderFooter({pathname});
      await screen.findByRole('button', {name: 'Cart (2)'});
      await user.click(screen.getByRole('button', {name: 'Back'}));
      await waitFor(() => expect(router.state.location.pathname).toBe('/'));
      expect(
        screen.queryByRole('button', {name: 'Back'}),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Search'})).toBeVisible();
    },
  );

  it.each([
    ['/info/privacy-policy', '/info'],
    ['/info/refund-policy', '/info'],
    ['/swag/fixture-tee', '/swag'],
    ['/swag/fixture-tee/', '/swag'],
    ['/drumkits/wnb-vol-001', '/drumkits'],
    ['/drumkits/wnb-vol-001/', '/drumkits'],
  ])(
    'returns directly opened product %s to %s',
    async (pathname, listingPath) => {
      const user = userEvent.setup();
      const router = renderFooter({pathname});
      await screen.findByRole('button', {name: 'Cart (2)'});
      await user.click(screen.getByRole('button', {name: 'Back'}));
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(listingPath),
      );
      expect(screen.getByRole('button', {name: 'Back'})).toBeVisible();
    },
  );

  it.each(['Search', 'Cart (2)'])(
    'replaces actions with Back while %s is open and restores them on close',
    async (label) => {
      const user = userEvent.setup();
      const router = renderFooter();
      await screen.findByRole('button', {name: 'Cart (2)'});
      await user.click(screen.getByRole('button', {name: label}));
      const toolbar = screen.getByRole('toolbar', {name: 'Screen actions'});
      expect(within(toolbar).getAllByRole('button')).toHaveLength(1);
      await user.click(within(toolbar).getByRole('button', {name: 'Back'}));
      expect(
        await within(toolbar).findByRole('button', {name: 'Search'}),
      ).toBeVisible();
      expect(
        within(toolbar).getByRole('button', {name: 'Cart (2)'}),
      ).toBeVisible();
      expect(
        within(toolbar).queryByRole('button', {name: 'Back'}),
      ).not.toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/');
    },
  );

  it('keeps actions usable while the cart loads, then displays its quantity', async () => {
    const user = userEvent.setup();
    const pendingCart = deferred<CartApiQueryFragment | null>();
    renderFooter({cart: pendingCart.promise});
    await user.click(await screen.findByRole('button', {name: 'Cart (0)'}));
    await user.click(screen.getByRole('button', {name: 'Back'}));
    expect(await screen.findByRole('button', {name: 'Cart (0)'})).toBeVisible();

    await act(async () => pendingCart.resolve(createCart(4)));
    expect(screen.getByRole('button', {name: 'Cart (4)'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Search'})).toBeVisible();
  });

  it('keeps actions usable when loading the cart fails', async () => {
    const user = userEvent.setup();
    const pendingCart = deferred<CartApiQueryFragment | null>();
    renderFooter({cart: pendingCart.promise});
    await screen.findByRole('button', {name: 'Cart (0)'});

    await act(async () => pendingCart.reject(new Error('Cart unavailable')));
    expect(screen.getByRole('button', {name: 'Cart (0)'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Search'}));
    await user.click(screen.getByRole('button', {name: 'Back'}));
    expect(await screen.findByRole('button', {name: 'Search'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Cart (0)'})).toBeVisible();
  });

  it('restores focus to Search when the cart resolves while the search dialog is open', async () => {
    const user = userEvent.setup();
    const pendingCart = deferred<CartApiQueryFragment | null>();
    renderFooter({cart: pendingCart.promise, children: <SearchModal />});
    await screen.findByRole('button', {name: 'Cart (0)'});
    await user.click(screen.getByRole('button', {name: 'Search'}));
    const dialog = screen.getByRole('dialog', {name: 'System browser search'});
    expect(dialog).toBeVisible();

    await act(async () => pendingCart.resolve(createCart(4)));
    expect(dialog).toBeVisible();
    await user.keyboard('{Escape}');

    expect(dialog).toBeVisible();
    expect(dialog).toHaveClass('anim-fade-out');
    expect(await screen.findByRole('button', {name: 'Cart (4)'})).toBeVisible();
    expect(dialog).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', {name: 'Search'})).toHaveFocus(),
    );
  });

  it('keeps the cart usable when opened before a pending add has a server price', async () => {
    const user = userEvent.setup();
    const pendingAction = deferred<{errors: Array<{message: string}>}>();
    const cart = Promise.resolve(createCart(0));
    const variant = createVariant();
    renderFooter({
      cart,
      action: () => pendingAction.promise,
      children: (
        <>
          <AddToCartButton
            lines={[
              {
                merchandiseId: variant.id,
                quantity: 1,
                selectedVariant: variant,
              },
            ]}
          >
            Add to cart
          </AddToCartButton>
          <CartModal cart={cart} />
        </>
      ),
    });
    await screen.findByRole('button', {name: 'Cart (0)'});
    await user.click(screen.getByRole('button', {name: 'Add to cart'}));
    await user.click(screen.getByRole('button', {name: 'Cart (1)'}));
    const items = await screen.findByRole('list', {name: 'Cart items'});
    expect(within(items).getByText('Fixture Tee')).toBeVisible();
    expect(within(items).getByText('—', {exact: true})).toBeVisible();

    await act(async () =>
      pendingAction.resolve({errors: [{message: 'Cart update failed'}]}),
    );
    expect(await screen.findByText('Your cart is empty.')).toBeVisible();
  });

  it('shows the optimistic cart quantity during submission and restores it after failure', async () => {
    const user = userEvent.setup();
    const pendingAction = deferred<{errors: Array<{message: string}>}>();
    const variant = createVariant();
    renderFooter({
      cart: Promise.resolve(createCart(1)),
      action: () => pendingAction.promise,
      children: (
        <AddToCartButton
          lines={[
            {merchandiseId: variant.id, quantity: 2, selectedVariant: variant},
          ]}
        >
          Add to cart
        </AddToCartButton>
      ),
    });
    await screen.findByRole('button', {name: 'Cart (1)'});
    await user.click(screen.getByRole('button', {name: 'Add to cart'}));
    expect(screen.getByRole('button', {name: 'Cart (3)'})).toBeVisible();
    expect(
      screen.getByRole('button', {name: 'Adding to cart...'}),
    ).toBeDisabled();

    await act(async () =>
      pendingAction.resolve({errors: [{message: 'Cart update failed'}]}),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', {name: 'Cart (1)'})).toBeVisible(),
    );
    expect(screen.getByRole('button', {name: 'Add to cart'})).toBeEnabled();
  });
});
