import {
  useCustomerPrivacy,
  type CustomerPrivacyApiProps,
} from '@shopify/hydrogen';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router';
import {isProductDetailPath} from '~/lib/variants';
import {
  FADE_CLASSES,
  OVERLAY_FADE_DURATION_MS,
} from '~/components/animations/animationUtils';
import {useExiting} from '~/components/animations/useExiting';
import {useAside} from '~/components/layout/Aside';

export function CookieConsentBanner({
  consent,
}: {
  consent: CustomerPrivacyApiProps;
}) {
  const {pathname} = useLocation();
  const {type: asideType} = useAside();
  const [initialized, setInitialized] = useState(false);
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState('');
  const pendingRequest = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {customerPrivacy} = useCustomerPrivacy({
    ...consent,
    withPrivacyBanner: false,
    onReady: () => setInitialized(true),
    onVisitorConsentCollected: () => setIsExiting(true),
  });
  const finishExit = useCallback(() => {
    setRequired(false);
    setIsExiting(false);
  }, []);

  useExiting(isExiting ? finishExit : undefined, OVERLAY_FADE_DURATION_MS);

  useEffect(() => {
    if (initialized && customerPrivacy) {
      const consent = customerPrivacy.currentVisitorConsent();
      // Both "yes" and "no" are completed choices. A browser's sale-of-data
      // opt-out alone does not mean the visitor has chosen cookie settings.
      const hasSavedChoice = [
        consent.analytics,
        consent.marketing,
        consent.preferences,
      ].some((choice) => choice === 'yes' || choice === 'no');
      setRequired(!hasSavedChoice && customerPrivacy.shouldShowBanner());
    }
  }, [initialized, customerPrivacy]);

  useEffect(
    () => () => {
      if (pendingRequest.current !== null) {
        clearTimeout(pendingRequest.current);
        pendingRequest.current = null;
      }
    },
    [],
  );

  function saveConsent(accepted: boolean) {
    if (
      !customerPrivacy ||
      !initialized ||
      isExiting ||
      pendingRequest.current !== null
    ) {
      return;
    }
    setSaving(true);
    setError('');
    const timeout = setTimeout(() => {
      pendingRequest.current = null;
      setSaving(false);
      setError('Your choice could not be saved. Please try again.');
    }, 8000);
    pendingRequest.current = timeout;

    function finish(result?: {error: string}) {
      // Ignore a callback from an expired request or an unmounted banner.
      if (pendingRequest.current !== timeout) return;
      clearTimeout(timeout);
      pendingRequest.current = null;
      setSaving(false);
      if (result?.error) {
        setError('Your choice could not be saved. Please try again.');
        return;
      }
      setIsExiting(true);
    }

    try {
      customerPrivacy.setTrackingConsent(
        {
          analytics: accepted,
          marketing: accepted,
          preferences: accepted,
          sale_of_data: false,
        },
        finish,
      );
    } catch {
      finish({error: 'Consent request failed'});
    }
  }

  // The full-screen dialogs own focus while open. Keep consent pending until
  // the visitor returns to an ordinary page rather than compete with them.
  if (!required || asideType !== 'closed' || isProductDetailPath(pathname)) {
    return null;
  }

  return (
    <section
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      aria-busy={saving}
      className={[
        isExiting ? FADE_CLASSES.overlay.exit : FADE_CLASSES.overlay.enter,
        'fixed inset-x-3 bottom-20 z-[80] mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-5 gap-y-0.5 max-h-[calc(100svh-5rem)] max-w-3xl overflow-y-auto rounded-md border border-ps2-white/15 bg-ps2-black/95 px-4 py-2 font-ps2 text-ps2-white sm:w-[calc(100vw-2.5rem)]',
      ].join(' ')}
    >
      <h2
        id="cookie-consent-title"
        className="text-sm leading-tight text-ps2-yellow col-start-1 row-start-1"
      >
        Cookies & privacy
      </h2>
      <p
        id="cookie-consent-description"
        className="col-start-1 row-start-2 text-xs leading-snug text-ps2-muted"
      >
        We use cookies to analyze website traffic.
      </p>
      <div className="col-start-2 row-start-2 flex items-baseline gap-x-4 text-xs">
        <button
          type="button"
          aria-label="Reject optional"
          disabled={!initialized || saving || isExiting}
          onClick={() => saveConsent(false)}
          className="min-h-7 py-1 text-ps2-muted/70 hover:text-ps2-cyan focus-visible:outline focus-visible:outline-ps2-cyan disabled:cursor-wait disabled:opacity-50 cursor-pointer disabled:underline-offset-0 cursor-pointer disabled:cursor-not-allowed"
        >
          Reject
        </button>
        <button
          type="button"
          aria-label="Accept optional"
          disabled={!initialized || saving || isExiting}
          onClick={() => saveConsent(true)}
          className="min-h-7 py-1 text-ps2-white hover:text-ps2-cyan focus-visible:outline focus-visible:outline-ps2-cyan disabled:cursor-wait disabled:opacity-50 cursor-pointer disabled:underline-offset-0 cursor-pointer disabled:cursor-not-allowed"
        >
          Accept
        </button>
      </div>
      {saving ? (
        <p role="status" className="col-span-full mt-1 text-xs text-ps2-muted">
          Saving your choice…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="col-span-full mt-1 text-xs text-ps2-yellow">
          {error}
        </p>
      ) : null}
    </section>
  );
}
