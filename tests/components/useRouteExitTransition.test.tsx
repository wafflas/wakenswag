import {act, render, screen} from '@testing-library/react';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useRouteExitTransition} from '~/components/animations/useRouteExitTransition';

afterEach(() => vi.useRealTimers());

function ExitProbe() {
  const {isExiting} = useRouteExitTransition(() => true, 400);
  return <p>{isExiting ? 'Leaving page' : 'Ready'}</p>;
}

function renderTransition() {
  const router = createMemoryRouter([
    {path: '/', element: <ExitProbe />},
    {path: '/next', element: <h1>Next page</h1>},
  ]);
  const view = render(<RouterProvider router={router} />);
  return {router, ...view};
}

describe('route exit timing', () => {
  it('holds navigation for the exit duration before displaying the next page', async () => {
    vi.useFakeTimers();
    const {router} = renderTransition();
    await act(async () => {
      await router.navigate('/next');
    });
    expect(screen.getByText('Leaving page')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(399);
    });
    expect(router.state.location.pathname).toBe('/');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(
      screen.getByRole('heading', {name: 'Next page'}),
    ).toBeInTheDocument();
    router.dispose();
  });
  it('skips the animation delay for reduced motion', async () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const {router} = renderTransition();
    await act(async () => {
      await router.navigate('/next');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(
      screen.getByRole('heading', {name: 'Next page'}),
    ).toBeInTheDocument();
    router.dispose();
  });
  it('clears the pending navigation timer when unmounted', async () => {
    vi.useFakeTimers();
    const {router, unmount} = renderTransition();
    await act(async () => {
      await router.navigate('/next');
    });
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(router.state.location.pathname).toBe('/');
    router.dispose();
  });
});
