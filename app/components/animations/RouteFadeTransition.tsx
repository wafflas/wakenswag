import type {ReactNode} from 'react';
import type {BlockerFunction} from 'react-router';
import {ROUTE_FADE_DURATION_MS} from './constants';
import {FadeTransition} from './FadeTransition';
import {useRouteExitTransition} from './useRouteExitTransition';

interface RouteFadeTransitionProps {
  children: ReactNode;
  shouldTransition: BlockerFunction;
  duration?: number;
}

/**
 * Fades route content out before selected navigations and back in after the
 * destination has rendered. The route predicate keeps the effect opt-in.
 */
export function RouteFadeTransition({
  children,
  shouldTransition,
  duration = ROUTE_FADE_DURATION_MS,
}: RouteFadeTransitionProps) {
  const {isBusy, isExiting} = useRouteExitTransition(
    shouldTransition,
    duration,
  );

  return (
    <FadeTransition
      aria-busy={isBusy}
      isExiting={isExiting}
      variant="route"
    >
      {children}
    </FadeTransition>
  );
}
