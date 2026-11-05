import {useBlocker, useNavigation, type BlockerFunction} from 'react-router';
import {useExiting} from './useExiting';

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

  useExiting(proceed, durationMs);

  return {isBusy, isExiting, nextPathname};
}
