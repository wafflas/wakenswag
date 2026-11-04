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
});
