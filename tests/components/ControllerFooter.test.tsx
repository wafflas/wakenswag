import type {ReactNode} from 'react';
import {
  createMemoryRouter,
  RouterProvider,
  type ActionFunctionArgs,
} from 'react-router';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {
  CartProvider,
  type CartApiQueryFragment,
  useCartActions,
} from '~/lib/cart';
import {ProductProvider} from '~/lib/product';
import {mockCartRequest} from '../fixtures/shopifyRuntime';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {CartModal} from '~/components/cart/CartModal';
import {AppControllerFooter} from '~/components/controller/AppControllerFooter';
import {AsideProvider} from '~/components/layout/Aside';
import {SearchModal} from '~/components/search/SearchModal';
import {createCart, createProduct} from '../fixtures/catalog';

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
  inDialog = true,
  getCart,
}: {
  pathname?: string;
  cart?: Promise<CartApiQueryFragment | null>;
  children?: ReactNode;
  action?: (args: ActionFunctionArgs) => unknown;
  inDialog?: boolean;
  getCart?: () => Promise<CartApiQueryFragment | null>;
} = {}) {
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
  const router = createMemoryRouter(
    [
      {
        id: 'root',
        path: '/',
        loader: () => ({cart: getCart ? getCart() : cart}),
        hydrateFallbackElement: <></>,
        element: (
          <CartProvider
            initialData={(getCart ? getCart() : cart)?.then((value) => ({
              cart: value,
            }))}
          >
            <ProductProvider product={createProduct()}>
              <AsideProvider>
                {children}
                <AppControllerFooter inDialog={inDialog} />
              </AsideProvider>
            </ProductProvider>
          </CartProvider>
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
    const toolbar = screen.getByRole('group', {name: 'Screen actions'});
    expect(within(toolbar).getByRole('button', {name: 'Search'})).toBeVisible();
    expect(
      within(toolbar).getByRole('button', {name: 'Cart (2)'}),
    ).toBeVisible();
    expect(
      within(toolbar).queryByRole('button', {name: 'Back'}),
    ).not.toBeInTheDocument();
  });

  it('does not pop when the existing cart first loads or the footer renders again', async () => {
    const user = userEvent.setup();
    renderFooter();
    const cartButton = await screen.findByRole('button', {name: 'Cart (2)'});
    const count = within(cartButton).getByText('(2)');
    expect(count.className).not.toContain('animate-[ping_');

    await user.pointer({target: cartButton});
    fireEvent.pointerDown(document.body);
    await user.keyboard('{Tab}');
    expect(within(cartButton).getByText('(2)')).toBe(count);
    expect(count.className).not.toContain('animate-[ping_');
  });

  it.each(['/swag', '/info', '/missing'])(
    'returns from %s to home',
    async (pathname) => {
      const user = userEvent.setup();
      const router = renderFooter({pathname});
      await screen.findByRole('button', {name: 'Cart (2)'});
      expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute(
        'data-activate-sound',
        'back',
      );
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
    'shows the appropriate actions while %s is open and restores them on close',
    async (label) => {
      const user = userEvent.setup();
      const router = renderFooter();
      await screen.findByRole('button', {name: 'Cart (2)'});
      await user.click(screen.getByRole('button', {name: label}));
      const toolbar = screen.getByRole('group', {name: 'Screen actions'});
      expect(within(toolbar).getAllByRole('button')).toHaveLength(
        label === 'Search' ? 2 : 1,
      );
      if (label === 'Search') {
        expect(
          within(toolbar).getByRole('button', {name: 'Cart (2)'}),
        ).toBeVisible();
      }
      expect(
        within(toolbar).getByRole('button', {name: 'Back'}),
      ).toHaveAttribute('data-activate-sound', 'back');
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
    const pendingCartButton = await screen.findByRole('button', {name: 'Cart'});
    expect(pendingCartButton).toHaveAccessibleName('Cart');
    await user.click(pendingCartButton);
    await user.click(screen.getByRole('button', {name: 'Back'}));
    expect(await screen.findByRole('button', {name: 'Cart'})).toBeVisible();

    await act(async () => pendingCart.resolve(createCart(4)));
    expect(screen.getByRole('button', {name: 'Cart (4)'})).toBeVisible();
    expect(screen.getByText('(4)').className).not.toContain('animate-[ping_');
    expect(screen.getByRole('button', {name: 'Search'})).toBeVisible();
  });

  it('keeps actions usable when loading the cart fails', async () => {
    const user = userEvent.setup();
    const pendingCart = deferred<CartApiQueryFragment | null>();
    renderFooter({cart: pendingCart.promise, children: <CartModal />});
    await screen.findByRole('button', {name: 'Cart'});

    await act(async () => pendingCart.reject(new Error('Cart unavailable')));
    expect(screen.getByRole('button', {name: 'Cart (0)'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Search'}));
    await user.click(screen.getByRole('button', {name: 'Back'}));
    expect(await screen.findByRole('button', {name: 'Search'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Cart (0)'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Cart (0)'}));
    expect(
      await screen.findByText('Could not load your cart. Please try again.'),
    ).toBeVisible();
    expect(screen.getByRole('link', {name: 'Reload page'})).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('shows a safe reload action when Shopify reports an initial cart read error', async () => {
    const user = userEvent.setup();
    const cart = Promise.resolve({
      cart: null,
      errors: [{message: 'Private upstream details'}],
    });
    const router = createMemoryRouter([
      {
        id: 'root',
        path: '/',
        loader: () => ({cart}),
        element: (
          <CartProvider initialData={cart}>
            <AsideProvider>
              <CartModal />
              <AppControllerFooter />
            </AsideProvider>
          </CartProvider>
        ),
      },
    ]);
    render(<RouterProvider router={router} />);
    await user.click(await screen.findByRole('button', {name: 'Cart (0)'}));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your cart',
    );
    expect(
      screen.queryByText('Private upstream details'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Reload page'})).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByText('Your cart is empty.')).not.toBeVisible();
  });

  it('keeps the last quantity while a refreshed cart is pending and pops for its actual change', async () => {
    const refreshedCart = deferred<CartApiQueryFragment | null>();
    let cart = Promise.resolve<CartApiQueryFragment | null>(createCart(2));
    const refresh = {current: () => {}};
    function RefreshControl() {
      refresh.current = useCartActions().refresh;
      return null;
    }
    renderFooter({cart, children: <RefreshControl />});
    await screen.findByRole('button', {name: 'Cart (2)'});
    const count = screen.getByText('(2)');
    cart = refreshedCart.promise;
    mockCartRequest(() => undefined);
    const fetch = vi.fn(() =>
      refreshedCart.promise.then((cart) => Response.json({cart})),
    );
    vi.stubGlobal('fetch', fetch);
    act(() => refresh.current());
    expect(screen.getByText('(2)')).toBe(count);
    expect(count.className).not.toContain('animate-[ping_');

    await act(async () => refreshedCart.resolve(createCart(3)));
    expect(screen.getByText('(3)').className).toContain('animate-[ping_');
  });

  it('restores focus to Search when the cart resolves while the search dialog is open', async () => {
    const user = userEvent.setup();
    const pendingCart = deferred<CartApiQueryFragment | null>();
    renderFooter({cart: pendingCart.promise, children: <SearchModal />});
    await screen.findByRole('button', {name: 'Cart'});
    await user.click(screen.getByRole('button', {name: 'Search'}));
    const dialog = screen.getByRole('dialog', {name: 'System browser search'});
    expect(dialog).toBeVisible();

    await act(async () => pendingCart.resolve(createCart(4)));
    expect(dialog).toBeVisible();
    await user.keyboard('{Escape}');

    expect(dialog).toBeVisible();
    expect(dialog.querySelector('.anim-fade-out')).not.toBeNull();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(screen.getByRole('button', {name: 'Cart (4)'})).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('button', {name: 'Search'})).toHaveFocus(),
    );
  });

  it('keeps the known cart quantity when opening search instead of flashing zero', async () => {
    const user = userEvent.setup();
    renderFooter({inDialog: false, children: <SearchModal />});
    await screen.findByRole('button', {name: 'Cart (2)'});
    await user.click(screen.getByRole('button', {name: 'Search'}));

    const dialog = screen.getByRole('dialog', {name: 'System browser search'});
    expect(
      within(dialog).getByRole('button', {name: 'Cart (2)'}),
    ).toBeVisible();
    expect(
      within(dialog).queryByRole('button', {name: 'Cart (0)'}),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', {name: 'Cart'}),
    ).not.toBeInTheDocument();
  });

  it('places Back inside the active dialog and replaces the page footer', async () => {
    const user = userEvent.setup();
    renderFooter({inDialog: false, children: <SearchModal />});
    await screen.findByRole('button', {name: 'Cart (2)'});
    await user.click(screen.getByRole('button', {name: 'Search'}));

    const dialog = screen.getByRole('dialog', {name: 'System browser search'});
    expect(within(dialog).getByRole('button', {name: 'Back'})).toBeVisible();
    expect(screen.getAllByRole('group', {name: 'Screen actions'})).toHaveLength(
      1,
    );
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.getByRole('button', {name: 'Search'})).toHaveFocus(),
    );
    expect(dialog).not.toBeInTheDocument();
  });

  it('opens Cart from the search footer and restores focus to the page Cart when closed', async () => {
    const user = userEvent.setup();
    const cart = Promise.resolve(createCart(2));
    renderFooter({
      cart,
      inDialog: false,
      children: (
        <>
          <SearchModal />
          <CartModal />
        </>
      ),
    });
    await user.click(await screen.findByRole('button', {name: 'Search'}));
    const search = screen.getByRole('dialog', {name: 'System browser search'});
    expect(within(search).getByRole('button', {name: 'Back'})).toBeVisible();
    await user.click(
      await within(search).findByRole('button', {name: 'Cart (2)'}),
    );

    const cartDialog = screen.getByRole('dialog', {name: 'Shopping cart'});
    expect(search).not.toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(
      within(cartDialog).getByRole('button', {name: 'Back'}),
    ).toBeVisible();
    expect(
      within(cartDialog).queryByRole('button', {name: /Cart \(/}),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.getByRole('button', {name: 'Cart (2)'})).toHaveFocus(),
    );
    expect(cartDialog).not.toBeInTheDocument();
  });

  it('keeps the cart usable when opened before a pending add has a server price', async () => {
    const user = userEvent.setup();
    const pendingAction = deferred<{errors: Array<{message: string}>}>();
    const cart = Promise.resolve(createCart(0));
    renderFooter({
      cart,
      action: () => pendingAction.promise,
      children: (
        <>
          <AddToCartButton quantity={1}>Add to cart</AddToCartButton>
          <CartModal />
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
    await waitFor(() =>
      expect(screen.getByText('Your cart is empty.')).toBeVisible(),
    );
  });

  it('shows the optimistic cart quantity during submission and restores it after failure', async () => {
    const user = userEvent.setup();
    const pendingAction = deferred<{errors: Array<{message: string}>}>();
    renderFooter({
      cart: Promise.resolve(createCart(1)),
      action: () => pendingAction.promise,
      children: <AddToCartButton quantity={2}>Add to cart</AddToCartButton>,
    });
    await screen.findByRole('button', {name: 'Cart (1)'});
    expect(screen.getByText('(1)').className).not.toContain('animate-[ping_');
    await user.click(screen.getByRole('button', {name: 'Add to cart'}));
    expect(screen.getByRole('button', {name: 'Cart (3)'})).toBeVisible();
    const animatedCount = screen.getByText('(3)');
    expect(animatedCount.className).toContain('animate-[ping_');
    fireEvent.pointerDown(document.body);
    await user.keyboard('{Tab}');
    expect(screen.getByText('(3)')).toBe(animatedCount);
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
