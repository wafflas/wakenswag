import {useEffect} from 'react';
import {useBlocker, useNavigation, type BlockerFunction} from 'react-router';

interface UseRouteExitTransitionResult {
  isBusy: boolean;
  isExiting: boolean;
  nextPathname?: string;
}

/**
 * Blocks matching navigations, exposes an exiting state for CSS animations,
 * then proceeds after `duration` (or immediately when reduced-motion is on).
 */
export function useRouteExitTransition(
  shouldTransition: BlockerFunction,
  duration: number | ((nextPathname: string) => number),
): UseRouteExitTransitionResult {
  const blocker = useBlocker(shouldTransition);
  const navigation = useNavigation();
  const proceed = blocker.state === 'blocked' ? blocker.proceed : undefined;
  const isExiting = blocker.state !== 'unblocked';
  const isBusy = isExiting || navigation.state !== 'idle';
  const nextPathname = blocker.location?.pathname;
  const durationMs =
    typeof duration === 'function' ? duration(nextPathname ?? '') : duration;

  useEffect(() => {
    if (!proceed) return undefined;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timeoutId = window.setTimeout(
      proceed,
      prefersReducedMotion ? 0 : durationMs,
    );

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, proceed]);

  return {isBusy, isExiting, nextPathname};
}
