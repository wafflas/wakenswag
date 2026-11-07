import {act, render, screen} from '@testing-library/react';
import {createMemoryRouter, Outlet, RouterProvider} from 'react-router';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ProductListingShell} from '~/components/product-listing/ProductListingShell';

afterEach(() => vi.useRealTimers());

function renderListing(listingPath: string, initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        path: listingPath,
        element: (
          <ProductListingShell
            animationKey={listingPath}
            displayTitle="Collection"
            loadingDurationMs={800}
          >
            <Outlet />
          </ProductListingShell>
        ),
        children: [
          {index: true, element: <p>Product grid</p>},
          {path: ':handle', element: <p>Product detail</p>},
        ],
      },
    ],
    {initialEntries: [initialPath]},
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe.each(['/swag', '/drumkits'])(
  '%s listing loading lifecycle',
  (listingPath) => {
    it('does not cover a directly opened product with the listing intro', () => {
      vi.useFakeTimers();
      const router = renderListing(listingPath, `${listingPath}/fixture-tee`);
      expect(screen.getByText('Product detail')).toBeVisible();
      expect(screen.queryByText('Now loading...')).not.toBeInTheDocument();
      router.dispose();
    });

    it('clears an unfinished intro when a product opens and does not restart it on return', async () => {
      vi.useFakeTimers();
      const router = renderListing(listingPath, listingPath);
      expect(screen.getByText('Now loading...')).toBeInTheDocument();
      await act(async () => {
        await router.navigate(`${listingPath}/fixture-tee`);
      });
      expect(screen.getByText('Product detail')).toBeVisible();
      expect(screen.queryByText('Now loading...')).not.toBeInTheDocument();
      await act(async () => {
        await router.navigate(listingPath);
      });
      expect(screen.getByText('Product grid')).toBeVisible();
      expect(screen.queryByText('Now loading...')).not.toBeInTheDocument();
      router.dispose();
    });

    it('shows the initial intro once and skips it when a product closes', async () => {
      vi.useFakeTimers();
      const router = renderListing(listingPath, listingPath);
      expect(screen.getByText('Now loading...')).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });
      expect(screen.queryByText('Now loading...')).not.toBeInTheDocument();

      await act(async () => {
        await router.navigate(`${listingPath}/fixture-tee`);
      });
      expect(screen.getByText('Product detail')).toBeVisible();
      expect(screen.queryByText('Now loading...')).not.toBeInTheDocument();

      await act(async () => {
        await router.navigate(listingPath);
      });
      expect(screen.getByText('Product grid')).toBeVisible();
      expect(screen.queryByText('Now loading...')).not.toBeInTheDocument();
      router.dispose();
    });
  },
);
