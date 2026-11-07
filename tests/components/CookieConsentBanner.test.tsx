import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {CustomerPrivacy, CustomerPrivacyApiProps} from '@shopify/hydrogen';
import {CookieConsentBanner} from '~/components/privacy/CookieConsentBanner';
import {AsideProvider} from '~/components/layout/Aside';

const privacy = vi.hoisted(() => ({
  props: {} as CustomerPrivacyApiProps,
  shouldShowBanner: vi.fn(() => true),
  currentVisitorConsent: vi.fn<CustomerPrivacy['currentVisitorConsent']>(
    () => ({
      analytics: '',
      marketing: '',
      preferences: '',
      sale_of_data: '',
    }),
  ),
  setTrackingConsent: vi.fn(),
}));

vi.mock('@shopify/hydrogen', () => ({
  useCustomerPrivacy: (props: CustomerPrivacyApiProps) => {
    privacy.props = props;
    return {customerPrivacy: privacy};
  },
}));

function renderBanner(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AsideProvider>
        <CookieConsentBanner
          consent={{
            checkoutDomain: 'checkout.example',
            storefrontAccessToken: 'fixture',
          }}
        />
      </AsideProvider>
    </MemoryRouter>,
  );
}

function ready() {
  act(() => privacy.props.onReady?.());
}

beforeEach(() => {
  privacy.shouldShowBanner.mockReset().mockReturnValue(true);
  privacy.currentVisitorConsent.mockReset().mockReturnValue({
    analytics: '',
    marketing: '',
    preferences: '',
    sale_of_data: '',
  });
  privacy.setTrackingConsent.mockReset();
});

afterEach(() => vi.useRealTimers());

describe('custom cookie consent banner', () => {
  it('waits for Shopify and follows its region / saved-choice decision', () => {
    privacy.shouldShowBanner.mockReturnValue(false);
    renderBanner();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    ready();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(privacy.props.withPrivacyBanner).toBe(false);
  });

  it('leaves a product dialog in control of the screen', () => {
    renderBanner('/swag/fixture-tee');
    ready();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it.each(['yes', 'no'] as const)(
    'does not ask again when Shopify has saved "%s", even if shouldShowBanner is true',
    (choice) => {
      privacy.currentVisitorConsent.mockReturnValue({
        analytics: choice,
        marketing: choice,
        preferences: choice,
        sale_of_data: 'no',
      });
      renderBanner();
      ready();
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    },
  );

  it('still asks when only sale-of-data consent is set by a browser privacy signal', () => {
    privacy.currentVisitorConsent.mockReturnValue({
      analytics: '',
      marketing: '',
      preferences: '',
      sale_of_data: 'no',
    });
    renderBanner();
    ready();
    expect(screen.getByRole('region')).toBeVisible();
  });

  it.each([true, false])(
    'saves optional consent as %s and closes only after success',
    async (accepted) => {
      const user = userEvent.setup();
      renderBanner();
      ready();
      await user.click(
        screen.getByRole('button', {
          name: accepted ? 'Accept optional' : 'Reject optional',
        }),
      );
      expect(privacy.setTrackingConsent).toHaveBeenCalledWith(
        {
          analytics: accepted,
          marketing: accepted,
          preferences: accepted,
          sale_of_data: false,
        },
        expect.any(Function),
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        'Saving your choice',
      );
      expect(
        screen.getByRole('button', {name: 'Accept optional'}),
      ).toBeDisabled();
      act(() => {
        privacy.setTrackingConsent.mock.calls[0][1]();
      });
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    },
  );

  it('keeps failed choices visible and permits retry', async () => {
    const user = userEvent.setup();
    renderBanner();
    ready();
    privacy.setTrackingConsent.mockImplementationOnce((_, finish) =>
      finish({error: 'Network error'}),
    );
    await user.click(screen.getByRole('button', {name: 'Reject optional'}));
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    await user.click(screen.getByRole('button', {name: 'Reject optional'}));
    expect(privacy.setTrackingConsent).toHaveBeenCalledTimes(2);
    act(() => {
      privacy.setTrackingConsent.mock.calls[1][1]();
    });
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('ignores the removed preview parameter when a choice is already saved', () => {
    privacy.currentVisitorConsent.mockReturnValue({
      analytics: 'no',
      marketing: 'no',
      preferences: 'no',
      sale_of_data: 'no',
    });
    renderBanner('/info?cookies=1');
    ready();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(privacy.setTrackingConsent).not.toHaveBeenCalled();
  });

  it('waits for Shopify readiness before displaying consent controls', () => {
    renderBanner();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(privacy.setTrackingConsent).not.toHaveBeenCalled();
    ready();
    expect(screen.getByRole('button', {name: 'Accept optional'})).toBeEnabled();
  });

  it('ignores late save callbacks and clears its timer on unmount', () => {
    vi.useFakeTimers();
    const view = renderBanner();
    ready();
    act(() => screen.getByRole('button', {name: 'Reject optional'}).click());
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    act(() => {
      privacy.setTrackingConsent.mock.calls[0][1]();
    });
    expect(screen.getByRole('region')).toBeVisible();
    act(() => screen.getByRole('button', {name: 'Reject optional'}).click());
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      privacy.setTrackingConsent.mock.calls[1][1]();
    });
  });
});
