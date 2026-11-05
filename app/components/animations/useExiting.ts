import {useEffect} from 'react';

/** Completes an active exit after its animation, skipping the reduced-motion delay. */
export function useExiting(
  onExited: (() => void) | undefined,
  duration: number,
) {
  useEffect(() => {
    if (!onExited) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timeoutId = window.setTimeout(
      onExited,
      prefersReducedMotion ? 0 : duration,
    );

    return () => window.clearTimeout(timeoutId);
  }, [duration, onExited]);
}
