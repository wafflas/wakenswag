import type {ReactNode} from 'react';

interface GenieTransitionProps {
  children: ReactNode;
  className?: string;
  isExiting?: boolean;
}

/**
 * Genie pop on enter, shrink on exit — for product imagery.
 */
export function GenieTransition({
  children,
  className,
  isExiting = false,
}: GenieTransitionProps) {
  return (
    <div
      className={[
        className,
        isExiting ? 'anim-genie-shrink' : 'anim-genie-pop',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
