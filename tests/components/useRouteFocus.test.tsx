import {act, render, screen} from '@testing-library/react';
import {createMemoryRouter, Outlet, RouterProvider} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useRouteFocus} from '~/components/layout/useRouteFocus';
import {StrictMode, type ReactNode} from 'react';
import {RouteFocusProvider} from '~/components/layout/RouteFocusProvider';

const getAnimations = vi.fn<() => Animation[]>(() => []);
const originalGetAnimations = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'getAnimations',
);

beforeEach(() => {
  getAnimations.mockReset().mockReturnValue([]);
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: getAnimations,
  });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalGetAnimations)
    Object.defineProperty(
      Element.prototype,
      'getAnimations',
      originalGetAnimations,
    );
  else Reflect.deleteProperty(Element.prototype, 'getAnimations');
});

function FocusLayout({
  dialog = false,
  children,
}: {
  dialog?: boolean;
  children?: ReactNode;
}) {
  useRouteFocus();
  return (
    <>
      <div className="route-fade-transition">{children ?? <Outlet />}</div>
      {dialog ? (
        <div role="dialog" aria-modal="true" aria-label="Search">
          <input aria-label="Search memory" />
        </div>
      ) : null}
    </>
  );
}

function renderRoutes({initialPath = '/', dialog = false} = {}) {
  const router = createMemoryRouter(
    [
      {
        path: '/failure',
        element: (
          <FocusLayout key="error">
            <h1 data-route-focus tabIndex={-1}>
              Missing page
            </h1>
          </FocusLayout>
        ),
      },
      {
        element: <FocusLayout dialog={dialog} />,
        children: [
          {
            path: '/',
            element: (
              <h1 data-route-focus tabIndex={-1}>
                Home
              </h1>
            ),
          },
          {
            path: '/info',
            element: (
              <>
                <h1 data-route-focus tabIndex={-1}>
                  Info
                </h1>
                <input aria-label="Example input" />
              </>
            ),
          },
          {
            path: '/info/policy',
            element: (
              <h1 data-route-focus tabIndex={-1}>
                Policy
              </h1>
            ),
          },
        ],
      },
    ],
    {initialEntries: [initialPath]},
  );
  return {
    router,
    ...render(
      <StrictMode>
        <RouteFocusProvider>
          <RouterProvider router={router} />
        </RouteFocusProvider>
      </StrictMode>,
    ),
  };
}

function holdFade() {
  let finish!: (animation: Animation) => void;
  const finished = new Promise<Animation>((resolve) => {
    finish = resolve;
  });
  const animation = {finished} as Animation;
  getAnimations.mockReturnValueOnce([animation]);
  return () => finish(animation);
}

describe('route focus', () => {
  it('does not move focus on initial rendering', () => {
    const {router} = renderRoutes();
    expect(screen.getByRole('heading')).not.toHaveFocus();
    expect(getAnimations).not.toHaveBeenCalled();
    router.dispose();
  });

  it('keeps a pending handoff when an error replaces the root layout in Strict Mode', async () => {
    const {router} = renderRoutes();
    await act(async () => router.navigate('/failure'));
    expect(screen.getByRole('heading', {name: 'Missing page'})).toHaveFocus();
    await act(async () => router.navigate('/'));
    expect(screen.getByRole('heading', {name: 'Home'})).toHaveFocus();
    router.dispose();
  });

  it('waits for the page fade before focusing its reading start', async () => {
    const {router} = renderRoutes();
    const finishFade = holdFade();
    await act(async () => router.navigate('/info'));
    const heading = screen.getByRole('heading', {name: 'Info'});
    expect(heading).not.toHaveFocus();
    await act(async () => finishFade());
    expect(heading).toHaveFocus();
    router.dispose();
  });

  it('keeps an input focused during query and hash changes', async () => {
    const {router} = renderRoutes({initialPath: '/info'});
    const input = screen.getByRole('textbox');
    input.focus();
    await act(async () => router.navigate('/info?variant=large#details'));
    expect(input).toHaveFocus();
    expect(getAnimations).not.toHaveBeenCalled();
    router.dispose();
  });

  it('leaves focus with an open dialog', async () => {
    const {router} = renderRoutes({dialog: true});
    const input = screen.getByRole('textbox', {name: 'Search memory'});
    input.focus();
    await act(async () => router.navigate('/info'));
    expect(input).toHaveFocus();
    router.dispose();
  });

  it('does not steal focus from a user who interacts during the fade', async () => {
    const {router} = renderRoutes();
    const finishFade = holdFade();
    await act(async () => router.navigate('/info'));
    const input = screen.getByRole('textbox');
    input.focus();
    await act(async () => finishFade());
    expect(input).toHaveFocus();
    router.dispose();
  });

  it('cancels an old focus handoff when another page opens', async () => {
    const {router} = renderRoutes();
    const finishOldFade = holdFade();
    await act(async () => router.navigate('/info'));
    await act(async () => router.navigate('/info/policy'));
    expect(screen.getByRole('heading', {name: 'Policy'})).toHaveFocus();
    await act(async () => finishOldFade());
    expect(screen.getByRole('heading', {name: 'Policy'})).toHaveFocus();
    router.dispose();
  });

  it('cancels a pending focus handoff when the layout unmounts', async () => {
    const {router, unmount} = renderRoutes();
    const finishFade = holdFade();
    await act(async () => router.navigate('/info'));
    const focus = vi.spyOn(
      screen.getByRole('heading', {name: 'Info'}),
      'focus',
    );
    unmount();
    await act(async () => finishFade());
    expect(focus).not.toHaveBeenCalled();
    router.dispose();
  });
});
