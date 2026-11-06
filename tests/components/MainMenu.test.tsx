import {MemoryRouter} from 'react-router';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {MainMenu} from '~/components/home/HomeMenu';
import {AsideProvider} from '~/components/layout/Aside';

describe('main menu keyboard navigation', () => {
  it('wraps arrow selection and supports Home and End', async () => {
    const user = userEvent.setup();
    render(
      <AsideProvider>
        <MemoryRouter>
          <MainMenu />
        </MemoryRouter>
      </AsideProvider>,
    );
    await user.keyboard('{End}');
    expect(screen.getByRole('link', {name: 'Info'})).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', {name: 'Home'})).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('link', {name: 'Info'})).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('link', {name: 'Home'})).toHaveFocus();
  });
  it('does not take keyboard focus from a text field', async () => {
    const user = userEvent.setup();
    render(
      <AsideProvider>
        <MemoryRouter>
          <input aria-label="Example input" />
          <MainMenu />
        </MemoryRouter>
      </AsideProvider>,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{ArrowDown}{End}');
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('navigates custom info items and identifies external links', async () => {
    const user = userEvent.setup();
    render(
      <AsideProvider>
        <MemoryRouter initialEntries={['/info']}>
          <MainMenu
            ariaLabel="Information"
            variant="info"
            items={[
              {label: 'Privacy Policy', to: '/info/privacy-policy'},
              {
                label: 'Instagram',
                to: 'https://www.instagram.com/wakenswag/',
                external: true,
              },
              {
                label: 'Website Credits',
                to: 'https://wafflas.url',
                external: true,
              },
            ]}
          />
        </MemoryRouter>
      </AsideProvider>,
    );
    await user.keyboard('{End}');
    const credits = screen.getByRole('link', {name: /Website Credits/});
    expect(credits).toHaveFocus();
    expect(credits).toHaveAttribute('href', 'https://wafflas.url');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', {name: 'Privacy Policy'})).toHaveFocus();
    const instagram = screen.getByRole('link', {name: /Instagram/});
    await user.hover(instagram);
    expect(instagram).toHaveAttribute('data-selected', 'true');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.queryByRole('link', {current: 'page'}),
    ).not.toBeInTheDocument();
  });
});
