import {forwardRef, type HTMLAttributes, type ReactNode} from 'react';

type FadeVariant = 'overlay' | 'route';

const FADE_CLASSES: Record<FadeVariant, {enter: string; exit: string}> = {
  overlay: {
    enter: 'anim-fade-in',
    exit: 'anim-fade-out pointer-events-none',
  },
  route: {
    enter: 'route-fade-transition route-fade-transition--in',
    exit: 'route-fade-transition route-fade-transition--out pointer-events-none',
  },
};

interface FadeTransitionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  isExiting?: boolean;
  /** `overlay` = 0.3s PDP fade; `route` = 0.5s page fade. */
  variant?: FadeVariant;
}

/**
 * Applies enter/exit opacity classes. Pair with `useRouteExitTransition`
 * (or local closing state) to drive `isExiting`.
 */
export const FadeTransition = forwardRef<HTMLDivElement, FadeTransitionProps>(
  function FadeTransition(
    {children, className, isExiting = false, variant = 'overlay', ...rest},
    ref,
  ) {
    const classes = FADE_CLASSES[variant];

    return (
      <div
        className={[className, isExiting ? classes.exit : classes.enter]
          .filter(Boolean)
          .join(' ')}
        ref={ref}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
